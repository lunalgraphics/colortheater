function newPreview() {
    var canv = document.querySelector("canvas");
    var svg = document.querySelector("svg");
    var vignetteStops = document.querySelectorAll("#vignetteGradient stop");
    var vignetteRect = document.querySelector("#vignetteRect");
    var tintLayers = [
        document.querySelector("#tintlayer"),
        document.querySelector("#tintlayerXtra")
    ];
    var baseImage = document.querySelector("#baseImage");
    var gradeFilter = document.querySelector("#colorgrade");

    var ctx = canv.getContext("2d");
    canv.width = svg.viewBox.animVal.width;
    canv.height = svg.viewBox.animVal.height;
    ctx.restore();
    ctx.save();
    ctx.filter = `url(#${gradeFilter.id})`;
    ctx.drawImage(baseImage, 0, 0);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
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
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    for (var layer of tintLayers) {
        ctx.fillStyle = layer.style.fill;
        ctx.globalAlpha = parseFloat(layer.getAttribute("fill-opacity"));
        ctx.fillRect(0, 0, canv.width, canv.height);
    }
}