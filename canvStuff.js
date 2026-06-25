function applyColorMatrix(ctx, width, height, matrix) {
    // 1. Get raw pixel data
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // 2. Unpack matrix rows for faster loop execution
    const [
        rR, rG, rB, rA, rO,  // Red row: multipliers + offset
        gR, gG, gB, gA, gO,  // Green row
        bR, bG, bB, bA, bO,  // Blue row
        aR, aG, aB, aA, aO   // Alpha row
    ] = matrix;

    // 3. Convert SVG decimal offsets (0-1) into 8-bit canvas offsets (0-255)
    const rOffset = rO * 255;
    const gOffset = gO * 255;
    const bOffset = bO * 255;
    const aOffset = aO * 255;

    // 4. Process every pixel (4 array slots per pixel: R, G, B, A)
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Apply matrix calculations
        data[i]     = (r * rR) + (g * rG) + (b * rB) + (a * rA) + rOffset; // New Red
        data[i + 1] = (r * gR) + (g * gG) + (b * gB) + (a * gA) + gOffset; // New Green
        data[i + 2] = (r * bR) + (g * bG) + (b * bB) + (a * bA) + bOffset; // New Blue
        data[i + 3] = (r * aR) + (g * aG) + (b * aB) + (a * aA) + aOffset; // New Alpha
    }

    // 5. Write the modified pixels back to the canvas
    ctx.putImageData(imgData, 0, 0);
}

function newPreview() {
    var canv = document.querySelector("canvas");
    var svg = document.querySelector("svg");
    var vignetteStops = document.querySelectorAll("#vignetteGradient stop");
    var vignetteRect = document.querySelector("#vignetteRect");
    var tintLayers = [
        document.querySelector("#tintlayer"),
        document.querySelector("#tintlayerXtra")
    ];
    var toningLayers = [
        document.querySelector("#toningH"),
        document.querySelector("#toningS")
    ];
    var baseImage = document.querySelector("#baseImage");
    var gradeFilter = document.querySelector("#colorgrade");

    var ctx = canv.getContext("2d");
    canv.width = svg.viewBox.animVal.width;
    canv.height = svg.viewBox.animVal.height;
    ctx.restore();
    ctx.save();
    ctx.filter = baseImage.getAttribute("filter").replaceAll("url(#colorgrade)", "");
    ctx.drawImage(baseImage, 0, 0);
    ctx.restore();
    ctx.save();
    applyColorMatrix(ctx, canv.width, canv.height, [...colorMatrixValues[0], ...colorMatrixValues[1], ...colorMatrixValues[2], ...colorMatrixValues[3]]);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    for (var layer of tintLayers) {
        ctx.fillStyle = layer.style.fill;
        ctx.globalAlpha = parseFloat(layer.getAttribute("fill-opacity"));
        ctx.fillRect(0, 0, canv.width, canv.height);
    }
    ctx.restore();
    ctx.save();
    for (var tLayer of toningLayers) {
        ctx.fillStyle = tLayer.style.fill;
        ctx.globalCompositeOperation = tLayer.style["mix-blend-mode"];
        ctx.filter = tLayer.style.filter;
        ctx.fillRect(0, 0, canv.width, canv.height);
    }
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = vignetteRect.style.mixBlendMode;
    var vignetteBuffer = document.createElement("canvas");
    vignetteBuffer.width = 512; vignetteBuffer.height = 512;
    var grad = vignetteBuffer.getContext("2d").createRadialGradient(
        256, 256,
        0,
        256, 256,
        256
    );
    for (var stop of vignetteStops) {
        grad.addColorStop(stop.offset.animVal, stop.style.stopColor);
    }
    vignetteBuffer.getContext("2d").fillStyle = grad;
    vignetteBuffer.getContext("2d").fillRect(0, 0, 512, 512);
    ctx.globalAlpha = parseFloat(vignetteRect.getAttribute("fill-opacity"));
    ctx.drawImage(vignetteBuffer, -canv.width * 0.22, -canv.height * 0.22, canv.width * 1.44, canv.height * 1.44);
}