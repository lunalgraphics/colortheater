<script>
    import { builtInPresets, applyPreset, exportPreset, importPreset } from "../../scripts/builtInPresets.js";
    import { gradeState } from "../../state.svelte";

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

    function handleExportPreset() {
        const json = exportPreset(gradeState);
        const blob = new Blob([json], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "preset.ctpreset.json";
        a.click();
    }
</script>

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