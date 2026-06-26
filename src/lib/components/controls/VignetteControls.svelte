<script>
    import { gradeState } from "../../state.svelte";
</script>

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