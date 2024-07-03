function arraytostring(arr) {
    var rowsData = [];
    for (var row of arr) {
        var specificRowData = [];
        for (var col of row) {
            specificRowData.push(col.toString());
        }
        rowsData.push(specificRowData.join(" "));
    }
    return rowsData.join("\n");
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
        if (i == j) input.value = 100; else input.value = 0;
        input.step = 1;
        input.style.width = "100%";
        input.style.boxSizing = "border-box";
        input.id = `cmatrixinput${i}${j}`;
        document.querySelector(`#cmatrixcell${i}${j}`).appendChild(input);
        input.addEventListener("input", function() {
            colorMatrixValues[parseInt(this.id.split("cmatrixinput")[1].split("")[0])][parseInt(this.id.split("cmatrixinput")[1].split("")[1])] = parseFloat(this.value) / 100;
            document.querySelector("#colorgrade feColorMatrix").setAttribute("values", arraytostring(colorMatrixValues));
            newPreview();
        });
    }
}

document.querySelector("#vignettescalecontrol").addEventListener("input", function() {
    document.querySelectorAll("#vignetteGradient stop")[0].setAttribute("offset", (100 - parseFloat(this.value)).toString() + "%");
    newPreview();
});
document.querySelector("#vignettefillcontrol").addEventListener("input", function() {
    document.querySelector("#vignetteRect").setAttribute("fill-opacity", this.value / 100);
    newPreview();
});
document.querySelector("#vignettecolorcontrol").addEventListener("input", function() {
    document.querySelectorAll("#vignetteGradient stop")[1].style.stopColor = this.value;
    newPreview();
});
document.querySelector("#vignetteBlendingCtrl").addEventListener("input", function() {
    document.querySelector("#vignetteRect").style.mixBlendMode = this.value;
    newPreview();
});

document.querySelector("#tintfillcontrol").addEventListener("input", function() {
    document.querySelector("#tintlayer").setAttribute("fill-opacity", parseFloat(this.value) / 100);
    if (parseFloat(this.value) > 100) {
        document.querySelector("#tintlayerXtra").setAttribute("fill-opacity", parseFloat(this.value) / 100 - 1);
        document.querySelector("#tintlayer").setAttribute("fill-opacity", "1");
    }
    else {
        document.querySelector("#tintlayerXtra").setAttribute("fill-opacity", "0");
    }
    newPreview();
});
document.querySelector("#tintcolorcontrol").addEventListener("input", function() {
    document.querySelector("#tintlayer").style.fill = this.value;
    document.querySelector("#tintlayerXtra").style.fill = this.value;
    newPreview();
});

let basicAdj = {
    brightness: 1,
    contrast: 1,
    saturate: 1,
    sepia: 0,
};
function applyBasicAdj() {
    document.querySelector("#baseImage").setAttribute("filter", `
        brightness(${basicAdj["brightness"]})
        contrast(${basicAdj["contrast"]})
        saturate(${basicAdj["saturate"]})
        sepia(${basicAdj["sepia"]})
        url(#colorgrade)
    `);
}
document.querySelector("#brightnessCtrl").addEventListener("input", function() {
    basicAdj["brightness"] = parseFloat(this.value) / 100;
    applyBasicAdj();
    newPreview();
});
document.querySelector("#contrastCtrl").addEventListener("input", function() {
    basicAdj["contrast"] = parseFloat(this.value) / 100;
    applyBasicAdj();
    newPreview();
});
document.querySelector("#saturationCtrl").addEventListener("input", function() {
    basicAdj["saturate"] = parseFloat(this.value) / 100;
    applyBasicAdj();
    newPreview();
});
document.querySelector("#sepiaCtrl").addEventListener("input", function() {
    basicAdj["sepia"] = parseFloat(this.value) / 100;
    applyBasicAdj();
    newPreview();
});

function updateSplitToning() {
    var hColor = document.querySelector("#toningHColorCtrl").value;
    let hAmnt = parseFloat(document.querySelector("#toningHAmntCtrl").value);
    var sColor = document.querySelector("#toningSColorCtrl").value;
    let sAmnt = parseFloat(document.querySelector("#toningSAmntCtrl").value);
    document.querySelector("#toningH").style.filter = `brightness(${hAmnt / 2}%)`;
    document.querySelector("#toningS").style.filter = `invert(100%) brightness(${sAmnt / 2}%) invert(100%)`;
    document.querySelector("#toningH").style.fill = hColor;
    document.querySelector("#toningS").style.fill = sColor;
}

