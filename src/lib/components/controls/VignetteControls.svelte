<script>
    import { gradeState } from "../../state.svelte";
    import HueSatWheel from "../HueSatWheel.svelte";
    import Slider from "../Slider.svelte";
    import { Color } from "../../scripts/color";

    let hue = $state(0);
    let saturation = $state(0);
    let lightness = $state(0);

    let vignetteColorHSL = $derived(Color.fromHex(gradeState.vignetteColor).hsl);

    // Sync state -> wheel (when hex changes externally, e.g. preset load)
    $effect(() => {
        hue = vignetteColorHSL.h;
        saturation = vignetteColorHSL.s;
        lightness = vignetteColorHSL.l;
    });

    // Sync wheel -> state (when user drags the wheel)
    $effect(() => {
        gradeState.vignetteColor = Color.fromHSL(hue, saturation, lightness).hex;
    });
</script>

<i>Vignette</i> <br />
<div style:text-align="center" style:margin-bottom="10px">
    <HueSatWheel bind:hue={hue} bind:saturation={saturation} bind:lightness={lightness} style="width: 120px" />
    <Slider bind:value={lightness} min={0} max={100} direction="vertical" showNumberInput={false} --width="28px" --height="100px"
        backgroundImage="linear-gradient(to bottom, hsl(0deg, 0%, 50%) 0%, hsl(0deg, 0%, 10%) 100%)" />
</div>
<div style:width="250px" style:max-width="100%" style:position="relative" style:left="50%" style:transform="translateX(-50%)">
    <div style:display="grid" style:grid-template-columns="auto 1fr" style:row-gap="6px" style:column-gap="12px">
        Size <Slider bind:value={gradeState.vignetteSize} min={0} max={100} --width="100%" />
        Opacity <Slider bind:value={gradeState.vignetteOpacity} min={0} max={100} step={1} --width="100%" />
        Blending <div style:text-align="right">
                <select bind:value={gradeState.vignetteBlending}>
                <option value="multiply">Multiply</option>
                <option value="overlay">Overlay</option>
                <option value="soft-light">Soft Light</option>
                <option value="screen">Screen</option>
            </select>
        </div>
    </div>
</div>