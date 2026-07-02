<script>
    import { builtInPresets, applyPreset, exportPreset, importPreset } from "../../utils/builtInPresets.js";
    import { gradeState, previewRefs } from "../../state.svelte";
    import renderEngine from "../../renderEngine";
    import { readMetadataLayer } from "../../utils/photopeaScripts.js";

    let { isPhotopea = false } = $props();

    let open = $state(false);

    /** Whether we're currently showing a hover preview (to know when to restore) */
    let previewing = $state(false);

    let dropdownPos = $state({ top: 0, left: 0, })

    function toggleDropdown(e) {
        open = !open;
        if (open) {
            const bbox = e.target.getBoundingClientRect();
            dropdownPos.top = bbox.bottom;
            dropdownPos.left = bbox.left;
        }
    }

    function closeDropdown() {
        open = false;
    }

    function handleClickOutside(e) {
        if (open && !e.target.closest(".preset-picker")) {
            closeDropdown();
        }
    }

    function selectPreset(preset) {
        previewing = false;
        applyPreset(gradeState, preset);
        closeDropdown();
    }

    function handleImport() {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".ctxml,.json";
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onloadend = (e2) => importPreset(e2.target.result, gradeState);
            reader.readAsText(file);
        };
        fileInput.click();
        closeDropdown();
    }

    function handleExportPreset() {
        const json = exportPreset(gradeState);
        const blob = new Blob([json], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "preset.ctpreset.json";
        a.click();
    }

    /**
     * Build a temporary state-like object for hover preview rendering.
     * Merges preset values with current image dimensions.
     */
    function buildPreviewState(preset) {
        return {
            ...preset.values,
            imageWidth: gradeState.imageWidth,
            imageHeight: gradeState.imageHeight,
        };
    }

    function handlePresetHover(preset) {
        previewing = true;
        const { canvas, image } = previewRefs;
        if (!canvas || !image) return;
        renderEngine(canvas, image, buildPreviewState(preset));
    }

    function handlePresetLeave() {
        if (!previewing) return;
        previewing = false;
        const { canvas, image } = previewRefs;
        if (!canvas || !image) return;
        // Restore the actual current state
        renderEngine(canvas, image, gradeState);
    }
</script>

<svelte:window onclick={handleClickOutside} />

<div style="text-align: center;" class="preset-picker">
    <button onclick={toggleDropdown}>Use a Preset</button>
    <button onclick={handleExportPreset}>Export Preset</button>
</div>

{#if open}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="dropdown" onmouseleave={handlePresetLeave} style:--dropdown-top="{dropdownPos.top}px" style:--dropdown-left="{dropdownPos.left}px">
        <button class="dropdown-item import-btn" onclick={handleImport}>
            Import Preset File...
        </button>
        {#if isPhotopea}
            <button class="dropdown-item import-btn" onclick={async () => {
                const layerContents = await readMetadataLayer();
                if (layerContents && layerContents !== "done") {
                    importPreset(layerContents, gradeState);
                }
            }}>Use Metadata Layer</button>
        {/if}
        <div class="dropdown-divider"></div>
        <div class="dropdown-label">Built-in Presets</div>
        {#each builtInPresets as preset}
            <button
                class="dropdown-item"
                onclick={() => selectPreset(preset)}
                onmouseenter={() => handlePresetHover(preset)}
                onmouseleave={handlePresetLeave}
            >
                {preset.name}
            </button>
        {/each}
    </div>
{/if}

<style>
    .preset-picker {
        position: relative;
    }

    .dropdown {
        position: fixed;
        top: var(--dropdown-top);
        left: var(--dropdown-left);
        z-index: 20;
        background: #2a2a2a;
        border: 1px solid #555;
        border-radius: 4px;
        min-width: 180px;
        max-height: calc(100vh - var(--dropdown-top) - 10px);
        overflow-y: auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    }

    .dropdown-item {
        display: block;
        width: 100%;
        padding: 6px 12px;
        text-align: left;
        border: none;
        background: none;
        color: #bbb;
        font-size: 13px;
        cursor: pointer;
        font-family: inherit;
    }

    .dropdown-item:hover {
        background: #444;
        color: white;
        border: none;
    }

    .dropdown-divider {
        height: 1px;
        background: #444;
        margin: 4px 0;
    }

    .dropdown-label {
        padding: 4px 12px;
        font-size: 11px;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .import-btn {
        color: #9cb8d8;
    }
</style>
