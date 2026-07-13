import { gradeState, previewRefs } from "../state.svelte";
import { exportPreset } from "./builtInPresets";

export async function handlePhotoshopExport() {
    const canvas = previewRefs.canvas;
    if (!canvas) return;

    const imageData = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);

    window.uxpHost.postMessage({
        type: "export",
        metadata: exportPreset(gradeState),
        pixelsBase64: uint8ArrayToBase64(new Uint8Array(imageData.data.buffer)),
        width: canvas.width,
        height: canvas.height,
    });
}

function uint8ArrayToBase64(bytes) {
    let value = "";
    const CHUNK = 32766;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        let binary = "";
        const chunk = bytes.subarray(i, i + CHUNK);
        for (let j = 0; j < chunk.length; j++) {
            binary += String.fromCharCode(chunk[j]);
        }
        value += btoa(binary);
    }
    return value;
}