for (var x of ["#toningHColorCtrl", "#toningHAmntCtrl", "#toningSColorCtrl", "#toningSAmntCtrl"]) {
    document.querySelector(x).addEventListener("input", function() {
        updateSplitToning();
        newPreview();
    });
}

document.querySelector("#exportbutton").addEventListener("click", function() {
    var outputURI = document.querySelector("canvas").toDataURL();
        switch ((new URLSearchParams(location.search)).get("portal")) {
            case "photopea":
                Photopea.runScript(window.parent, `app.open("${outputURI}", null, true)`);
                break;
            default:
                var a = document.createElement("a");
                a.href = outputURI;
                a.download = "colortheater-output.png";
                a.click();
                break;
        }
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
            newPreview();
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
    document.querySelector("#startbutton").remove();
    document.querySelector("#welcomescreen img").setAttribute("width", "250px");
    Photopea.runScript(window.parent, "app.activeDocument.saveToOE('png')").then(function(data) {
        var buffer = data[0];
        var imageuri = "data:image/png;base64," + base64ArrayBuffer(buffer);
        document.querySelector("#baseImage").setAttribute("href", imageuri);
        var image = new Image();
        image.src = imageuri;
        image.addEventListener("load", function() {
            document.querySelector("svg").setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
            newPreview();
            document.querySelector("#welcomescreen").remove();
        });
    });
}

document.querySelector("#exportPresetBtn").addEventListener("click", () => {
    let xDoc = document.implementation.createDocument(null, "ctpreset");
    let root = xDoc.querySelector("ctpreset");
    let basicAdjNode = xDoc.createElement("basicAdj");
    basicAdjNode.setAttribute("brightness", basicAdj["brightness"] * 100);
    basicAdjNode.setAttribute("contrast", basicAdj["contrast"] * 100);
    basicAdjNode.setAttribute("saturate", basicAdj["saturate"] * 100);
    basicAdjNode.setAttribute("sepia", basicAdj["sepia"] * 100);
    root.appendChild(basicAdjNode);
    let splitToningNode = xDoc.createElement("splitToning");
    splitToningNode.setAttribute("hColor", document.querySelector("#toningHColorCtrl").value);
    splitToningNode.setAttribute("hAmnt", parseFloat(document.querySelector("#toningHAmntCtrl").value));
    splitToningNode.setAttribute("sColor", document.querySelector("#toningSColorCtrl").value);
    splitToningNode.setAttribute("sAmnt", parseFloat(document.querySelector("#toningSAmntCtrl").value));
    root.appendChild(splitToningNode);
    let cMatrixNode = xDoc.createElement("cMatrix");
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 5; col++) {
            let cellNode = xDoc.createElement("cell");
            let cellId = row + "" + col;
            cellNode.setAttribute("id", "cell" + cellId);
            cellNode.innerHTML = document.querySelector("#cmatrixcell" + cellId + " input[type=number]").value;
            cMatrixNode.appendChild(cellNode);
        }
    }
    root.appendChild(cMatrixNode);
    let vignetteNode = xDoc.createElement("vignette");
    vignetteNode.setAttribute("color", document.querySelector("#vignettecolorcontrol").value);
    vignetteNode.setAttribute("scale", document.querySelector("#vignettescalecontrol").value);
    vignetteNode.setAttribute("fill", document.querySelector("#vignettefillcontrol").value);
    vignetteNode.setAttribute("blending", document.querySelector("#vignetteBlendingCtrl").value);
    root.appendChild(vignetteNode);
    let tintNode = xDoc.createElement("tint");
    tintNode.setAttribute("color", document.querySelector("#tintcolorcontrol").value);
    tintNode.setAttribute("fill", document.querySelector("#tintfillcontrol").value);
    root.appendChild(tintNode);
    let cereal = new XMLSerializer();
    let output = cereal.serializeToString(xDoc);
    let blobFish = new Blob([ output ], { type: "application/ctxml" });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blobFish);
    a.download = "preset.ctxml";
    a.click();
});

