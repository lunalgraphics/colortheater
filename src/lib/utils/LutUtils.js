import newPreview from "./canvStuff.js";

/**
 * Generates a .cube LUT file string by running newPreview on a synthetic
 * identity-color strip and reading back the graded output.
 *
 * @param {number} gridSize - The LUT grid size (e.g. 17, 33, 65)
 * @param {object} state - A gradeState-like object (from state.svelte.js)
 * @returns {string} The full contents of a .cube LUT file
 */
export function generateCubeLUT(gridSize, state) {
    const totalEntries = gridSize * gridSize * gridSize;

    // 1. Clone the state and disable vignette so it doesn't affect color mapping
    const lutState = { ...state };
    lutState.vignetteOpacity = 0;
    // Override image dimensions to match our 1-pixel-tall strip
    lutState.imageWidth = totalEntries;
    lutState.imageHeight = 1;

    // 2. Create a tiny canvas (width = totalEntries, height = 1) filled with
    //    the identity input colors for the LUT grid.
    //    Ordering: Red fastest, Green medium, Blue slowest (standard .cube order).
    const inputCanvas = document.createElement("canvas");
    inputCanvas.width = totalEntries;
    inputCanvas.height = 1;
    const inputCtx = inputCanvas.getContext("2d");
    const inputData = inputCtx.createImageData(totalEntries, 1);

    for (let idx = 0; idx < totalEntries; idx++) {
        const sliceSize = gridSize * gridSize;
        const b = Math.floor(idx / sliceSize);
        const g = Math.floor((idx % sliceSize) / gridSize);
        const r = idx % gridSize;

        // Normalize to 0–255 for canvas pixel data
        const rByte = Math.round((r / (gridSize - 1)) * 255);
        const gByte = Math.round((g / (gridSize - 1)) * 255);
        const bByte = Math.round((b / (gridSize - 1)) * 255);

        const offset = idx * 4;
        inputData.data[offset] = rByte;
        inputData.data[offset + 1] = gByte;
        inputData.data[offset + 2] = bByte;
        inputData.data[offset + 3] = 255;
    }
    inputCtx.putImageData(inputData, 0, 0);

    // 3. Apply newPreview to the input canvas to produce graded output
    const outputCanvas = document.createElement("canvas");
    newPreview(outputCanvas, inputCanvas, lutState);

    // 4. Read back the graded pixels
    const outputCtx = outputCanvas.getContext("2d");
    const outputData = outputCtx.getImageData(0, 0, totalEntries, 1).data;

    // 5. Build the .cube file string
    const lines = [];
    lines.push(`TITLE "ColorTheater LUT"`);
    lines.push(`LUT_3D_SIZE ${gridSize}`);
    lines.push("");

    for (let idx = 0; idx < totalEntries; idx++) {
        const offset = idx * 4;
        const rOut = (outputData[offset] / 255).toFixed(6);
        const gOut = (outputData[offset + 1] / 255).toFixed(6);
        const bOut = (outputData[offset + 2] / 255).toFixed(6);
        lines.push(`${rOut} ${gOut} ${bOut}`);
    }

    return lines.join("\n");
}

/**
 * Writes an ASCII string into a DataView at the given offset.
 * @param {DataView} view
 * @param {number} offset
 * @param {string} str
 */
function writeASCII(view, offset, str) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

/**
 * Rounds a byte offset up to the next 4-byte boundary.
 * ICC spec requires all tag data to start on a 4-byte boundary.
 * @param {number} n
 * @returns {number}
 */
function align4(n) {
    return (n + 3) & ~3;
}

/**
 * Builds a valid ICC v2 'desc' tag (descType, signature 0x64657363).
 *
 * Layout (ICC spec section 6.5.17):
 *   Bytes 0-3:   type signature 'desc'
 *   Bytes 4-7:   reserved (0)
 *   Bytes 8-11:  ASCII string length including null terminator (uint32 BE)
 *   Bytes 12...: ASCII string (null-terminated)
 *   Then: 4-byte Unicode language code (0), 4-byte Unicode length (0),
 *         2-byte ScriptCode (0), 1-byte Macintosh desc length (0), 67-byte Macintosh desc (zeros)
 *
 * Total minimum size = 12 + asciiLen + 4 + 4 + 2 + 1 + 67 = 90 + asciiLen
 *
 * @param {string} text - Description string (ASCII)
 * @returns {Uint8Array}
 */
