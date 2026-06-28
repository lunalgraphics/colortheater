<script>
    import newPreview from "./lib/scripts/canvStuff.js";
    import { builtInPresets, applyPreset, exportPreset, importPreset } from "./lib/scripts/builtInPresets.js";
    import { gradeState } from "./lib/state.svelte.js";

    import { onMount, tick } from "svelte";
    import Photopea from "photopea";
    import bannerImg from "./lib/assets/banner.png";

    import ControlPanel from "./lib/components/ControlPanel.svelte";

    let canvasEl;
    let imageEl;
    let showWelcome = $state(true);
    let isPhotopea = $state(false);

    function renderPreview() {
        if (imageEl && imageEl.complete && imageEl.naturalWidth) {
            newPreview(canvasEl, imageEl, gradeState);
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
    });

    function loadImage(src) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            imageEl = img;
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

    function handleExport() {
        if (!canvasEl) return;
        const outputURI = canvasEl.toDataURL();
        if (isPhotopea) {
            const pea = new Photopea(window.parent);
            pea.openFromURL(outputURI);
        } else {
            const a = document.createElement("a");
            a.href = outputURI;
            a.download = "colortheater-output.png";
            a.click();
        }
    }

    onMount(() => {
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

<div id="previewspace">
    <canvas bind:this={canvasEl}></canvas>
</div>

<ControlPanel />

<div id="bottompanel">
    <button onclick={handleExport}>{isPhotopea ? "Finish" : "Export as PNG"}</button>
</div>

{#if showWelcome}
    <div id="welcomescreen">
        <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); text-align: center;">
            <img src={bannerImg} draggable="false" width={isPhotopea ? "250px" : "420px"} alt="Color Theater" /> <br />
            {#if !isPhotopea}
                <label class="button" style:padding="4px 10px">
                    Upload image
                    <input type="file" accept="image/*" onchange={handleFileUpload} style:display="none" />
                </label>
            {/if}
        </div>
    </div>
{/if}
