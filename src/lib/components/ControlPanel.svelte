<script>
    import BasicControls from "./controls/BasicControls.svelte";
    import MatrixControls from "./controls/MatrixControls.svelte";
    import PresetControls from "./controls/PresetControls.svelte";
    import SplitToningControls from "./controls/SplitToningControls.svelte";
    import TintControls from "./controls/TintControls.svelte";
    import VignetteControls from "./controls/VignetteControls.svelte";

    let dragging = $state(false);
    let isSmallScreen = $state(window.matchMedia("(max-width: 555px)").matches);

    $effect(() => {
        const mq = window.matchMedia("(max-width: 555px)");
        const handler = (e) => { isSmallScreen = e.matches; };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    });

    function handlePointerDown(e) {
        dragging = true;
        e.target.setPointerCapture(e.pointerId);
    }

    function handlePointerMove(e) {
        if (!dragging) return;

        if (isSmallScreen) {
            // Drag top edge — panel starts at pointer Y
            const panelTop = Math.max(100, Math.min(window.innerHeight - 100, e.clientY));
            document.documentElement.style.setProperty("--panel-top", panelTop + "px");
        } else {
            // Drag left edge — panel width is distance from right edge
            const panelWidth = Math.max(200, Math.min(window.innerWidth - 200, window.innerWidth - e.clientX));
            document.documentElement.style.setProperty("--panel-width", panelWidth + "px");
        }
    }

    function handlePointerUp(e) {
        dragging = false;
    }
</script>

<svelte:window onpointermove={handlePointerMove} onpointerup={handlePointerUp} />

<div id="controlpanel-wrapper">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="resize-handle"
        class:horizontal={isSmallScreen}
        class:vertical={!isSmallScreen}
        class:dragging
        onpointerdown={handlePointerDown}
    >
        <div class="dots"></div>
    </div>
    <div id="controlpanel">
        <PresetControls /> <hr />
        <BasicControls /> <hr />
        <MatrixControls /> <hr />
        <TintControls /> <hr />
        <SplitToningControls /> <hr />
        <VignetteControls />
    </div>
</div>

<style>
    .resize-handle {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        touch-action: none;
    }

    .resize-handle.vertical {
        left: 0;
        top: 0;
        width: 10px;
        height: 100%;
        cursor: col-resize;
    }

    .resize-handle.horizontal {
        left: 0;
        top: 0;
        width: 100%;
        height: 10px;
        cursor: row-resize;
    }

    .resize-handle .dots {
        display: flex;
        gap: 3px;
        opacity: 0.4;
        transition: opacity 0.15s;
    }

    .resize-handle:hover .dots,
    .resize-handle.dragging .dots {
        opacity: 0.9;
    }

    .resize-handle.vertical .dots {
        flex-direction: column;
    }

    .resize-handle.horizontal .dots {
        flex-direction: row;
    }

    .resize-handle .dots::before,
    .resize-handle .dots::after,
    .resize-handle .dots {
        content: "";
    }

    /* Three dots via box-shadow */
    .resize-handle.vertical .dots::before {
        content: "";
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #888;
        box-shadow: 0 7px 0 #888, 0 14px 0 #888;
    }

    .resize-handle.horizontal .dots::before {
        content: "";
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #888;
        box-shadow: 7px 0 0 #888, 14px 0 0 #888;
    }

    .resize-handle.dragging {
        user-select: none;
    }
</style>
