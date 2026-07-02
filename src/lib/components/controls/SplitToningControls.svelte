<script>
    import { gradeState } from "../../state.svelte";
    import { Color } from "../../utils/color.js";

    import HueSatWheel from "../HueSatWheel.svelte";
    import Slider from "../Slider.svelte";

    // Derive HSL from the hex state for highlights
    let highlightHSL = $derived(Color.fromHex(gradeState.highlightColor).hsl);
    let highlightHue = $state(0);
    let highlightSat = $state(0);

    // Derive HSL from the hex state for shadows
    let shadowHSL = $derived(Color.fromHex(gradeState.shadowColor).hsl);
    let shadowHue = $state(0);
    let shadowSat = $state(0);

    // Sync state -> wheel (when hex changes externally, e.g. preset load)
    $effect(() => {
        highlightHue = highlightHSL.h;
        highlightSat = highlightHSL.s;
    });
    $effect(() => {
        shadowHue = shadowHSL.h;
        shadowSat = shadowHSL.s;
    });

    // Sync wheel -> state (when user drags the wheel)
    $effect(() => {
        gradeState.highlightColor = Color.fromHSL(highlightHue, highlightSat, 50).hex;
    });
    $effect(() => {
        gradeState.shadowColor = Color.fromHSL(shadowHue, shadowSat, 50).hex;
    });
</script>

<i title="Add separate color tones to the highlights and shadows">Color Dodge/Burn</i> <br />

<table style:padding-bottom="6px">
    <thead>
        <tr>
            <th title="Brightest areas">Highlights</th>
            <th title="Darkest areas">Shadows</th>
        </tr>
    </thead>
    <tbody>
        <tr style:font-size="small">
            <td colspan="2" title="Color tone">Color</td>
        </tr>
        <tr>
            <td>
                <div style:display="inline-block" style:width="120px" style:max-width="90%">
                    <HueSatWheel bind:hue={highlightHue} bind:saturation={highlightSat} />
                </div>
            </td>
            <td>
                <div style:display="inline-block" style:width="120px" style:max-width="90%">
                    <HueSatWheel bind:hue={shadowHue} bind:saturation={shadowSat} />
                </div>
            </td>
        </tr>
        <tr style:font-size="small">
            <td colspan="2" title="How much to apply the toning">Amount</td>
        </tr>
        <tr>
            <td>
                <Slider min={0} max={100} bind:value={gradeState.highlightAmount} --width="90%" />
            </td>
            <td>
                <Slider min={0} max={100} bind:value={gradeState.shadowAmount} --width="90%" />
            </td>
        </tr>
    </tbody>
</table>

<style>
    table {
        width: 100%;
        table-layout: fixed;
    }

    th {
        font-weight: normal;
    }
</style>
