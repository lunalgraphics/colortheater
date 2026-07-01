/**
 * Built-in presets as plain objects matching the gradeState shape.
 * Values are in display units (percentages, hex colors).
 */
export const builtInPresets = [
    {
        name: "Default",
        values: {
            brightness: 100, contrast: 100, saturation: 100, sepia: 0,
            colorMatrix: [[100,0,0,0,0],[0,100,0,0,0],[0,0,100,0,0],[0,0,0,100,0]],
            tintColor: "#808080", tintAmount: 0,
            highlightColor: "#808080", highlightAmount: 0,
            shadowColor: "#808080", shadowAmount: 0,
            vignetteColor: "#000000", vignetteSize: 50, vignetteOpacity: 0, vignetteBlending: "multiply",
        },
    },
    {
        name: "Black & White Film",
        values: {
            brightness: 80, contrast: 133, saturation: 100, sepia: 0,
            colorMatrix: [[33,33,33,0,20],[33,33,33,0,20],[33,33,33,0,20],[0,0,0,100,0]],
            tintColor: "#004080", tintAmount: 0,
            highlightColor: "#ff5400", highlightAmount: 0,
            shadowColor: "#0081ff", shadowAmount: 0,
            vignetteColor: "#000000", vignetteSize: 50, vignetteOpacity: 0, vignetteBlending: "multiply",
        },
    },
    {
        name: "Golden Hour",
        values: {
            brightness: 105, contrast: 105, saturation: 80, sepia: 10,
            colorMatrix: [[100,0,0,0,0],[0,100,0,0,0],[0,0,90,0,0],[0,0,0,100,0]],
            tintColor: "#004080", tintAmount: 20,
            highlightColor: "#ff5400", highlightAmount: 40,
            shadowColor: "#0081ff", shadowAmount: 25,
            vignetteColor: "#000000", vignetteSize: 70, vignetteOpacity: 70, vignetteBlending: "soft-light",
        },
    },
    {
        name: "Scarlet Carson",
        values: {
            brightness: 100, contrast: 100, saturation: 100, sepia: 0,
            colorMatrix: [[80,15,10,0,-8],[33,33,33,0,0],[33,33,33,0,0],[0,0,0,100,0]],
            tintColor: "#800000", tintAmount: 42,
            highlightColor: "#ff5400", highlightAmount: 0,
            shadowColor: "#0081ff", shadowAmount: 0,
            vignetteColor: "#000000", vignetteSize: 50, vignetteOpacity: 0, vignetteBlending: "multiply",
        },
    },
    {
        name: "Parchment Dream",
        values: {
            brightness: 100, contrast: 100, saturation: 80, sepia: 0,
            colorMatrix: [[100,0,0,0,0],[0,100,0,0,0],[0,0,100,0,0],[0,0,0,100,0]],
            tintColor: "#805100", tintAmount: 73,
            highlightColor: "#ff5400", highlightAmount: 20,
            shadowColor: "#0081ff", shadowAmount: 30,
            vignetteColor: "#000000", vignetteSize: 50, vignetteOpacity: 0, vignetteBlending: "multiply",
        },
    },
    {
        name: "Blue Medallion",
        values: {
            brightness: 100, contrast: 100, saturation: 70, sepia: 0,
            colorMatrix: [[100,0,0,0,0],[0,100,0,0,0],[0,0,100,0,0],[0,0,0,100,0]],
            tintColor: "#004080", tintAmount: 20,
            highlightColor: "#ffe600", highlightAmount: 35,
            shadowColor: "#4066bf", shadowAmount: 53,
            vignetteColor: "#000000", vignetteSize: 50, vignetteOpacity: 0, vignetteBlending: "multiply",
        },
    },
    {
        name: "Morning Blues",
        values: {
            brightness: 110, contrast: 100, saturation: 80, sepia: 0,
            colorMatrix: [[100,0,0,0,0],[0,100,0,0,0],[0,0,100,0,0],[0,0,0,100,0]],
            tintColor: "#005580", tintAmount: 30,
            highlightColor: "#00ddff", highlightAmount: 20,
            shadowColor: "#004cff", shadowAmount: 20,
            vignetteColor: "#000000", vignetteSize: 50, vignetteOpacity: 0, vignetteBlending: "multiply",
        },
    },
    {
        name: "Integral Anomaly",
        values: {
            brightness: 95, contrast: 100, saturation: 70, sepia: 0,
            colorMatrix: [[100,0,0,0,0],[0,100,0,0,0],[0,0,100,0,0],[0,0,0,100,0]],
            tintColor: "#008024", tintAmount: 19,
            highlightColor: "#b8d71d", highlightAmount: 30,
            shadowColor: "#35b69c", shadowAmount: 50,
            vignetteColor: "#000000", vignetteSize: 50, vignetteOpacity: 0, vignetteBlending: "multiply",
        },
    },
    {
        name: "Dark Sky",
        values: {
            brightness: 88, contrast: 120, saturation: 50, sepia: 0,
            colorMatrix: [[100,0,0,0,0],[0,100,10,0,0],[0,0,120,0,0],[0,0,0,100,0]],
            tintColor: "#004080", tintAmount: 0,
            highlightColor: "#ffdd00", highlightAmount: 0,
            shadowColor: "#ff3300", shadowAmount: 12,
            vignetteColor: "#000000", vignetteSize: 50, vignetteOpacity: 0, vignetteBlending: "multiply",
        },
    },
    {
        name: "Light of Dusk",
        values: {
            brightness: 95, contrast: 111, saturation: 100, sepia: 0,
            colorMatrix: [[100,0,0,0,4],[0,100,0,0,0],[0,0,100,0,0],[0,0,0,100,0]],
            tintColor: "#004080", tintAmount: 0,
            highlightColor: "#ff7b00", highlightAmount: 20,
            shadowColor: "#7300ff", shadowAmount: 20,
            vignetteColor: "#000000", vignetteSize: 56, vignetteOpacity: 56, vignetteBlending: "overlay",
        },
    },
    {
        name: "Gotham",
        values: {
            brightness: 85, contrast: 128, saturation: 25, sepia: 0,
            colorMatrix: [[120,0,0,0,10],[0,110,0,0,10],[0,0,100,0,10],[0,0,0,100,0]],
            tintColor: "#004080", tintAmount: 0,
            highlightColor: "#ff5400", highlightAmount: 0,
            shadowColor: "#0081ff", shadowAmount: 0,
            vignetteColor: "#000000", vignetteSize: 50, vignetteOpacity: 50, vignetteBlending: "overlay",
        },
    },
    {
        name: "Rockport",
        values: {
            brightness: 104, contrast: 100, saturation: 67, sepia: 15,
            colorMatrix: [[100,0,0,0,0],[0,100,0,0,0],[0,0,100,0,0],[0,0,0,100,0]],
            tintColor: "#805000", tintAmount: 61,
            highlightColor: "#d98e26", highlightAmount: 26,
            shadowColor: "#2579da", shadowAmount: 43,
            vignetteColor: "#000000", vignetteSize: 69, vignetteOpacity: 19, vignetteBlending: "multiply",
        },
    },
    {
        name: "Monet",
        values: {
            brightness: 93, contrast: 70, saturation: 114, sepia: 0,
            colorMatrix: [[100,0,0,0,0],[0,95,0,0,0],[0,10,111,0,0],[0,0,0,100,0]],
            tintColor: "#007680", tintAmount: 36,
            highlightColor: "#9bc23d", highlightAmount: 40,
            shadowColor: "#194ce6", shadowAmount: 61,
            vignetteColor: "#000000", vignetteSize: 50, vignetteOpacity: 0, vignetteBlending: "soft-light",
        },
    },
];

