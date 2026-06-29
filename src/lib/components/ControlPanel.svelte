<script>
    import BasicControls from "./controls/BasicControls.svelte";
    import MatrixControls from "./controls/MatrixControls.svelte";
    import PresetControls from "./controls/PresetControls.svelte";
    import SplitToningControls from "./controls/SplitToningControls.svelte";
    import TintControls from "./controls/TintControls.svelte";
    import VignetteControls from "./controls/VignetteControls.svelte";
</script>

<div id="controlpanel-wrapper">
    <div id="controlpanel">
        <PresetControls /> <hr />
        <BasicControls /> <hr />
        <MatrixControls /> <hr />
        <TintControls /> <hr />
        <SplitToningControls /> <hr />
        <VignetteControls />
    </div>
</div>