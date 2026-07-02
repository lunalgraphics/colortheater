let canvasSingleton;

/** @returns {HTMLCanvasElement} */
function getCanvas() {
    if (!canvasSingleton) {
        canvasSingleton = document.createElement("canvas");
    }
    return canvasSingleton;
}

export default function createVignetteBuffer(resolution, vignetteSize, vignetteColor) {
    const vBuffer = getCanvas();
    vBuffer.width = resolution;
    vBuffer.height = resolution;
    const vCtx = vBuffer.getContext("2d");
    vCtx.reset();
    const grad = vCtx.createRadialGradient(resolution / 2, resolution / 2, 0, resolution / 2, resolution / 2, resolution / 2);
    // Inner stop: transparent from center outward based on size
    const innerOffset = (100 - vignetteSize) / 100;
    grad.addColorStop(innerOffset, vignetteColor + "00");
    grad.addColorStop(1, vignetteColor);
    vCtx.fillStyle = grad;
    vCtx.fillRect(0, 0, resolution, resolution);
    return vBuffer;
}