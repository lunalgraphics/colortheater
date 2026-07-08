/**
 * Progen Flares 2 — Photoshop UXP Plugin Entry Point
 *
 * Handles communication between the Photoshop host and the embedded
 * WebView that runs the Svelte flare editor UI. Manages layer creation,
 * smart object editing, and preset persistence.
 */

const { app, core, imaging, constants, action } = require("photoshop");
const { storage } = require("uxp");

// ─── DOM References ──────────────────────────────────────────────────

const webView = document.getElementById("container");
/** @type {HTMLDialogElement} */
const modal = document.getElementById("dialog");

// ─── State ───────────────────────────────────────────────────────────

let webViewLoaded = false;
let modalVisible = false;

// ─── WebView Message Handling ────────────────────────────────────────

window.addEventListener("message", (e) => {
  if (typeof e.data === "string") e.data = JSON.parse(e.data);

  switch (e.data.type) {
    case "webViewLoaded":
      webViewLoaded = true;
      break;

    case "export":
      handleExport(e.data);
      break;
  }
});

function handleExport(data) {
  modal.close();

  // TODO: implement history state freeze (combine all export actions into one history state)

  core.executeAsModal(async () => {
    if (data.editing !== "yes") {
      await exportColorGrade(data.preset);
    } else {
      // TODO: update existing color grade group (create new function)
    }
  }).catch((err) => core.showAlert(err));
}

async function exportColorGrade(preset) {
  // TODO: add group with metadata layer, color lookup, and vignette layer. Same logic as Photopea export.
}

// ─── WebView Lifecycle ───────────────────────────────────────────────

/**
 * Returns a promise that resolves once the WebView reports it's loaded.
 */
function waitForWebViewLoaded() {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (webViewLoaded) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}

async function openModal(editing = false, preset = null) {
  if (modalVisible) return;

  core.executeAsModal(async () => {
    if (app.documents.length === 0) {
      core.showAlert("Open a document to use Color Theater.");
      return;
    }

    const { imageData } = await imaging.getPixels({
      documentID: app.activeDocument.id,
      applyAlpha: true,
    });

    modal.uxpShowModal({
      title: "Color Theater",
      resize: "both",
      size: { width: 1280, height: 720 },
    });
    modalVisible = true;
    webView.src = "plugin:/webview-contents/index.html";

    const b64 = await imaging.encodeImageData({ imageData, base64: true });
    const imgUrl = "data:image/jpeg;base64," + b64;

    await waitForWebViewLoaded();

    webView.postMessage({
      type: "init",
      editing: editing ? "yes" : "no",
      baseImg: imgUrl,
      preset,
    });
  }).catch((err) => core.showAlert(err));
}

async function editLayer() {
  if (app.documents.length === 0) {
    core.showAlert("Open a document to use Color Theater.");
    return;
  }

  const layer = app.activeDocument.activeLayers[0];

  // TODO: read metadata layer from group (selected group or parent of selected layer)
}

// ─── UI Button Bindings ──────────────────────────────────────────────

document.getElementById("launchBtn").addEventListener("click", () => openModal(false));
document.getElementById("editSelectedBtn").addEventListener("click", () => editLayer());

modal.addEventListener("close", () => {
  modalVisible = false;
  webViewLoaded = false;
});