/**
 * Apply a preset's values to the gradeState object.
 * @param {object} state - The gradeState reactive object
 * @param {object} preset - A preset object from builtInPresets
 */
export function applyPreset(state, preset) {
    const v = preset.values;
    state.brightness = v.brightness;
    state.contrast = v.contrast;
    state.saturation = v.saturation;
    state.sepia = v.sepia;
    state.colorMatrix = v.colorMatrix.map(row => [...row]);
    state.tintColor = v.tintColor;
    state.tintAmount = v.tintAmount;
    state.highlightColor = v.highlightColor;
    state.highlightAmount = v.highlightAmount;
    state.shadowColor = v.shadowColor;
    state.shadowAmount = v.shadowAmount;
    state.vignetteColor = v.vignetteColor;
    state.vignetteSize = v.vignetteSize;
    state.vignetteOpacity = v.vignetteOpacity;
    state.vignetteBlending = v.vignetteBlending;
}

/**
 * Serialize the current gradeState to a JSON preset string.
 * @param {object} state - The gradeState reactive object
 * @returns {string} JSON string
 */
export function exportPreset(state) {
    return JSON.stringify({
        version: 2,
        brightness: state.brightness,
        contrast: state.contrast,
        saturation: state.saturation,
        sepia: state.sepia,
        colorMatrix: state.colorMatrix,
        tintColor: state.tintColor,
        tintAmount: state.tintAmount,
        highlightColor: state.highlightColor,
        highlightAmount: state.highlightAmount,
        shadowColor: state.shadowColor,
        shadowAmount: state.shadowAmount,
        vignetteColor: state.vignetteColor,
        vignetteSize: state.vignetteSize,
        vignetteOpacity: state.vignetteOpacity,
        vignetteBlending: state.vignetteBlending,
    }, null, 2);
}

