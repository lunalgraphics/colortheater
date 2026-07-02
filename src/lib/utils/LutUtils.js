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
 * Generates an ICC DeviceLink profile (v2.4) by running newPreview on a
 * synthetic identity-color strip and encoding the graded output directly
 * into the ICC binary format.
 *
 * @param {number} gridSize - The LUT grid size (e.g. 17, 33, 65)
 * @param {object} state - A gradeState-like object (from state.svelte.js)
 * @returns {Uint8Array} The ICC profile binary data
 */
export function generateIccLUT(gridSize, state) {
    const totalEntries = gridSize * gridSize * gridSize;

    // 1. Clone the state and disable vignette so it doesn't affect color mapping
    const lutState = { ...state };
    lutState.vignetteOpacity = 0;
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

    // 3. Apply newPreview to produce graded output
    const outputCanvas = document.createElement("canvas");
    newPreview(outputCanvas, inputCanvas, lutState);

    // 4. Read back the graded pixels
    const outputCtx = outputCanvas.getContext("2d");
    const outputData = outputCtx.getImageData(0, 0, totalEntries, 1).data;

    // 5. Build the ICC profile binary (v2.4 DeviceLink, lut16Type A2B0)
    const N = gridSize;
    const totalSize = 380 + (N * N * N * 6);
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    // --- 128-byte ICC Header ---
    view.setUint32(0, totalSize, false);   // Total Profile Size
    view.setUint32(8, 0x02400000, false);  // Version 2.4.0
    view.setUint32(12, 0x6c696e6b, false); // Class: 'link' (DeviceLink)
    view.setUint32(16, 0x52474220, false); // Color Space: 'RGB '
    view.setUint32(20, 0x52474220, false); // Connection Space: 'RGB '
    view.setUint16(24, 2026, false);       // Created Date: Year
    view.setUint16(26, 1, false);          // Month
    view.setUint16(28, 1, false);          // Day
    view.setUint32(36, 0x61637370, false); // Magic Signature: 'acsp'
    view.setUint32(68, 0x0000f6d6, false); // D50 Illuminant X
    view.setUint32(72, 0x00010000, false); // D50 Illuminant Y
    view.setUint32(76, 0x0000d32d, false); // D50 Illuminant Z

    // --- Tag Table (3 tags) ---
    view.setUint32(128, 3, false);

    // Tag 1: 'desc' (Description)
    view.setUint32(132, 0x64657363, false);
    view.setUint32(136, 168, false);
    view.setUint32(140, 104, false);

    // Tag 2: 'cprt' (Copyright)
    view.setUint32(144, 0x63707274, false);
    view.setUint32(148, 272, false);
    view.setUint32(152, 20, false);

    // Tag 3: 'A2B0' (The LUT Grid Data)
    view.setUint32(156, 0x41324230, false);
    view.setUint32(160, 292, false);
    view.setUint32(164, 88 + (N * N * N * 6), false);

    // --- Tag Data ---
    // 'desc' (Offset 168)
    view.setUint32(168, 0x64657363, false);
    view.setUint32(176, 16, false); // Text string length
    const descStr = "ColorTheater LUT";
    for (let i = 0; i < descStr.length; i++) {
        view.setUint8(180 + i, descStr.charCodeAt(i));
    }

    // 'cprt' (Offset 272)
    view.setUint32(272, 0x74657874, false); // 'text' type
    const cprtStr = "Copyright";
    for (let i = 0; i < cprtStr.length; i++) {
        view.setUint8(280 + i, cprtStr.charCodeAt(i));
    }

    // 'A2B0' (Offset 292) - lut16Type ('mft1')
    view.setUint32(292, 0x6d667431, false); // 'mft1'
    view.setUint8(300, 3);                  // Input channels
    view.setUint8(301, 3);                  // Output channels
    view.setUint8(302, N);                  // Grid points per dimension

    // Identity 3x3 matrix
    view.setUint32(304, 0x00010000, false); // m11 = 1.0
    view.setUint32(320, 0x00010000, false); // m22 = 1.0
    view.setUint32(336, 0x00010000, false); // m33 = 1.0

    view.setUint16(340, 2, false); // Input curve table entries
    view.setUint16(342, 2, false); // Output curve table entries

    // Input curve tables (linear identity)
    view.setUint16(344, 0x0000, false); view.setUint16(346, 0xFFFF, false);
    view.setUint16(348, 0x0000, false); view.setUint16(350, 0xFFFF, false);
    view.setUint16(352, 0x0000, false); view.setUint16(354, 0xFFFF, false);

    // 3D CLUT data (Red slowest, Green medium, Blue fastest for ICC)
    // The input pixels are ordered as: Blue slowest, Green medium, Red fastest (.cube order)
    // ICC needs: Red slowest, Green medium, Blue fastest
    let clutOffset = 356;
    for (let r = 0; r < N; r++) {
        for (let g = 0; g < N; g++) {
            for (let b = 0; b < N; b++) {
                // Find the index in the .cube-ordered output data
                const cubeIdx = b * N * N + g * N + r;
                const pixelOffset = cubeIdx * 4;

                // Scale 8-bit pixel values to 16-bit
                const uintR = Math.round((outputData[pixelOffset] / 255) * 65535);
                const uintG = Math.round((outputData[pixelOffset + 1] / 255) * 65535);
                const uintB = Math.round((outputData[pixelOffset + 2] / 255) * 65535);

                view.setUint16(clutOffset, uintR, false);
                view.setUint16(clutOffset + 2, uintG, false);
                view.setUint16(clutOffset + 4, uintB, false);
                clutOffset += 6;
            }
        }
    }

    // Output curve tables (linear identity)
    view.setUint16(clutOffset, 0x0000, false);     view.setUint16(clutOffset + 2, 0xFFFF, false);
    view.setUint16(clutOffset + 4, 0x0000, false); view.setUint16(clutOffset + 6, 0xFFFF, false);
    view.setUint16(clutOffset + 8, 0x0000, false); view.setUint16(clutOffset + 10, 0xFFFF, false);

    return new Uint8Array(buffer);
}