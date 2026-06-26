<script>
    import newPreview from "./lib/scripts/canvStuff.js";
    import { builtInPresets, applyPreset, exportPreset, importPreset } from "./lib/scripts/builtInPresets.js";
    import { gradeState } from "./lib/state.svelte.js";

    import { onMount, tick } from "svelte";
    import Photopea from "photopea";
    import bannerImg from "./lib/assets/banner.png";

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

    function handleExportPreset() {
        const json = exportPreset(gradeState);
        const blob = new Blob([json], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "preset.ctpreset.json";
        a.click();
    }

    function handlePresetChange(e) {
        const val = e.target.value;
        if (val === "import_preset") {
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = ".ctxml,.json";
            fileInput.onchange = (e2) => {
                const file = e2.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onloadend = (e3) => importPreset(e3.target.result, gradeState);
                reader.readAsText(file);
            };
            fileInput.click();
        } else if (val !== "nothing") {
            // Find the preset by name
            const preset = builtInPresets.find(p => p.name === val);
            if (preset) applyPreset(gradeState, preset);
        }
        e.target.value = "nothing";
    }

    function handleMatrixInput(row, col, e) {
        const val = parseFloat(e.target.value) || 0;
        // Create a new matrix array to trigger reactivity
        const newMatrix = gradeState.colorMatrix.map(r => [...r]);
        newMatrix[row][col] = val;
        gradeState.colorMatrix = newMatrix;
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

    let fileInputEl = $state(null);
</script>

<div id="previewspace">
    <canvas bind:this={canvasEl}></canvas>
</div>

<div id="controlpanel">
    <div style="text-align: center;">
        <select onchange={handlePresetChange}>
            <option disabled selected hidden value="nothing">Use a Preset</option>
            <option value="import_preset">Import Preset File</option>
            <optgroup label="Built-in Presets">
                {#each builtInPresets as preset}
                    <option value={preset.name}>{preset.name}</option>
                {/each}
            </optgroup>
        </select>
        <button onclick={handleExportPreset}>Export Preset</button>
    </div>
    <hr />

    <i>Basic Adjustments</i> <br />
    Brightness: <input type="number" bind:value={gradeState.brightness} min="0" max="200" /> <br />
    Contrast: <input type="number" bind:value={gradeState.contrast} min="0" max="200" /> <br />
    Saturation: <input type="number" bind:value={gradeState.saturation} min="0" max="200" /> <br />
    Sepia: <input type="number" bind:value={gradeState.sepia} min="0" max="100" /> <br />
    <hr />

    <i>Color Matrix</i> <br />
    <table style="width: 100%;" id="cmatrixTable">
        <tbody>
            <tr>
                <td></td>
                <td style="color: #800000">R</td>
                <td style="color: #008000">G</td>
                <td style="color: #000080">B</td>
                <td style="color: #808080">A</td>
                <td style="color: #EEEEEE">+/-</td>
            </tr>
            {#each ["R", "G", "B", "A"] as label, row}
                <tr>
                    <td style="color: {['#800000','#008000','#000080','#808080'][row]}">{label}</td>
                    {#each [0,1,2,3,4] as col}
                        <td>
                            <input
                                type="number"
                                value={gradeState.colorMatrix[row][col]}
                                oninput={(e) => handleMatrixInput(row, col, e)}
                                step="1"
                                style="width: 100%; box-sizing: border-box;"
                            />
                        </td>
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>
    <hr />

    <i>Tint</i> <br />
    Color: <input type="color" bind:value={gradeState.tintColor} /> <br />
    Amount: <input type="number" bind:value={gradeState.tintAmount} min="0" max="200" step="1" />
    <hr />

    <i>Split Toning</i> <br />
    Highlights: <br />
    - Color: <input type="color" bind:value={gradeState.highlightColor} /> <br />
    - Amount: <input type="number" bind:value={gradeState.highlightAmount} min="0" max="100" /> <br />
    Shadows: <br />
    - Color: <input type="color" bind:value={gradeState.shadowColor} /> <br />
    - Amount: <input type="number" bind:value={gradeState.shadowAmount} min="0" max="100" /> <br />
    <hr />

    <i>Vignette</i> <br />
    Color: <input type="color" bind:value={gradeState.vignetteColor} /> <br />
    Size: <input type="number" bind:value={gradeState.vignetteSize} min="0" max="100" /> <br />
    Opacity: <input type="number" bind:value={gradeState.vignetteOpacity} min="0" max="100" step="1" /> <br />
    Blending: <select bind:value={gradeState.vignetteBlending}>
        <option value="multiply">Multiply</option>
        <option value="overlay">Overlay</option>
        <option value="soft-light">Soft Light</option>
        <option value="screen">Screen</option>
    </select>
</div>

<div id="bottompanel">
    <button onclick={handleExport}>{isPhotopea ? "Finish" : "Export as PNG"}</button>
</div>

{#if showWelcome}
    <div id="welcomescreen">
        <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); text-align: center;">
            <img src={bannerImg} draggable="false" width={isPhotopea ? "250px" : "420px"} alt="Color Theater" /> <br />
            {#if !isPhotopea}
                <button onclick={() => fileInputEl.click()}>Upload image</button>
                <input type="file" accept="image/*" bind:this={fileInputEl} onchange={handleFileUpload} />
            {/if}
        </div>
    </div>
{/if}
