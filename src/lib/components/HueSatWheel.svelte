<script>
    let {
        hue = $bindable(0),
        saturation = $bindable(0),
        lightness = $bindable(50),
        ...rest
    } = $props();

    /** @type {HTMLElement} */
    let wheelEl;

    let conicGradient = $derived("conic-gradient("
        + (new Array(13)).fill(0)
            .map((_, i) => `hsl(${i * 30}deg, 100%, ${lightness}%)`)
            .join(", ")
        + ")");
    let radialGradient = $derived(`radial-gradient(
            circle at center,
            hsla(0deg, 0%, ${lightness}%, 100%) 0%,
            hsla(0deg, 0%, ${lightness}%, 0) 100%
        )`);

    /** @type {Record<string, boolean>} */
    let keysDown = $state({});
    let lockHue = $derived(keysDown["Shift"]);
    let lockSat = $derived(keysDown["Alt"]);

    let scopePosition = $state([50, 50]);
    $effect(() => {
        const offsetX = Math.sin(hue * Math.PI / 180) * saturation/2;
        const offsetY = Math.cos(hue * Math.PI / 180) * saturation/2;
        scopePosition = [50 + offsetX, 50 - offsetY];
    });

    /** @param {PointerEvent} e */
    function updateColorFromPointer(e) {
        const rect = wheelEl.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        if (!lockHue) hue = Math.atan2(x, -y) * 180 / Math.PI;
        if (!lockSat) saturation = Math.sqrt(x * x + y * y) * 200;

        if (saturation > 100) saturation = 100;
    }

    let pickingColor = $state(false);
    function handlePointerDown(e) {
        pickingColor = true;
        updateColorFromPointer(e);
    }
    function handlePointerMove(e) {
        if (pickingColor) updateColorFromPointer(e);
    }
    function handlePointerUp(e) {
        pickingColor = false;
    }
</script>

<svelte:window onpointermove={handlePointerMove} onpointerup={handlePointerUp}
    onkeydown={(e) => { keysDown[e.key] = true; }} onkeyup={(e) => { delete keysDown[e.key]; }} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="hue-sat-wheel" bind:this={wheelEl} onpointerdown={handlePointerDown} {...rest}>
    <div class="hue-wheel" style:background-image={conicGradient}></div>
    <div class="sat-wheel" style:background-image={radialGradient}></div>
    <div class="picker-scope" style:top="{scopePosition[1]}%"
        style:left="{scopePosition[0]}%"
        style:background-color="hsl({hue}deg, {saturation}%, {lightness}%)"></div>
</div>

<style>
    .hue-sat-wheel {
        display: inline-block;
        position: relative;
        width: 160px;
        max-width: 100%;
        height: auto;
        aspect-ratio: 1 / 1;
        border-radius: 50%;
        cursor: crosshair;
        vertical-align: middle;
    }

    .hue-wheel {
        position: absolute;
        inset: 0;
        z-index: 1;
        border-radius: 50%;
    }

    .sat-wheel {
        position: absolute;
        inset: 0;
        z-index: 2;
        border-radius: 50%;
    }

    .picker-scope {
        position: absolute;
        transform: translate(-50%, -50%);
        z-index: 3;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        border: 2px solid white;
        transition: width 0.2s, height 0.2s;
    }

    .picker-scope:hover {
        width: 12px;
        height: 12px;
        cursor: none;
    }
</style>