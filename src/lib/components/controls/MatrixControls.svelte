<script>
    import { gradeState } from "../../state.svelte";
    import { scrollwheelValue } from "../../svelte-attachments/scrollWheelValue.svelte.js";
    import { dragwheelValue } from "../../svelte-attachments/dragwheelValue.svelte.js";
    
    function handleMatrixInput(row, col, e) {
        const val = parseFloat(e.target.value) || 0;
        // Create a new matrix array to trigger reactivity
        const newMatrix = gradeState.colorMatrix.map(r => [...r]);
        newMatrix[row][col] = val;
        gradeState.colorMatrix = newMatrix;
    }
</script>

<i>Color Matrix</i> <br />
<table style="width: 100%;" id="cmatrixTable">
    <tbody>
        <tr>
            <td colspan="2"></td>
            <td colspan="5">OUTPUT</td>
        </tr>
        <tr>
            <td colspan="2"></td>
            <td style="color: #DD0000">R</td>
            <td style="color: #00DD00">G</td>
            <td style="color: #0077DD">B</td>
            <td style="color: #EEEEEE">+/-</td>
        </tr>
        {#each ["R", "G", "B"] as label, row}
            <tr>
                {#if row === 0}
                    <td rowspan="3" style:writing-mode="sideways-lr" style:text-orientation="sideways">INPUT</td>
                {/if}
                <td style:color={['#DD0000','#00DD00','#0077DD','#808080'][row]} style:padding="0 7px">{label}</td>
                {#each [0,1,2,4] as col}
                    <td>
                        <input
                            type="number"
                            value={gradeState.colorMatrix[row][col]}
                            oninput={(e) => handleMatrixInput(row, col, e)}
                            step="1"
                            style="width: 100%; box-sizing: border-box;"
                            {@attach scrollwheelValue}
                            {@attach dragwheelValue}
                        />
                    </td>
                {/each}
            </tr>
        {/each}
    </tbody>
</table>
<hr />

<style>
    table {
        border-collapse: collapse;
        border-spacing: 0;
    }

    table td {
        padding: 0;
    }
</style>