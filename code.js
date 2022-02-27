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
        if (j < 4) input.step = "0.1"; else input.step = "0.01";
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

document.querySelector("#vignettefillcontrol").addEventListener("input", function() {
    document.querySelector("#vignetteRect").setAttribute("fill-opacity", this.value);
});
document.querySelector("#vignettecolorcontrol").addEventListener("input", function() {
    document.querySelectorAll("#vignetteGradient stop")[1].style.stopColor = this.value;
});

document.querySelector("#exportbutton").addEventListener("click", function() {
    rasterize(document.querySelector("svg")).then(function(outputURI) {
        switch ((new URLSearchParams(location.search)).get("portal")) {
            case "photopea":
                Photopea.runScript(window.parent, `app.open("${outputURI}", null, true)`);
                break;
            default:
                var a = document.createElement("a");
                a.href = outputURI;
                a.download = "edited-production.png";
                a.click();
                break;
        }
    });
});

document.querySelector("input[type=file]").addEventListener("change", function() {
    var file = this.files[0];
    var fR = new FileReader();
    fR.addEventListener("loadend", function(e) {
        var imageuri = e.target.result;
        document.querySelector("#baseImage").setAttribute("href", imageuri);
        var image = new Image();
        image.src = imageuri;
        image.addEventListener("load", function() {
            document.querySelector("svg").setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
            document.querySelector("#welcomescreen").remove();
        });
    });
    fR.readAsDataURL(file);
});
document.querySelector("#startbutton").addEventListener("click", function() {
    document.querySelector("input[type=file]").click();
});

if ((new URLSearchParams(location.search)).get("portal") == "photopea") {
    document.querySelector("#exportbutton").innerText = "Finish";
    Photopea.runScript(window.parent, "app.activeDocument.saveToOE('png')").then(function(data) {
        var buffer = data[0];
        var imageuri = "data:image/png;base64," + base64ArrayBuffer(buffer);
        document.querySelector("#baseImage").setAttribute("href", imageuri);
        var image = new Image();
        image.src = imageuri;
        image.addEventListener("load", function() {
            document.querySelector("svg").setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
            document.querySelector("#welcomescreen").remove();
        });
    });
}