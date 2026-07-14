const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("fs/promises");
const path = require("path");

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        title: "Color Theater",
        webPreferences: {
            contextIsolation: true,
            sandbox: true,
            preload: path.join(__dirname, "preload.js"),
            devTools: !app.isPackaged
        }
    });

    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadFile(path.join(__dirname, "app/index.html"));
    mainWindow.on("page-title-updated", (e) => e.preventDefault());
    mainWindow.maximize();
}

app.whenReady().then(() => {
    ipcMain.handle("save-file", async (event, options) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        const result = await dialog.showSaveDialog(window, {
            defaultPath: options.defaultPath,
            filters: options.filters,
        });

        if (result.canceled || !result.filePath) return { canceled: true };

        const contents = options.base64
            ? Buffer.from(options.data, "base64")
            : Buffer.from(options.data, "utf8");

        await fs.writeFile(result.filePath, contents);

        const alertResult = await dialog.showMessageBox(window, {
            type: "info",
            message: "File saved",
            detail: result.filePath,
            buttons: ["OK", "View File Location"],
            defaultId: 0,
            cancelId: 0,
        });

        if (alertResult.response === 1) {
            shell.showItemInFolder(result.filePath);
        }

        return { canceled: false, filePath: result.filePath };
    });

    createWindow();

    // macOS: re-create window when dock icon is clicked and no windows exist
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    // On macOS, apps typically stay active until the user quits explicitly
    if (process.platform !== "darwin") {
        app.quit();
    }
});
