<script>
    let {
        min = 0,
        max = 100,
        value = $bindable(50),
        backgroundImage = "",
        step = 1,
        direction = "horizontal",
        showNumberInput = true,
    } = $props();

    /** @type {HTMLElement} */
    let rangeEl;

    function updateValueFromPointer(e) {
        const rect = rangeEl.getBoundingClientRect();
        let ratio;
        if (direction === "horizontal") {
            const x = e.clientX - rect.left;
            ratio = x / rect.width;
        } else {
            const y = rect.bottom - e.clientY;
            ratio = y / rect.height;
        }
        ratio = Math.max(0, Math.min(1, ratio));
        value = Math.round((min + ratio * (max - min)) / step) * step;
        if (value < min) value = min;
        if (value > max) value = max;
    }

    let dragging = $state(false);
    function handlePointerDown(e) {
        updateValueFromPointer(e);
        dragging = true;
    }
    function handlePointerMove(e) {
        if (dragging) updateValueFromPointer(e);
    }
    function handlePointerUp(e) {
        dragging = false;
    }
</script>

<svelte:window onpointermove={handlePointerMove} onpointerup={handlePointerUp} />

<div class="slider">
    <div class="slider-flexbox" data-direction={direction}>
        <div class="slider-range" bind:this={rangeEl} onpointerdown={handlePointerDown}
            style:cursor={dragging ? (direction === "horizontal" ? "ew-resize" : "ns-resize") : null}
            role="slider" tabindex="0" aria-valuenow={value}>
            <div class="slider-track" style:background-image={backgroundImage || null}></div>
            <div class="slider-thumb" style:--value="{(value - min) / (max - min) * 100}%" style:background-color={dragging ? "var(--focus-color)" : null}></div>
        </div>

        {#if showNumberInput}
            <input type="number" class="slider-number-input" bind:value={value} min={min} max={max} step={step} />
        {/if}
    </div>
</div>

<style>
    .slider {
        display: inline-block;
        vertical-align: middle;
        position: relative;
        width: var(--width, 160px);
        height: var(--height, 24px);
    }

    .slider-flexbox[data-direction="horizontal"] {
        display: flex;
        flex-direction: row;
        gap: 8px;
        align-items: center;
    }
    
    .slider-flexbox[data-direction="vertical"] {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;
        height: 100%;
    }

    .slider-flexbox[data-direction="horizontal"] .slider-range {
        position: relative;
        flex-grow: 1;
        height: 24px;
    }

    .slider-flexbox[data-direction="vertical"] .slider-range {
        position: relative;
        flex-grow: 1;
        width: 24px;
    }

    .slider-flexbox[data-direction="horizontal"] .slider-track {
        position: absolute;
        width: 100%;
        height: 4px;
        top: 50%;
        transform: translateY(-50%);
        background-color: grey;
        border-radius: 2px;
    }

    .slider-flexbox[data-direction="vertical"] .slider-track {
        position: absolute;
        width: 4px;
        height: 100%;
        left: 50%;
        transform: translateX(-50%);
        background-color: grey;
        border-radius: 2px;
    }

    .slider-flexbox[data-direction="horizontal"] .slider-thumb {
        position: absolute;
        width: 6px;
        height: 16px;
        top: 50%;
        left: var(--value);
        transform: translate(-50%, -50%);
        background-color: white;
        border-radius: 3px;
        --focus-color: lightgrey;
    }

    .slider-flexbox[data-direction="vertical"] .slider-thumb {
        position: absolute;
        width: 16px;
        height: 6px;
        left: 50%;
        bottom: var(--value);
        transform: translate(-50%, 50%);
        background-color: white;
        border-radius: 3px;
        --focus-color: lightgrey;
    }

    .slider-flexbox[data-direction="horizontal"] .slider-thumb:hover {
        background-color: var(--focus-color);
        cursor: ew-resize;
    }

    .slider-flexbox[data-direction="vertical"] .slider-thumb:hover {
        background-color: var(--focus-color);
        cursor: ns-resize;
    }

    input[type=number] {
        width: 50px!important;
    }
</style>