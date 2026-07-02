<script>
    import { gradeState } from "../../state.svelte";
    import Slider from "../Slider.svelte";
</script>

<i title="Adjust basic parameters">Basic Adjustments</i> <br />
<div class="gridbox">
    <span title="How bright the image is">Brightness</span> <Slider bind:value={gradeState.brightness} min={0} max={200} --width="100%" />
    <span title="Amount of variation in brightness values">Contrast</span> <Slider bind:value={gradeState.contrast} min={0} max={200} --width="100%" />
    <span title="How vibrant the colors are">Saturation</span> <Slider bind:value={gradeState.saturation} min={0} max={200} --width="100%" />
    <span title="Coffee-colored image filter">Sepia</span> <Slider bind:value={gradeState.sepia} min={0} max={100} --width="100%" />
</div>

<style>
    .gridbox {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        row-gap: 4px;
        column-gap: 12px;
        margin-bottom: 14px;
    }
</style>