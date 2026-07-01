export default function convertCubeToICC(cubeText) {
    const lines = cubeText.split('\n');
    let N = 0;
    const points = [];
    
    // 1. Parse .CUBE text file
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || line.startsWith('#')) continue;
        
        if (line.startsWith('LUT_3D_SIZE')) {
            N = parseInt(line.split(/\s+/)[1], 10);
            continue;
        }
        
        let parts = line.split(/\s+/);
        if (parts.length === 3) {
            let r = parseFloat(parts[0]);
            let g = parseFloat(parts[1]);
            let b = parseFloat(parts[2]);
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                points.push([r, g, b]);
            }
        }
    }
    
    if (!N || points.length < N * N * N) {
        throw new Error("Invalid CUBE file structure or missing size/points data.");
    }
    
    // 2. Remap CUBE data to a 3D coordinate space [blue][green][red]
    const lut = [];
    for (let b = 0; b < N; b++) {
        lut[b] = [];
        for (let g = 0; g < N; g++) {
            lut[b][g] = [];
            for (let r = 0; r < N; r++) {
                let idx = b * N * N + g * N + r;
                lut[b][g][r] = points[idx];
            }
        }
    }
    
    // 3. Compute precise byte positions (ICC v2 layout)
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
    
    // --- Tag Table (3 tags required) ---
    view.setUint32(128, 3, false); // Tag count
    
    // Tag 1: 'desc' (Description)
    view.setUint32(132, 0x64657363, false); // Signature
    view.setUint32(136, 168, false);        // Data offset
    view.setUint32(140, 104, false);        // Size
    
    // Tag 2: 'cprt' (Copyright)
    view.setUint32(144, 0x63707274, false); // Signature
    view.setUint32(148, 272, false);        // Data offset
    view.setUint32(152, 20, false);         // Size
    
    // Tag 3: 'A2B0' (The LUT Grid Data)
    view.setUint32(156, 0x41324230, false); // Signature
    view.setUint32(160, 292, false);        // Data offset
    view.setUint32(164, 88 + (N * N * N * 6), false); // Size
    
    // --- Populate Tag Data ---
    // 'desc' Data Area (Offset 168)
    view.setUint32(168, 0x64657363, false); 
    view.setUint32(176, 12, false); // Text string length
    const descStr = "Photopea LUT";
    for (let i = 0; i < descStr.length; i++) {
        view.setUint8(180 + i, descStr.charCodeAt(i));
    }
    
    // 'cprt' Data Area (Offset 272)
    view.setUint32(272, 0x74657874, false); // 'text' type
    const cprtStr = "Copyright";
    for (let i = 0; i < cprtStr.length; i++) {
        view.setUint8(280 + i, cprtStr.charCodeAt(i));
    }
    
    // 'A2B0' Data Area (Offset 292)
    view.setUint32(292, 0x6d667431, false); // 'mft1' type (lut16Type)
    view.setUint8(300, 3);                 // Input channels
    view.setUint8(301, 3);                 // Output channels
    view.setUint8(302, N);                 // Grid count per dimension
    
    // Identity 3x3 Matrix for RGB -> RGB transformation
    view.setUint32(304, 0x00010000, false); // m11 = 1.0
    view.setUint32(320, 0x00010000, false); // m22 = 1.0
    view.setUint32(336, 0x00010000, false); // m33 = 1.0
    
    view.setUint16(340, 2, false); // 2 elements in input curve tables
    view.setUint16(342, 2, false); // 2 elements in output curve tables
    
    // Input Curve Tables (Linear Identity)
    view.setUint16(344, 0x0000, false); view.setUint16(346, 0xFFFF, false);
    view.setUint16(348, 0x0000, false); view.setUint16(350, 0xFFFF, false);
    view.setUint16(352, 0x0000, false); view.setUint16(354, 0xFFFF, false);
    
    // 3D CLUT Data Area (Flipped coordinates: Red slowest -> Blue fastest)
    let clutOffset = 356;
    for (let r = 0; r < N; r++) {
        for (let g = 0; g < N; g++) {
            for (let b = 0; b < N; b++) {
                const val = lut[b][g][r];
                // Clamp and scale float (0.0 - 1.0) to UInt16 (0 - 65535)
                const uintR = Math.max(0, Math.min(65535, Math.round(val[0] * 65535)));
                const uintG = Math.max(0, Math.min(65535, Math.round(val[1] * 65535)));
                const uintB = Math.max(0, Math.min(65535, Math.round(val[2] * 65535)));
                
                view.setUint16(clutOffset, uintR, false);
                view.setUint16(clutOffset + 2, uintG, false);
                view.setUint16(clutOffset + 4, uintB, false);
                clutOffset += 6;
            }
        }
    }
    
    // Output Curve Tables (Linear Identity)
    view.setUint16(clutOffset, 0x0000, false);      view.setUint16(clutOffset + 2, 0xFFFF, false);
    view.setUint16(clutOffset + 4, 0x0000, false);  view.setUint16(clutOffset + 6, 0xFFFF, false);
    view.setUint16(clutOffset + 8, 0x0000, false);  view.setUint16(clutOffset + 10, 0xFFFF, false);
    
    return new Uint8Array(buffer);
}