export async function saveElectronFile(options) {
    if (!window.electronColorTheater?.saveFile) {
        throw new Error("Electron save API is unavailable.");
    }

    return window.electronColorTheater.saveFile(options);
}
