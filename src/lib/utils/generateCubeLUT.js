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
