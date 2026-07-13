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

  core.executeAsModal(async (executionContext) => {
    const doc = app.activeDocument;
    const suspensionID = await executionContext.hostControl.suspendHistory({
      documentID: doc.id,
      name: "Export Color Theater",
    });

    let commitHistory = false;
    try {
      if (data.editing !== "yes") {
        await exportColorGrade(data);
      } else {
        await updateColorGrade(data);
      }

      commitHistory = true;
    } finally {
      await executionContext.hostControl.resumeHistory(suspensionID, commitHistory);
    }
  }, { commandName: "Export Color Theater" }).catch((err) => core.showAlert(err));
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
          contents: encodeMetadata(data.metadata || ""),
          position: { x: 0, y: 0 },
          fontSize: 1,
        })
      : await doc.createLayer(constants.LayerKind.TEXT, {
          contents: encodeMetadata(data.metadata || ""),
        });
  metadataLayer.name = "ct-metadata";
  if (metadataLayer.textItem) metadataLayer.textItem.size = 1;
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

async function updateColorGrade(data) {
  const parentDoc = app.activeDocument;
  const targetLayer = parentDoc.activeLayers[0];
  if (!targetLayer) throw new Error("Select a Color Theater Smart Object to update.");

  await action.batchPlay(
    [
      {
        _obj: "placedLayerEditContents",
        _options: { dialogOptions: "dontDisplay" },
      },
    ],
    {}
  );

  const smartDoc = app.activeDocument;
  try {
    const renderLayer = smartDoc.layers.find((layer) => layer.name === "render");
    const metadataLayer = smartDoc.layers.find((layer) => layer.name === "ct-metadata");
    if (!renderLayer || !metadataLayer) {
      throw new Error("Selected Smart Object is missing Color Theater render or metadata layers.");
    }

    await replaceLayerPixels(smartDoc, renderLayer, data);
    await updateTextLayer(metadataLayer, encodeMetadata(data.metadata || ""));
    await smartDoc.save();
  } finally {
    await smartDoc.closeWithoutSaving();
  }

  parentDoc.activeLayers = [targetLayer];
}

async function replaceLayerPixels(doc, layer, data) {
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

  try {
    await imaging.putPixels({
      documentID: doc.id,
      layerID: layer.id,
      imageData,
      replace: true,
    });
  } finally {
    imageData.dispose();
  }
}

async function updateTextLayer(layer, contents) {
  if (layer.textItem) {
    layer.textItem.contents = contents;
    layer.textItem.size = 1;
    return;
  }

  app.activeDocument.activeLayers = [layer];
  await action.batchPlay(
    [
      {
        _obj: "set",
        _target: [{ _ref: "textLayer", _enum: "ordinal", _value: "targetEnum" }],
        to: {
          _obj: "textLayer",
          textKey: contents,
        },
        _options: { dialogOptions: "dontDisplay" },
      },
    ],
    {}
  );
}

function readTextLayer(layer) {
  if (layer.textItem) return decodeMetadata(layer.textItem.contents || "");
  return "";
}

function encodeMetadata(value) {
  return "CTMETA:" + encodeURIComponent(value).replace(/(.{24})/g, "$1\n");
}

function decodeMetadata(value) {
  if (value.startsWith("CTMETA:")) {
    return decodeURIComponent(value.slice(7).replace(/\s+/g, ""));
  }

  return value
    .replace(/[\u201c\u201d]/g, "\"")
    .replace(/[\u2018\u2019]/g, "'");
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

    const doc = app.activeDocument;
    const editLayer = editing ? doc.activeLayers[0] : null;
    const wasVisible = editLayer?.visible;

    let imageData;
    try {
      if (editLayer) editLayer.visible = false;
      ({ imageData } = await imaging.getPixels({
        documentID: doc.id,
        applyAlpha: true,
      }));
    } finally {
      if (editLayer) editLayer.visible = wasVisible;
    }

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

  let preset = null;
  try {
    preset = await core.executeAsModal(async () => {
      const parentDoc = app.activeDocument;
      const targetLayer = parentDoc.activeLayers[0];
      if (!targetLayer) throw new Error("Select a Color Theater Smart Object to edit.");

      await action.batchPlay(
        [
          {
            _obj: "placedLayerEditContents",
            _options: { dialogOptions: "dontDisplay" },
          },
        ],
        {}
      );

      const smartDoc = app.activeDocument;
      try {
        const metadataLayer = smartDoc.layers.find((layer) => layer.name === "ct-metadata");
        if (!metadataLayer) throw new Error("Selected Smart Object is missing Color Theater metadata.");

        return readTextLayer(metadataLayer);
      } finally {
        await smartDoc.closeWithoutSaving();
        parentDoc.activeLayers = [targetLayer];
      }
    }, { commandName: "Edit Color Theater" });
  } catch (err) {
    core.showAlert(err);
    return;
  }

  await openModal(true, preset);
}

// ─── UI Button Bindings ──────────────────────────────────────────────

document.getElementById("launchBtn").addEventListener("click", () => openModal(false));
document.getElementById("editSelectedBtn").addEventListener("click", () => editLayer());

modal.addEventListener("close", () => {
  modalVisible = false;
  webViewLoaded = false;
});
