<script>
    import { gradeState } from "../../state.svelte";
    
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
            <td></td>
            <td style="color: #800000">R</td>
            <td style="color: #008000">G</td>
            <td style="color: #000080">B</td>
            <td style="color: #808080">A</td>
            <td style="color: #EEEEEE">+/-</td>
        </tr>
        {#each ["R", "G", "B", "A"] as label, row}
            <tr>
                <td style="color: {['#800000','#008000','#000080','#808080'][row]}">{label}</td>
                {#each [0,1,2,3,4] as col}
                    <td>
                        <input
                            type="number"
                            value={gradeState.colorMatrix[row][col]}
                            oninput={(e) => handleMatrixInput(row, col, e)}
                            step="1"
                            style="width: 100%; box-sizing: border-box;"
                        />
                    </td>
                {/each}
            </tr>
        {/each}
    </tbody>
</table>
<hr />