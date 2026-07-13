/**
 * Progen Flares 2 — Photoshop UXP Plugin Entry Point
 *
 * Handles communication between the Photoshop host and the embedded
 * WebView that runs the Svelte flare editor UI. Manages layer creation,
 * smart object editing, and preset persistence.
 */

const { app, core, imaging, constants, action } = require("photoshop");

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
      await exportColorGrade(data);
    } else {
      // TODO: update existing color grade group (create new function)
    }
  }).catch((err) => core.showAlert(err));
}

async function exportColorGrade(data) {
  const doc = app.activeDocument;
  if (!data.pixelsBase64) {
    throw new Error("Export payload is missing rendered pixels. Rebuild and reload the Photoshop plugin webview.");
  }

  const pixels = base64ToUint8Array(data.pixelsBase64);
  const imageData = await imaging.createImageDataFromBuffer(pixels, {
    width: data.width || doc.width,
    height: data.height || doc.height,
    components: 4,
    chunky: true,
    colorSpace: "RGB",
  });

  const renderLayer = await doc.createLayer(constants.LayerKind.NORMAL, {
    name: "render",
  });
  await imaging.putPixels({
    documentID: doc.id,
    layerID: renderLayer.id,
    imageData,
    replace: true,
  });
  imageData.dispose();
  renderLayer.bringToFront();

  const metadataLayer =
    typeof doc.createTextLayer === "function"
      ? await doc.createTextLayer({
          contents: data.metadata || "",
          position: { x: 0, y: 0 },
          fontSize: 12,
        })
      : await doc.createLayer(constants.LayerKind.TEXT, {
          contents: data.metadata || "",
        });
  metadataLayer.name = "ct-metadata";
  metadataLayer.visible = false;
  metadataLayer.bringToFront();

  doc.activeLayers = [renderLayer, metadataLayer];
  await action.batchPlay(
    [
      {
        _obj: "newPlacedLayer",
        _isCommand: true,
        _options: { dialogOptions: "dontDisplay" },
      },
    ],
    {}
  );

  doc.activeLayers[0].name = "Color Theater";
}

function base64ToUint8Array(value) {
  const lookup = new Uint8Array(256);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  for (let i = 0; i < alphabet.length; i++) lookup[alphabet.charCodeAt(i)] = i;

  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  const bytes = new Uint8Array((value.length * 3) / 4 - padding);
  let byteIndex = 0;

  for (let i = 0; i < value.length; i += 4) {
    const encoded =
      (lookup[value.charCodeAt(i)] << 18) |
      (lookup[value.charCodeAt(i + 1)] << 12) |
      (lookup[value.charCodeAt(i + 2)] << 6) |
      lookup[value.charCodeAt(i + 3)];

    if (byteIndex < bytes.length) bytes[byteIndex++] = (encoded >> 16) & 0xff;
    if (byteIndex < bytes.length) bytes[byteIndex++] = (encoded >> 8) & 0xff;
    if (byteIndex < bytes.length) bytes[byteIndex++] = encoded & 0xff;
  }

  return bytes;
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
