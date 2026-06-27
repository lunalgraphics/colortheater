<script>
    import { gradeState } from "../../state.svelte";
    import Slider from "../Slider.svelte";
</script>

<i>Basic Adjustments</i> <br />
<div class="gridbox">
    Brightness <Slider bind:value={gradeState.brightness} min={0} max={200} --width="100%" />
    Contrast <Slider bind:value={gradeState.contrast} min={0} max={200} --width="100%" />
    Saturation <Slider bind:value={gradeState.saturation} min={0} max={200} --width="100%" />
    Sepia <Slider bind:value={gradeState.sepia} min={0} max={100} --width="100%" />
</div>
<hr />

<style>
    .gridbox {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        row-gap: 4px;
        column-gap: 12px;
    }
</style>