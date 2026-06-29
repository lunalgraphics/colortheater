<script>
    import { gradeState } from "../../state.svelte";
    import HueSatWheel from "../HueSatWheel.svelte";
    import { Color } from "../../utils/color.js";

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

<i>Tint</i> <br />

<HueSatWheel bind:hue={hue} bind:saturation={gradeState.tintAmount} />
<br />

<hr />