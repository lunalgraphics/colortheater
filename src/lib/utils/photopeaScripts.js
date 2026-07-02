import { generateIccLUT } from "./LutUtils";
import createVignetteBuffer from "../renderEngine/createVignetteBuffer";
import Photopea from "photopea";
import { gradeState } from "../state.svelte";
import { exportPreset } from "./builtInPresets";

let _photopeaObject;
let _vignetteCanvas;

/**
 * Handles a Photopea export request.
 */
export async function handlePhotopeaExport() {
    window.addEventListener("message", (e) => console.log(e.data))
    const pea = getPhotopeaObject();

    // Create group and metadata layer
    const metadataLayerName = (await pea.runScript(`
        const group = app.activeDocument.layerSets.add();
        group.move(app.activeDocument.layers[0], ElementPlacement.PLACEATBEGINNING);
        group.name = "Color Theater";

        const metadataLayer = group.artLayers.add();
        metadataLayer.kind = LayerKind.TEXT;
        metadataLayer.visible = false;
        metadataLayer.name = "ct-metadata-" + metadataLayer.id;
        metadataLayer.textItem.contents = ${JSON.stringify(exportPreset(gradeState))};

        app.echoToOE(metadataLayer.name);
    `))[0];

    // Create vignette layer
    if (gradeState.vignetteOpacity > 0) {
        const vignetteCanvas = getVignetteCanvas();
        const vignetteCtx = vignetteCanvas.getContext("2d");
        vignetteCtx.globalAlpha = gradeState.vignetteOpacity / 100;
        const vBuffer = createVignetteBuffer(512, gradeState.vignetteSize, gradeState.vignetteColor);
        vignetteCtx.drawImage(vBuffer, -gradeState.imageWidth * 0.22, -gradeState.imageHeight * 0.22, gradeState.imageWidth * 1.44, gradeState.imageHeight * 1.44);
        //await new Promise(resolve => setTimeout(resolve, 1500));
        await openFromURLFixed(vignetteCanvas.toDataURL());
        await pea.runScript(`app.activeDocument.activeLayer.name = "vignette";`);
        const blendMode = {
            "multiply": "BlendMode.MULTIPLY",
            "screen": "BlendMode.SCREEN",
            "overlay": "BlendMode.OVERLAY",
            "soft-light": "BlendMode.SOFTLIGHT",
        }[gradeState.vignetteBlending];
        await pea.runScript(`app.activeDocument.activeLayer.blendMode = ${blendMode};`);

        // Select metadata layer, so we can place color lookup at the right position
        await pea.runScript(`app.activeDocument.activeLayer = app.activeDocument.activeLayer.parent.layers.getByName("${metadataLayerName}")`);
    }

    addColorLookupLayer();
}

async function addColorLookupLayer() {
    const pea = getPhotopeaObject();

    const lut = generateIccLUT(9, gradeState);
    const iccBinString = Array.from(lut).join(",");

    const cLookupScript = `
        var desc = new ActionDescriptor();
        var ref = new ActionReference();
        ref.putClass(stringIDToTypeID("adjustmentLayer"));
        desc.putReference(charIDToTypeID("null"), ref);
        var adjDesc = new ActionDescriptor();
        adjDesc.putString(charIDToTypeID("Nm  "), "file");
        var typeDesc = new ActionDescriptor();
        adjDesc.putObject(charIDToTypeID("Type"), stringIDToTypeID("colorLookup"), typeDesc);
        desc.putObject(charIDToTypeID("Usng"), stringIDToTypeID("adjustmentLayer"), adjDesc);
        executeAction(charIDToTypeID("Mk  "), desc, DialogModes.NO);

        var idsetd = charIDToTypeID("setd");
        var mainDesc = new ActionDescriptor();
        var ref = new ActionReference();
        ref.putEnumerated(charIDToTypeID("AdjL"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
        mainDesc.putReference(charIDToTypeID("null"), ref);
        var lutDesc = new ActionDescriptor();
        lutDesc.putEnumerated(stringIDToTypeID("lookupType"), stringIDToTypeID("colorLookupType"), stringIDToTypeID("3DLUT"));
        lutDesc.putString(charIDToTypeID("Nm  "), "ColorTheaterLUT.icc");
        lutDesc.putData(stringIDToTypeID("profile"), String.fromCharCode(${iccBinString}) );
        mainDesc.putObject(charIDToTypeID("T   "), stringIDToTypeID("colorLookup"), lutDesc);
        executeAction(idsetd, mainDesc, DialogModes.NO);
    `;
    await pea.runScript(cLookupScript);
}


/** @returns {Photopea} */
function getPhotopeaObject() {
    if (!_photopeaObject) {
        _photopeaObject = new Photopea(window.parent);
    }
    return _photopeaObject;
}

/** @returns {HTMLCanvasElement} */
function getVignetteCanvas() {
    if (!_vignetteCanvas) {
        _vignetteCanvas = document.createElement("canvas");
    }
    _vignetteCanvas.width = gradeState.imageWidth;
    _vignetteCanvas.height = gradeState.imageHeight;
    _vignetteCanvas.getContext("2d").reset();
    return _vignetteCanvas;
}

/** Patch Photopea.openFromURL for adding layers in a group */
async function openFromURLFixed(url) {
    const pea = getPhotopeaObject();
    let layerCountOld = "done";
    while (layerCountOld == "done") layerCountOld = (await pea.runScript(`app.echoToOE(app.activeDocument.activeLayer.parent.layers.length)`))[0];
    let layerCountNew = layerCountOld;
    await pea.runScript(`app.open("${url}", null, true);`);
    while (layerCountNew == layerCountOld || layerCountNew == "done") {
        layerCountNew = (await pea.runScript(`app.echoToOE(app.activeDocument.activeLayer.parent.layers.length)`))[0];
    }
}