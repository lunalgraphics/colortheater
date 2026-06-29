<script>
    import { gradeState } from "../../state.svelte";
    import HueSatWheel from "../HueSatWheel.svelte";
    import { Color } from "../../utils/color.js";
    import { scrollwheelValue, dragwheelValue } from "../../svelte-attachments";

    let hue = $state(0);

    // Sync state -> wheel (when hex changes externally, e.g. preset load)
    $effect(() => {
        hue = Color.fromHex(gradeState.tintColor).hsb.h;
    });

    // Sync wheel -> state (when user drags the wheel)
    $effect(() => {
        gradeState.tintColor = Color.fromHSB(hue, 100, 50).hex;
    });
</script>

<i title="Add a colored tint">Tint</i> <br />

<div style:text-align="center">
    <HueSatWheel bind:hue={hue} bind:saturation={gradeState.tintAmount} />
    <br />
    <label style:display="inline-block" style:margin="8px" title="Tint hue">
        Hue
        <input type="number" value={Math.round(hue)} oninput={(e) => { hue = parseFloat(e.target?.value); }} min={0} max={360} {@attach scrollwheelValue} {@attach dragwheelValue} />
    </label>
    <label style:display="inline-block" style:margin="8px" title="Tint strength">
        Sat
        <input type="number" value={Math.round(gradeState.tintAmount)} oninput={(e) => { gradeState.tintAmount = parseFloat(e.target?.value); }} min={0} max={100} {@attach scrollwheelValue} {@attach dragwheelValue} />
    </label>
</div>