/**
 * Import a preset from either the new JSON format (v2) or legacy .ctxml format.
 * @param {string} text - Raw file content
 * @param {object} state - The gradeState reactive object
 */
export function importPreset(text, state) {
    // Try JSON first (v2 format)
    try {
        const data = JSON.parse(text);
        if (data.version === 2) {
            state.brightness = data.brightness;
            state.contrast = data.contrast;
            state.saturation = data.saturation;
            state.sepia = data.sepia;
            state.colorMatrix = data.colorMatrix.map(row => [...row]);
            state.tintColor = data.tintColor;
            state.tintAmount = data.tintAmount;
            state.highlightColor = data.highlightColor;
            state.highlightAmount = data.highlightAmount;
            state.shadowColor = data.shadowColor;
            state.shadowAmount = data.shadowAmount;
            state.vignetteColor = data.vignetteColor;
            state.vignetteSize = data.vignetteSize;
            state.vignetteOpacity = data.vignetteOpacity;
            state.vignetteBlending = data.vignetteBlending;
            return;
        }
    } catch {
        // Not JSON — fall through to legacy XML parser
    }

    // Legacy .ctxml format
    const parser = new DOMParser();
    const xDoc = parser.parseFromString(text, "text/xml");

    const basicAdjNode = xDoc.querySelector("basicAdj");
    if (basicAdjNode) {
        state.brightness = parseFloat(basicAdjNode.getAttribute("brightness")) || 100;
        state.contrast = parseFloat(basicAdjNode.getAttribute("contrast")) || 100;
        state.saturation = parseFloat(basicAdjNode.getAttribute("saturate")) || 100;
        state.sepia = parseFloat(basicAdjNode.getAttribute("sepia")) || 0;
    }

    const splitNode = xDoc.querySelector("splitToning");
    if (splitNode) {
        state.highlightColor = splitNode.getAttribute("hColor") || "#ff5400";
        state.highlightAmount = parseFloat(splitNode.getAttribute("hAmnt")) || 0;
        state.shadowColor = splitNode.getAttribute("sColor") || "#0081ff";
        state.shadowAmount = parseFloat(splitNode.getAttribute("sAmnt")) || 0;
    }

    const cMatrixNode = xDoc.querySelector("cMatrix");
    if (cMatrixNode) {
        const newMatrix = [[100,0,0,0,0],[0,100,0,0,0],[0,0,100,0,0],[0,0,0,100,0]];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 5; col++) {
                const cell = cMatrixNode.querySelector(`#cell${row}${col}`);
                if (cell) {
                    newMatrix[row][col] = parseFloat(cell.textContent) || 0;
                }
            }
        }
        state.colorMatrix = newMatrix;
    }

    const vigNode = xDoc.querySelector("vignette");
    if (vigNode) {
        state.vignetteColor = vigNode.getAttribute("color") || "#000000";
        state.vignetteSize = parseFloat(vigNode.getAttribute("scale")) || 50;
        state.vignetteOpacity = parseFloat(vigNode.getAttribute("fill")) || 0;
        state.vignetteBlending = vigNode.getAttribute("blending") || "multiply";
    }

    const tintNode = xDoc.querySelector("tint");
    if (tintNode) {
        state.tintColor = tintNode.getAttribute("color") || "#004080";
        state.tintAmount = parseFloat(tintNode.getAttribute("fill")) || 0;
    }
}