function buildDescTag(text) {
    const asciiLen = text.length + 1; // include null terminator
    const size = 12 + asciiLen + 4 + 4 + 2 + 1 + 67;
    const buf = new ArrayBuffer(size);
    const view = new DataView(buf);
    view.setUint32(0, 0x64657363, false); // 'desc'
    view.setUint32(4, 0, false);           // reserved
    view.setUint32(8, asciiLen, false);    // ASCII string length
    writeASCII(view, 12, text);
    view.setUint8(12 + text.length, 0);    // null terminator
    // Unicode length code, unicode string length, scriptCode, Mac desc len, Mac desc = all zeros (already zeroed by ArrayBuffer)
    return new Uint8Array(buf);
}

/**
 * Builds a valid ICC v2 'cprt' tag (textType, signature 0x74657874).
 *
 * Layout:
 *   Bytes 0-3:   type signature 'text'
 *   Bytes 4-7:   reserved (0)
 *   Bytes 8...:  ASCII text (null-terminated)
 *
 * @param {string} text
 * @returns {Uint8Array}
 */
function buildCprtTag(text) {
    const size = 8 + text.length + 1;
    const buf = new ArrayBuffer(size);
    const view = new DataView(buf);
    view.setUint32(0, 0x74657874, false); // 'text'
    view.setUint32(4, 0, false);           // reserved
    writeASCII(view, 8, text);
    view.setUint8(8 + text.length, 0);     // null terminator
    return new Uint8Array(buf);
}

/**
 * Builds an ICC v2 lut16Type ('mft2') tag for an RGB→RGB DeviceLink.
 *
 * Layout (ICC spec section 10.10):
 *   Bytes 0-3:   type signature 'mft2' = 0x6D667432
 *   Bytes 4-7:   reserved (0)
 *   Byte  8:     number of input channels
 *   Byte  9:     number of output channels
 *   Byte  10:    number of grid points per channel
 *   Byte  11:    reserved (0)
 *   Bytes 12-47: 3x3 matrix as 9 × s15Fixed16Number (36 bytes total)
 *                s15Fixed16 = 32-bit signed, 1 bit sign, 15 bits integer, 16 bits fraction
 *                1.0 = 0x00010000
 *   Bytes 48-49: number of input table entries (uint16)
 *   Bytes 50-51: number of output table entries (uint16)
 *   Bytes 52...: input curve tables (inChannels × inEntries × uint16)
 *   Then:        3D CLUT data (N³ × outChannels × uint16), red index changes slowest
 *   Then:        output curve tables (outChannels × outEntries × uint16)
 *
 * @param {number} N - grid size
 * @param {Uint8ClampedArray} outputData - flat RGBA pixel data, ordered B-slowest/G-medium/R-fastest
 * @returns {Uint8Array}
 */
