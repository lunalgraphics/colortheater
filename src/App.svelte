<script>
    import renderEngine from "./lib/renderEngine";
    import { gradeState, previewRefs, buildConfig } from "./lib/state.svelte.js";
    import { initHistory, pushHistory, handleUndoRedoKeydown } from "./lib/history.svelte.js";

    import { onMount } from "svelte";
    import Photopea from "photopea";
    import bannerImg from "./lib/assets/banner.png";

    import ControlPanel from "./lib/components/ControlPanel.svelte";
    import { generateCubeLUT, generateIccLUT } from "./lib/utils/LutUtils.js";
    import { handlePhotopeaExport } from "./lib/utils/photopeaScripts.js";

    /** @type {HTMLCanvasElement} */
    let canvasEl;
    /** @type {HTMLImageElement} */
    let imageEl;
    let showWelcome = $state(true);

    if (import.meta.env.VITE_PLATFORM === "photoshop") buildConfig.platform = "photoshop";

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
    let lutFormat = $state("cube");
    function handleLutExport() {
        const lut = (lutFormat === "icc") ? generateIccLUT(lutGridSize, gradeState) : generateCubeLUT(lutGridSize, gradeState);
        const blob = new Blob([lut], { type: (lutFormat === "icc") ? "application/vnd.iccprofile" : "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "colortheater-lut." + lutFormat;
        a.click();
    }

    onMount(() => {
        previewRefs.canvas = canvasEl;
        initHistory();
        if (new URLSearchParams(location.search).get("portal") === "photopea") {
            buildConfig.platform = "photopea";
            
            const pea = new Photopea(window.parent);
            pea.exportImage("png").then((blob) => {
                const url = URL.createObjectURL(blob);
                loadImage(url);
            });
        }
        if (buildConfig.platform === "photoshop") {
            window.addEventListener("message", (e) => {
                if (typeof e.data === "string") e.data = JSON.parse(e.data);
                if (e.data.type === "init") {
                    initHistory();
                    loadImage(e.data.baseImg);
                }
            });
            window.uxpHost.postMessage({ type: "webViewLoaded", data: true });
        }
    });

</script>

<svelte:window onkeydown={handleUndoRedoKeydown} />

<div id="previewspace">
    <canvas bind:this={canvasEl}></canvas>
</div>

<ControlPanel />

<div id="bottompanel">
    {#if buildConfig.platform === "standalone"}
        <div style:display="inline-flex" style:margin="6px">
            <button onclick={handleImageExport}>Export Image</button>
            <select bind:value={imageExportType}>
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
            </select>
        </div>
        <div style:display="inline-flex" style:margin="6px">
            <button onclick={handleLutExport}>Export LUT</button>
            <select bind:value={lutFormat}>
                <option value="cube">CUBE</option>
                <option value="icc">ICC</option>
            </select>
            <select bind:value={lutGridSize}>
                <option value={17}>17 pt</option>
                <option value={33}>33 pt</option>
                <option value={65}>65 pt</option>
            </select>
        </div>
    {:else if buildConfig.platform === "photopea"}
        <button onclick={handlePhotopeaExport}>Finish</button>
    {:else if buildConfig.platform === "photoshop"}
        <button onclick={() => { window.uxpHost.postMessage({ type: "export", preset: JSON.stringify(gradeState) }); }}>Export</button>
    {/if}
</div>

{#if showWelcome}
    <div id="welcomescreen">
        <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); text-align: center;">
            <img src={bannerImg} draggable="false" width="420" style:max-width="90vw" alt="Color Theater" /> <br />
            {#if buildConfig.platform === "standalone"}
                <label class="button" style:padding="6px 14px">
                    Upload image
                    <input type="file" accept="image/*" onchange={handleFileUpload} style:display="none" />
                </label>
            {/if}
        </div>
    </div>
{/if}
