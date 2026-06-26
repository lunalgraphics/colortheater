<script>
    import { gradeState } from "../state.svelte";
    import BasicControls from "./controls/BasicControls.svelte";
    import MatrixControls from "./controls/MatrixControls.svelte";
    import PresetControls from "./controls/PresetControls.svelte";
    import SplitToningControls from "./controls/SplitToningControls.svelte";
    import VignetteControls from "./controls/VignetteControls.svelte";
</script>

<div id="controlpanel">
    <PresetControls />
    <BasicControls />
    <MatrixControls />
    <SplitToningControls />
    <VignetteControls />
</div>