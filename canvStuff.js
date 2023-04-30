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
    var grad = ctx.createRadialGradient(
        canv.width / 2, canv.height / 2,
        0,
        canv.width / 2, canv.height / 2,
        Math.max(canv.width, canv.height) * 0.72, // why can't I make it elliptical???
    );
    for (var stop of vignetteStops) {
        grad.addColorStop(stop.offset.animVal, stop.style.stopColor);
    }
    ctx.fillStyle = grad;
    ctx.globalAlpha = parseFloat(vignetteRect.getAttribute("fill-opacity"));
    ctx.fillRect(0, 0, canv.width, canv.height);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    for (var layer of tintLayers) {
        ctx.fillStyle = layer.style.fill;
        ctx.globalAlpha = parseFloat(layer.getAttribute("fill-opacity"));
        ctx.fillRect(0, 0, canv.width, canv.height);
    }
}