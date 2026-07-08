/**
 * Global reactive state for the color grading pipeline.
 * All values are stored in their "display" units (percentages, hex strings, etc.)
 * and converted to rendering units only in canvStuff.js.
 */

export const gradeState = $state({
    /** @type {string | null} Image data URI or object URL */
    imageSource: null,

    /** Image dimensions */
    imageWidth: 1920,
    imageHeight: 1280,

    /** Basic adjustments (percentage values, 100 = no change) */
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sepia: 0,

    /**
     * 4x5 color matrix (percentage values, 100 on diagonal = identity).
     * Row order: R, G, B, A. Column order: R, G, B, A, offset.
     * @type {number[][]}
     */
    colorMatrix: [
        [100, 0, 0, 0, 0],
        [0, 100, 0, 0, 0],
        [0, 0, 100, 0, 0],
        [0, 0, 0, 100, 0],
    ],

    /** Tint overlay */
    tintColor: "#004080",
    tintAmount: 0, // 0–200

    /** Split toning */
    highlightColor: "#ff5400",
    highlightAmount: 0, // 0–100
    shadowColor: "#0081ff",
    shadowAmount: 0, // 0–100

    /** Vignette */
    vignetteColor: "#000000",
    vignetteSize: 50, // 0–100
    vignetteOpacity: 0, // 0–100
    vignetteBlending: "multiply",
});

/**
 * Reset to default values.
 */
export function resetState() {
    gradeState.brightness = 100;
    gradeState.contrast = 100;
    gradeState.saturation = 100;
    gradeState.sepia = 0;
    gradeState.colorMatrix = [
        [100, 0, 0, 0, 0],
        [0, 100, 0, 0, 0],
        [0, 0, 100, 0, 0],
        [0, 0, 0, 100, 0],
    ];
    gradeState.tintColor = "#808080";
    gradeState.tintAmount = 0;
    gradeState.highlightColor = "#808080";
    gradeState.highlightAmount = 0;
    gradeState.shadowColor = "#808080";
    gradeState.shadowAmount = 0;
    gradeState.vignetteColor = "#000000";
    gradeState.vignetteSize = 50;
    gradeState.vignetteOpacity = 0;
    gradeState.vignetteBlending = "multiply";
}

/**
 * Shared references to the canvas and image elements for preview rendering.
 * Set by App.svelte, consumed by components that need to render previews (e.g. preset hover).
 */
export const previewRefs = {
    /** @type {HTMLCanvasElement | null} */
    canvas: null,
    /** @type {HTMLImageElement | null} */
    image: null,
};

/**
 * Build platform (standalone app vs. Photopea plugin vs. Photoshop plugin)
 */
export let buildConfig = $state({
    /** @type {"standalone" | "photopea" | "photoshop"} */
    platform: "standalone",
});