function buildLut16Tag(N, outputData) {
    const IN_CHANNELS = 3;
    const OUT_CHANNELS = 3;
    const IN_ENTRIES = 2;   // 2-entry linear identity curve (0x0000, 0xFFFF)
    const OUT_ENTRIES = 2;

    const inputTablesBytes = IN_CHANNELS * IN_ENTRIES * 2;   // 3 × 2 × 2 = 12
    const clutBytes = N * N * N * OUT_CHANNELS * 2;          // N³ × 3 × 2
    const outputTablesBytes = OUT_CHANNELS * OUT_ENTRIES * 2; // 3 × 2 × 2 = 12

    const size = 52 + inputTablesBytes + clutBytes + outputTablesBytes;
    const buf = new ArrayBuffer(size);
    const view = new DataView(buf);

    // Type signature and reserved
    view.setUint32(0, 0x6D667432, false); // 'mft2'
    view.setUint32(4, 0, false);

    // Channel counts and grid size
    view.setUint8(8, IN_CHANNELS);
    view.setUint8(9, OUT_CHANNELS);
    view.setUint8(10, N);
    view.setUint8(11, 0);

    // Identity 3×3 matrix (s15Fixed16: 1.0 = 0x00010000, 0.0 = 0x00000000)
    // Row-major: m[row][col], multiply input column vector on the right
    view.setInt32(12, 0x00010000, false); // m00 = 1.0
    view.setInt32(16, 0x00000000, false); // m01 = 0.0
    view.setInt32(20, 0x00000000, false); // m02 = 0.0
    view.setInt32(24, 0x00000000, false); // m10 = 0.0
    view.setInt32(28, 0x00010000, false); // m11 = 1.0
    view.setInt32(32, 0x00000000, false); // m12 = 0.0
    view.setInt32(36, 0x00000000, false); // m20 = 0.0
    view.setInt32(40, 0x00000000, false); // m21 = 0.0
    view.setInt32(44, 0x00010000, false); // m22 = 1.0

    // Curve entry counts
    view.setUint16(48, IN_ENTRIES, false);
    view.setUint16(50, OUT_ENTRIES, false);

    // Input curve tables: 3 channels × [0x0000, 0xFFFF] (linear identity)
    let pos = 52;
    for (let ch = 0; ch < IN_CHANNELS; ch++) {
        view.setUint16(pos, 0x0000, false); pos += 2;
        view.setUint16(pos, 0xFFFF, false); pos += 2;
    }

    // 3D CLUT — ICC mft2 axis order: first index (outermost loop) = channel 0 (Red),
    // last index (innermost loop) = channel 2 (Blue).
    // Our pixel buffer is in .cube order: B slowest, G medium, R fastest.
    // We remap: for each (r, g, b) in ICC order, look up pixel at cubeIdx = b*N²+g*N+r.
    for (let r = 0; r < N; r++) {
        for (let g = 0; g < N; g++) {
            for (let b = 0; b < N; b++) {
                const cubeIdx = b * N * N + g * N + r;
                const px = cubeIdx * 4;

                // Scale 0–255 to 0–65535
                const uintR = Math.round((outputData[px]     / 255) * 65535);
                const uintG = Math.round((outputData[px + 1] / 255) * 65535);
                const uintB = Math.round((outputData[px + 2] / 255) * 65535);

                view.setUint16(pos, uintR, false); pos += 2;
                view.setUint16(pos, uintG, false); pos += 2;
                view.setUint16(pos, uintB, false); pos += 2;
            }
        }
    }

    // Output curve tables: 3 channels × [0x0000, 0xFFFF] (linear identity)
    for (let ch = 0; ch < OUT_CHANNELS; ch++) {
        view.setUint16(pos, 0x0000, false); pos += 2;
        view.setUint16(pos, 0xFFFF, false); pos += 2;
    }

    return new Uint8Array(buf);
}

/**
 * Generates an ICC v2.4 DeviceLink profile (RGB→RGB) by running newPreview
 * on a synthetic identity-color strip and encoding the graded output into
 * a well-formed lut16Type (mft2) A2B0 tag.
 *
 * @param {number} gridSize - The LUT grid size (e.g. 17, 33, 65)
 * @param {object} state - A gradeState-like object (from state.svelte.js)
 * @returns {Uint8Array} The ICC profile binary data
 */
