<script>
    import { gradeState } from "../../state.svelte";
</script>

<i>Basic Adjustments</i> <br />
Brightness: <input type="number" bind:value={gradeState.brightness} min="0" max="200" /> <br />
Contrast: <input type="number" bind:value={gradeState.contrast} min="0" max="200" /> <br />
Saturation: <input type="number" bind:value={gradeState.saturation} min="0" max="200" /> <br />
Sepia: <input type="number" bind:value={gradeState.sepia} min="0" max="100" /> <br />
<hr />