function arraytostring(arr) {
    var str = "";
    for (var row of arr) {
        for (var col of row) {
            str += col + " ";
        }
        str += "\n";
    }
    return str;
}

var colorMatrixValues = [
    [1, 0, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0],
];

for (var i = 0; i < 4; i++) {
    for (var j = 0; j < 5; j++) {
        var input = document.createElement("input");
        input.type = "number";
        if (i == j) input.value = 1; else input.value = 0;
        input.step = "0.1";
        input.style.width = "100%";
        input.style.boxSizing = "border-box";
        input.id = `cmatrixinput${i}${j}`;
        document.querySelector(`#cmatrixcell${i}${j}`).appendChild(input);
        input.addEventListener("input", function() {
            colorMatrixValues[parseInt(this.id.split("cmatrixinput")[1].split("")[0])][parseInt(this.id.split("cmatrixinput")[1].split("")[1])] = parseFloat(this.value);
            document.querySelector("#colorgrade feColorMatrix").setAttribute("values", arraytostring(colorMatrixValues));
        });
    }
}

fetch("presets.json").then(response => response.json()).then(function(presets) {
    for (var preset in presets) {
        var option = document.createElement("option");
        option.innerText = preset;
        option.value = presets[preset];
        document.querySelector("#colorpresetselect").appendChild(option);
    }
    document.querySelector("#colorpresetselect").addEventListener("input", function() {
        var matrix_split = this.value.split("\n");
        for (var i = 0; i < matrix_split.length; i++) {
            matrix_split[i] = matrix_split[i].split(" ");
        }
        colorMatrixValues = matrix_split;
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 5; j++) {
                document.querySelector(`#cmatrixinput${i}${j}`).value = matrix_split[i][j];
            }
        }
        document.querySelector("#colorgrade feColorMatrix").setAttribute("values", arraytostring(colorMatrixValues));
    });
});