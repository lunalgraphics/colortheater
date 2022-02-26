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