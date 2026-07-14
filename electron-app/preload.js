const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronColorTheater", {
    saveFile: (options) => ipcRenderer.invoke("save-file", options),
});