document.querySelector("#importPresetBtn").addEventListener("click", () => {
    let fileUpload = document.createElement("input");
    fileUpload.type = "file";
    fileUpload.accept = ".ctxml";
    fileUpload.addEventListener("change", (e) => {
        let file = e.target.files[0];
        let fR = new FileReader();
        fR.addEventListener("loadend", (e2) => {
            let text = e2.target.result;
            let parser = new DOMParser();
            let xDoc = parser.parseFromString(text, "text/xml");
            let basicAdjNode = xDoc.querySelector("basicAdj");
            document.querySelector("#brightnessCtrl").value = basicAdjNode.getAttribute("brightness");
            basicAdj["brightness"] = parseFloat(document.querySelector("#brightnessCtrl").value) / 100;
            document.querySelector("#contrastCtrl").value = basicAdjNode.getAttribute("contrast");
            basicAdj["contrast"] = parseFloat(document.querySelector("#contrastCtrl").value) / 100;
            document.querySelector("#saturationCtrl").value = basicAdjNode.getAttribute("saturate");
            basicAdj["saturate"] = parseFloat(document.querySelector("#saturationCtrl").value) / 100;
            document.querySelector("#sepiaCtrl").value = basicAdjNode.getAttribute("sepia");
            basicAdj["sepia"] = parseFloat(document.querySelector("#sepiaCtrl").value) / 100;
            applyBasicAdj();
            let splitToningNode = xDoc.querySelector("splitToning");
            document.querySelector("#toningHColorCtrl").value = splitToningNode.getAttribute("hColor");
            document.querySelector("#toningHAmntCtrl").value = splitToningNode.getAttribute("hAmnt");
            document.querySelector("#toningSColorCtrl").value = splitToningNode.getAttribute("sColor");
            document.querySelector("#toningSAmntCtrl").value = splitToningNode.getAttribute("sAmnt");
            updateSplitToning();
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 5; col++) {
                    let cellId = row + "" + col;
                    let cellNode = xDoc.querySelector("cMatrix #cell" + cellId);
                    document.querySelector("#cmatrixcell" + cellId + " input[type=number]").value = cellNode.innerHTML;
                    colorMatrixValues[row][col] = parseFloat(cellNode.innerHTML) / 100;
                }
            }
            document.querySelector("#colorgrade feColorMatrix").setAttribute("values", arraytostring(colorMatrixValues));
            let vignetteNode = xDoc.querySelector("vignette");
            document.querySelector("#vignettecolorcontrol").value = vignetteNode.getAttribute("color");
            document.querySelector("#vignettescalecontrol").value = vignetteNode.getAttribute("scale");
            document.querySelector("#vignettefillcontrol").value = vignetteNode.getAttribute("fill");
            document.querySelector("#vignetteBlendingCtrl").value = vignetteNode.getAttribute("blending");
            document.querySelectorAll("#vignetteGradient stop")[0].setAttribute("offset", (100 - parseFloat(document.querySelector("#vignettescalecontrol").value)).toString() + "%");
            document.querySelector("#vignetteRect").setAttribute("fill-opacity", document.querySelector("#vignettefillcontrol").value / 100);
            document.querySelectorAll("#vignetteGradient stop")[1].style.stopColor = document.querySelector("#vignettecolorcontrol").value;
            document.querySelector("#vignetteRect").style.mixBlendMode = document.querySelector("#vignetteBlendingCtrl").value;
            let tintNode = xDoc.querySelector("tint");
            document.querySelector("#tintcolorcontrol").value = tintNode.getAttribute("color");
            document.querySelector("#tintfillcontrol").value = tintNode.getAttribute("fill");
            document.querySelector("#tintlayer").style.fill = document.querySelector("#tintfillcontrol").value;
            document.querySelector("#tintlayerXtra").style.fill = document.querySelector("#tintfillcontrol").value;
            document.querySelector("#tintlayer").setAttribute("fill-opacity", parseFloat(document.querySelector("#tintfillcontrol").value) / 100);
            if (parseFloat(document.querySelector("#tintfillcontrol").value) > 100) {
                document.querySelector("#tintlayerXtra").setAttribute("fill-opacity", parseFloat(document.querySelector("#tintfillcontrol").value) / 100 - 1);
                document.querySelector("#tintlayer").setAttribute("fill-opacity", "1");
            }
            else {
                document.querySelector("#tintlayerXtra").setAttribute("fill-opacity", "0");
            }

            newPreview();

        });
        fR.readAsText(file);
    });
    fileUpload.click();
});