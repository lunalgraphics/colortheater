<script>
    import newPreview from "./lib/scripts/canvStuff.js";
    import setUpColorInputs from "./lib/scripts/newColourInput.js";
    import { builtInPresets, populatePresetPicker } from "./lib/scripts/builtInPresets.js";

    import { onMount, tick } from "svelte";

    import Photopea from "photopea";

    import bannerImg from "./lib/assets/banner.png";

    function arraytostring(arr) {
        let rowsData = [];
        for (let row of arr) {
            let specificRowData = [];
            for (let col of row) {
                specificRowData.push(col.toString());
            }
            rowsData.push(specificRowData.join(" "));
        }
        return rowsData.join("\n");
    }

    let colorMatrixValues = [
        [1, 0, 0, 0, 0],
        [0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 1, 0],
    ];
    

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

    function updateSplitToning() {
        let hColor = document.querySelector("#toningHColorCtrl").value;
        let hAmnt = parseFloat(document.querySelector("#toningHAmntCtrl").value);
        let sColor = document.querySelector("#toningSColorCtrl").value;
        let sAmnt = parseFloat(document.querySelector("#toningSAmntCtrl").value);
        document.querySelector("#toningH").style.filter = `brightness(${hAmnt / 2}%)`;
        document.querySelector("#toningS").style.filter = `invert(100%) brightness(${sAmnt / 2}%) invert(100%)`;
        document.querySelector("#toningH").style.fill = hColor;
        document.querySelector("#toningS").style.fill = sColor;
    }

    onMount(() => {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 5; j++) {
                let input = document.createElement("input");
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

        for (let x of ["#toningHColorCtrl", "#toningHAmntCtrl", "#toningSColorCtrl", "#toningSAmntCtrl"]) {
            document.querySelector(x).addEventListener("input", function() {
                updateSplitToning();
                newPreview();
            });
        }

        document.querySelector("#exportbutton").addEventListener("click", function() {
            let outputURI = document.querySelector("canvas").toDataURL();
                switch ((new URLSearchParams(location.search)).get("portal")) {
                    case "photopea":
                        let pea = new Photopea(window.parent);
                        pea.openFromURL(outputURI);
                        break;
                    default:
                        let a = document.createElement("a");
                        a.href = outputURI;
                        a.download = "colortheater-output.png";
                        a.click();
                        break;
                }
        });

        document.querySelector("input[type=file]").addEventListener("change", function() {
            let file = this.files[0];
            let fR = new FileReader();
            fR.addEventListener("loadend", function(e) {
                let imageuri = e.target.result;
                document.querySelector("#baseImage").setAttribute("href", imageuri);
                let image = new Image();
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
            const pea = new Photopea(window.parent);
            pea.exportImage("png").then((blob) => {
                let imageuri = URL.createObjectURL(blob);
                document.querySelector("#baseImage").setAttribute("href", imageuri);
                let image = new Image();
                image.addEventListener("load", function() {
                    document.querySelector("svg").setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
                    newPreview();
                    document.querySelector("#welcomescreen").remove();
                });
                image.src = imageuri;
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

        function applyPreset(text) {
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
            document.querySelector("#toningHColorCtrl").dispatchEvent(new Event("input"));
            document.querySelector("#toningHAmntCtrl").value = splitToningNode.getAttribute("hAmnt");
            document.querySelector("#toningSColorCtrl").value = splitToningNode.getAttribute("sColor");
            document.querySelector("#toningSColorCtrl").dispatchEvent(new Event("input"));
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
            document.querySelector("#vignettecolorcontrol").dispatchEvent(new Event("input"));
            document.querySelector("#vignettescalecontrol").value = vignetteNode.getAttribute("scale");
            document.querySelector("#vignettefillcontrol").value = vignetteNode.getAttribute("fill");
            document.querySelector("#vignetteBlendingCtrl").value = vignetteNode.getAttribute("blending");
            document.querySelectorAll("#vignetteGradient stop")[0].setAttribute("offset", (100 - parseFloat(document.querySelector("#vignettescalecontrol").value)).toString() + "%");
            document.querySelector("#vignetteRect").setAttribute("fill-opacity", document.querySelector("#vignettefillcontrol").value / 100);
            document.querySelectorAll("#vignetteGradient stop")[1].style.stopColor = document.querySelector("#vignettecolorcontrol").value;
            document.querySelector("#vignetteRect").style.mixBlendMode = document.querySelector("#vignetteBlendingCtrl").value;
            let tintNode = xDoc.querySelector("tint");
            document.querySelector("#tintcolorcontrol").value = tintNode.getAttribute("color");
            document.querySelector("#tintcolorcontrol").dispatchEvent(new Event("input"));
            document.querySelector("#tintfillcontrol").value = tintNode.getAttribute("fill");
            document.querySelector("#tintlayer").style.fill = document.querySelector("#tintcolorcontrol").value;
            document.querySelector("#tintlayerXtra").style.fill = document.querySelector("#tintcolorcontrol").value;
            document.querySelector("#tintlayer").setAttribute("fill-opacity", parseFloat(document.querySelector("#tintfillcontrol").value) / 100);
            if (parseFloat(document.querySelector("#tintfillcontrol").value) > 100) {
                document.querySelector("#tintlayerXtra").setAttribute("fill-opacity", parseFloat(document.querySelector("#tintfillcontrol").value) / 100 - 1);
                document.querySelector("#tintlayer").setAttribute("fill-opacity", "1");
            }
            else {
                document.querySelector("#tintlayerXtra").setAttribute("fill-opacity", "0");
            }

            newPreview();
        }

        document.querySelector("#importPresetBtn").addEventListener("change", (e) => {
            if (e.target.value == "import_preset") {
                let fileUpload = document.createElement("input");
                fileUpload.type = "file";
                fileUpload.accept = ".ctxml";
                fileUpload.addEventListener("change", (e2) => {
                    let file = e2.target.files[0];
                    let fR = new FileReader();
                    fR.addEventListener("loadend", (e3) => {
                        let text = e3.target.result;
                        applyPreset(text);
                    });
                    fR.readAsText(file);
                });
                fileUpload.click();
            }
            else {
                applyPreset(e.target.value);
            }

            e.target.value = "nothing";
            e.target.blur();
        });
    });
</script>

<div id="previewspace">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1280">
        <defs>
            <filter id="colorgrade">
                <feColorMatrix
                    in="sourceGraphic"
                    type="matrix"
                    values="1 0 0 0 0
                            0 1 0 0 0
                            0 0 1 0 0
                            0 0 0 1 0"
                    color-interpolation-filters="sRGB"
                />
            </filter>
            <radialGradient id="vignetteGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="50%" style="stop-color: transparent; stop-opacity: 1;" />
                <stop offset="100%" style="stop-color: #000000; stop-opacity: 1;" />
            </radialGradient>
            <clipPath id="imagemask">
                <rect x="0" y="0" width="100%" height="100%" />
            </clipPath>
        </defs>
        <image id="baseImage" href="test-image.jpg" filter="brightness(1) contrast(1) saturate(1) sepia(0) url(#colorgrade)" image-rendering="optimizeQuality" clip-path="url(#imagemask)" />
        <rect id="tintlayer" x="0" y="0" width="100%" height="100%" style="mix-blend-mode: soft-light; fill: #004080;" fill-opacity="0"></rect>
        <rect id="tintlayerXtra" x="0" y="0" width="100%" height="100%" style="mix-blend-mode: soft-light; fill: #004080;" fill-opacity="0"></rect>
        <rect id="toningH" x="0" y="0" width="100%" height="100%" style="mix-blend-mode: color-dodge; fill: #ff5400; filter: brightness(0);"></rect>
        <rect id="toningS" x="0" y="0" width="100%" height="100%" style="mix-blend-mode: color-burn; fill: #0081ff; filter: invert(100%) brightness(0) invert(100%);"></rect>
        <ellipse id="vignetteRect" cx="50%" cy="50%" rx="72%" ry="72%" fill="url(#vignetteGradient)" style="mix-blend-mode: multiply;" fill-opacity="0" clip-path="url(#imagemask)" image-rendering="optimizeQuality"></ellipse>
    </svg>
    <canvas></canvas>
</div>
<div id="controlpanel">
    <div style="text-align: center;">
        <select id="importPresetBtn">
            <option disabled selected hidden value="nothing">Use a Preset</option>
            <option value="import_preset">Import .ctxml File</option>
            <optgroup label="Built-in Presets" id="builtInPresetsGroup"></optgroup>
        </select>
        <button id="exportPresetBtn">Export Preset</button>
    </div>
    <hr />
    <i>Basic Adjustments</i> <br />
    Brightness: <input type="number" id="brightnessCtrl" value="100" min="0" max="200" /> <br />
    Contrast: <input type="number" id="contrastCtrl" value="100" min="0" max="200" /> <br />
    Saturation: <input type="number" id="saturationCtrl" value="100" min="0" max="200" /> <br />
    Sepia: <input type="number" id="sepiaCtrl" value="0" min="0" max="100" /> <br />
    <hr />
    <i>Color Matrix</i> <br />
    <table style="width: 100%;" id="cmatrixTable">
        <tbody>
            <tr>
                <td></td><td style="color: #800000">R</td><td style="color: #008000">G</td><td style="color: #000080">B</td><td style="color: #808080">A</td><td style="color: #EEEEEE">+/-</td>
            </tr>
            <tr>
                <td style="color: #800000">R</td><td id="cmatrixcell00"></td><td id="cmatrixcell01"></td><td id="cmatrixcell02"></td><td id="cmatrixcell03"></td><td id="cmatrixcell04"></td>
            </tr>
            <tr>
                <td style="color: #008000">G</td><td id="cmatrixcell10"></td><td id="cmatrixcell11"></td><td id="cmatrixcell12"></td><td id="cmatrixcell13"></td><td id="cmatrixcell14"></td>
            </tr>
            <tr>
                <td style="color: #000080">B</td><td id="cmatrixcell20"></td><td id="cmatrixcell21"></td><td id="cmatrixcell22"></td><td id="cmatrixcell23"></td><td id="cmatrixcell24"></td>
            </tr>
            <tr>
                <td style="color: #808080">A</td><td id="cmatrixcell30"></td><td id="cmatrixcell31"></td><td id="cmatrixcell32"></td><td id="cmatrixcell33"></td><td id="cmatrixcell34"></td>
            </tr>
        </tbody>
    </table>
    <hr />
    <i>Tint</i> <br />
    Color: <input type="color" id="tintcolorcontrol" value="#004080" /> <br />
    Amount: <input type="number" id="tintfillcontrol" value="0" min="0" max="200" step="1" />
    <hr />
    <i>Split Toning</i> <br />
    Highlights: <br />
    - Color: <input type="color" id="toningHColorCtrl" value="#ff5400" /> <br />
    - Amount: <input type="number" id="toningHAmntCtrl" value="0" min="0" max="100" /> <br />
    Shadows: <br />
    - Color: <input type="color" id="toningSColorCtrl" value="#0081ff" /> <br />
    - Amount: <input type="number" id="toningSAmntCtrl" value="0" min="0" max="100" /> <br />
    <hr />
    <i>Vignette</i> <br />
    Color: <input type="color" id="vignettecolorcontrol" value="#000000" /> <br />
    Size: <input type="number" id="vignettescalecontrol" value="50" min="0" max="100" /> <br />
    Opacity: <input type="number" id="vignettefillcontrol" value="0" min="0" max="100" step="1" /> <br />
    Blending: <select value="multiply" id="vignetteBlendingCtrl">
        <option value="multiply">Multiply</option>
        <option value="overlay">Overlay</option>
        <option value="soft-light">Soft Light</option>
        <option value="screen">Screen</option>
    </select>
</div>
<div id="bottompanel">
    <button id="exportbutton">Export as PNG</button>
</div>
<div id="welcomescreen">
    <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); text-align: center;">
        <img src={bannerImg} draggable="false" width="420px" /> <br />
        <button id="startbutton">Upload image</button>
        <input type="file" accept="image/*" />
    </div>
</div>