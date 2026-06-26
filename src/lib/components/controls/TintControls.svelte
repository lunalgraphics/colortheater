<script>
    import { gradeState } from "../../state.svelte";
</script>

<i>Tint</i> <br />
Color: <input type="color" bind:value={gradeState.tintColor} /> <br />
Amount: <input type="number" bind:value={gradeState.tintAmount} min="0" max="200" step="1" />
<hr />