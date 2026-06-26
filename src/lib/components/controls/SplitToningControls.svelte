<script>
    import { gradeState } from "../../state.svelte";
</script>

<i>Split Toning</i> <br />
Highlights: <br />
- Color: <input type="color" bind:value={gradeState.highlightColor} /> <br />
- Amount: <input type="number" bind:value={gradeState.highlightAmount} min="0" max="100" /> <br />
Shadows: <br />
- Color: <input type="color" bind:value={gradeState.shadowColor} /> <br />
- Amount: <input type="number" bind:value={gradeState.shadowAmount} min="0" max="100" /> <br />
<hr />