<script>
    import { gradeState } from "../../state.svelte";
    import HueSatWheel from "../HueSatWheel.svelte";
    import Slider from "../Slider.svelte";
    import { Color } from "../../utils/color";

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

<i title="Soften the edges of the image">Vignette</i> <br />
<div style:display="flex" style:flex-direction="row" style:align-items="center" style:justify-content="center">
    <HueSatWheel bind:hue={hue} bind:saturation={saturation} bind:lightness={lightness} style="width: 110px" />
    <Slider bind:value={lightness} min={0} max={100} direction="vertical" showNumberInput={false} --width="24px" --height="100px"
        backgroundImage="linear-gradient(to bottom, hsl(0deg, 0%, 50%) 0%, hsl(0deg, 0%, 10%) 100%)" />
</div>
<div style:display="grid" style:grid-template-columns="auto 1fr" style:column-gap="16px" style:row-gap="4px">
    <span title="Size of vignette gradient">Size</span>
    <Slider bind:value={gradeState.vignetteSize} min={0} max={100} --width="100%" />
    <span title="Strength of vignette effect">Opacity</span>
    <Slider bind:value={gradeState.vignetteOpacity} min={0} max={100} step={1} --width="100%" />
    <span title="Blend mode">Blend Mode</span>
    <div style:text-align="right">
        <select bind:value={gradeState.vignetteBlending} style:width="min-content">
            <option value="multiply">Multiply</option>
            <option value="overlay">Overlay</option>
            <option value="soft-light">Soft Light</option>
            <option value="screen">Screen</option>
        </select>
    </div>
</div>