export function generateIccLUT(gridSize, state) {
    const N = gridSize;
    const totalEntries = N * N * N;

    // 1. Clone state and disable vignette
    const lutState = { ...state };
    lutState.vignetteOpacity = 0;
    lutState.imageWidth = totalEntries;
    lutState.imageHeight = 1;

    // 2. Build identity-color strip canvas (B slowest, G medium, R fastest — .cube order)
    const inputCanvas = document.createElement("canvas");
    inputCanvas.width = totalEntries;
    inputCanvas.height = 1;
    const inputCtx = inputCanvas.getContext("2d");
    const inputData = inputCtx.createImageData(totalEntries, 1);

    for (let idx = 0; idx < totalEntries; idx++) {
        const sliceSize = N * N;
        const b = Math.floor(idx / sliceSize);
        const g = Math.floor((idx % sliceSize) / N);
        const r = idx % N;

        const offset = idx * 4;
        inputData.data[offset]     = Math.round((r / (N - 1)) * 255);
        inputData.data[offset + 1] = Math.round((g / (N - 1)) * 255);
        inputData.data[offset + 2] = Math.round((b / (N - 1)) * 255);
        inputData.data[offset + 3] = 255;
    }
    inputCtx.putImageData(inputData, 0, 0);

    // 3. Apply grade
    const outputCanvas = document.createElement("canvas");
    newPreview(outputCanvas, inputCanvas, lutState);

    // 4. Read back graded pixels
    const outputCtx = outputCanvas.getContext("2d");
    const outputData = outputCtx.getImageData(0, 0, totalEntries, 1).data;

    // 5. Build the ICC tag data blobs
    const descTag  = buildDescTag("ColorTheater LUT");
    const cprtTag  = buildCprtTag("ColorTheater");
    const lut16Tag = buildLut16Tag(N, outputData);

    // 6. Compute tag offsets (all tags start after the 128-byte header + tag table).
    //    Tag table: 4 bytes (count) + 3 tags × 12 bytes = 40 bytes → tags start at offset 168.
    const TAG_COUNT = 3;
    const tagsStart = 128 + 4 + TAG_COUNT * 12; // = 168

    const descOffset  = tagsStart;
    const descSize    = descTag.byteLength;

    const cprtOffset  = align4(descOffset + descSize);
    const cprtSize    = cprtTag.byteLength;

    const lut16Offset = align4(cprtOffset + cprtSize);
    const lut16Size   = lut16Tag.byteLength;

    const totalSize   = lut16Offset + lut16Size;

    // 7. Assemble the full profile buffer
    const buffer = new ArrayBuffer(totalSize);
    const view   = new DataView(buffer);
    const bytes  = new Uint8Array(buffer);

    // --- 128-byte ICC v2.4 header ---
    view.setUint32(0,  totalSize, false);   // Profile size
    // Bytes 4-7: preferred CMM type (0)
    view.setUint32(8,  0x02400000, false);  // Version 2.4.0
    view.setUint32(12, 0x6C696E6B, false);  // Profile class: 'link' (DeviceLink)
    view.setUint32(16, 0x52474220, false);  // Data colour space: 'RGB '
    view.setUint32(20, 0x52474220, false);  // PCS: 'RGB ' (DeviceLink uses device space as PCS)
    // Date/time: bytes 24-35
    const now = new Date();
    view.setUint16(24, now.getUTCFullYear(), false);
    view.setUint16(26, now.getUTCMonth() + 1, false);
    view.setUint16(28, now.getUTCDate(), false);
    view.setUint16(30, now.getUTCHours(), false);
    view.setUint16(32, now.getUTCMinutes(), false);
    view.setUint16(34, now.getUTCSeconds(), false);
    view.setUint32(36, 0x61637370, false);  // Magic: 'acsp'
    // Primary platform (byte 40-43): 0 (unspecified)
    // Profile flags, device manufacturer, device model, device attributes: 0
    // Rendering intent (byte 64-67): 0 (perceptual)
    // D50 illuminant XYZ (bytes 68-79)
    view.setUint32(68, 0x0000F6D6, false);  // X = 0.9642
    view.setUint32(72, 0x00010000, false);  // Y = 1.0000
    view.setUint32(76, 0x0000D32D, false);  // Z = 0.8249

    // --- Tag table ---
    view.setUint32(128, TAG_COUNT, false);

    // Tag entry: [4-byte sig] [4-byte offset] [4-byte size]
    // Tag 1: 'desc'
    view.setUint32(132, 0x64657363, false);
    view.setUint32(136, descOffset,  false);
    view.setUint32(140, descSize,    false);

    // Tag 2: 'cprt'
    view.setUint32(144, 0x63707274, false);
    view.setUint32(148, cprtOffset,  false);
    view.setUint32(152, cprtSize,    false);

    // Tag 3: 'A2B0'
    view.setUint32(156, 0x41324230, false);
    view.setUint32(160, lut16Offset, false);
    view.setUint32(164, lut16Size,   false);

    // --- Copy tag data ---
    bytes.set(descTag,  descOffset);
    bytes.set(cprtTag,  cprtOffset);
    bytes.set(lut16Tag, lut16Offset);

    return bytes;
}