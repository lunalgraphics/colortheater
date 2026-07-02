<script>
    import renderEngine from "./lib/renderEngine";
    import { gradeState, previewRefs } from "./lib/state.svelte.js";
    import { initHistory, pushHistory, handleUndoRedoKeydown } from "./lib/history.svelte.js";

    import { onMount } from "svelte";
    import Photopea from "photopea";
    import bannerImg from "./lib/assets/banner.png";

    import ControlPanel from "./lib/components/ControlPanel.svelte";
    import { generateCubeLUT, generateIccLUT } from "./lib/utils/LutUtils.js";

    let canvasEl;
    let imageEl;
    let showWelcome = $state(true);
    let isPhotopea = $state(false);

    function renderPreview() {
        if (imageEl && imageEl.complete && imageEl.naturalWidth) {
            renderEngine(canvasEl, imageEl, gradeState);
        }
    }

    // React to any state change and re-render
    $effect(() => {
        // Access all reactive properties to subscribe to them
        void gradeState.brightness;
        void gradeState.contrast;
        void gradeState.saturation;
        void gradeState.sepia;
        void gradeState.colorMatrix;
        void gradeState.tintColor;
        void gradeState.tintAmount;
        void gradeState.highlightColor;
        void gradeState.highlightAmount;
        void gradeState.shadowColor;
        void gradeState.shadowAmount;
        void gradeState.vignetteColor;
        void gradeState.vignetteSize;
        void gradeState.vignetteOpacity;
        void gradeState.vignetteBlending;
        void gradeState.imageWidth;
        void gradeState.imageHeight;

        renderPreview();
        pushHistory();
    });

    function loadImage(src) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            imageEl = img;
            previewRefs.image = img;
            gradeState.imageWidth = img.naturalWidth;
            gradeState.imageHeight = img.naturalHeight;
            showWelcome = false;
            renderPreview();
        };
        img.src = src;
    }

    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = (ev) => loadImage(ev.target.result);
        reader.readAsDataURL(file);
    }

    let imageExportType = $state("png");
    function handleImageExport() {
        if (!canvasEl) return;
        const outputURI = canvasEl.toDataURL("image/" + imageExportType);
        const a = document.createElement("a");
        a.href = outputURI;
        a.download = "colortheater-output." + imageExportType;
        a.click();
    }

    let lutGridSize = $state(33);
    function handleLutExport() {
        const lut = generateCubeLUT(lutGridSize, gradeState);
        const blob = new Blob([lut], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "colortheater-lut.cube";
        a.click();
    }

    onMount(() => {
        previewRefs.canvas = canvasEl;
        initHistory();
        isPhotopea = new URLSearchParams(location.search).get("portal") === "photopea";

        if (isPhotopea) {
            const pea = new Photopea(window.parent);
            pea.exportImage("png").then((blob) => {
                const url = URL.createObjectURL(blob);
                loadImage(url);
            });
        }
    });

</script>

<svelte:window onkeydown={handleUndoRedoKeydown} />

<div id="previewspace">
    <canvas bind:this={canvasEl}></canvas>
</div>

<ControlPanel />

<div id="bottompanel">
    {#if !isPhotopea}
        <div style:display="inline-flex" style:margin="6px">
            <button onclick={handleImageExport}>Export Image</button>
            <select bind:value={imageExportType}>
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
            </select>
        </div>
        <div style:display="inline-flex" style:margin="6px">
            <button onclick={handleLutExport}>Export LUT (.CUBE)</button>
            <select bind:value={lutGridSize}>
                <option value={17}>17 pt</option>
                <option value={33}>33 pt</option>
                <option value={65}>65 pt</option>
            </select>
        </div>
    {:else if isPhotopea}
        <button onclick={async () => {
            const lut = generateIccLUT(9, gradeState);
            const iccBinString = Array.from(lut).join(",");

            const pea = new Photopea(window.parent);

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
        }}>Finish</button>
    {/if}
</div>

{#if showWelcome}
    <div id="welcomescreen">
        <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); text-align: center;">
            <img src={bannerImg} draggable="false" width="420" style:max-width="90vw" alt="Color Theater" /> <br />
            {#if !isPhotopea}
                <label class="button" style:padding="6px 14px">
                    Upload image
                    <input type="file" accept="image/*" onchange={handleFileUpload} style:display="none" />
                </label>
            {/if}
        </div>
    </div>
{/if}
