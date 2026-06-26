function applyGPUColorMatrix(imageElement, matrix) {
    const glCanvas = document.createElement('canvas');
    const gl = glCanvas.getContext('webgl');
    if (!gl) return null;

    // Use the actual backing store dimensions (works for both canvas and image elements)
    const w = imageElement.naturalWidth || imageElement.width;
    const h = imageElement.naturalHeight || imageElement.height;
    glCanvas.width = w;
    glCanvas.height = h;

    // Vertex shader (passes coordinates through)
    const vs = `
        attribute vec2 p;
        void main() { gl_Position = vec4(p, 0, 1); }
    `;

    // Fragment shader (executes the 4x5 SVG color matrix on the GPU)
    const fs = `
        precision mediump float;
        uniform sampler2D tex;
        uniform mat4 u_matrix;
        uniform vec4 u_offset;
        uniform vec2 u_resolution;
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;
            vec4 color = texture2D(tex, vec2(uv.x, 1.0 - uv.y));
            gl_FragColor = (color * u_matrix) + u_offset;
        }
    `;

    // Compile shaders and link program
    const vsId = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsId, vs);
    gl.compileShader(vsId);

    const fsId = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsId, fs);
    gl.compileShader(fsId);

    const program = gl.createProgram();
    gl.attachShader(program, vsId);
    gl.attachShader(program, fsId);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Setup geometry (fullscreen quad)
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const pLoc = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(pLoc);
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

    // Upload image as a GPU texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageElement);

    // Pass matrix to GPU (transposed for WebGL column-major order)
    const matLoc = gl.getUniformLocation(program, 'u_matrix');
    gl.uniformMatrix4fv(matLoc, false, new Float32Array([
        matrix[0],  matrix[5],  matrix[10], matrix[15],  // R inputs
        matrix[1],  matrix[6],  matrix[11], matrix[16],  // G inputs
        matrix[2],  matrix[7],  matrix[12], matrix[17],  // B inputs
        matrix[3],  matrix[8],  matrix[13], matrix[18]   // A inputs
    ]));

    // Pass offsets to GPU (SVG offsets are already 0-1, matching WebGL's color range)
    const offsetLoc = gl.getUniformLocation(program, 'u_offset');
    gl.uniform4fv(offsetLoc, new Float32Array([matrix[4], matrix[9], matrix[14], matrix[19]]));

    // Pass resolution and set viewport to match full canvas dimensions
    const resLoc = gl.getUniformLocation(program, 'u_resolution');
    gl.uniform2f(resLoc, w, h);
    gl.viewport(0, 0, w, h);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return glCanvas;
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
    var matrix = document.querySelector("#colorgrade feColorMatrix").getAttribute("values").split(/\s+/).map((x) => parseFloat(x));
    var gpuResult = applyGPUColorMatrix(canv, matrix);
    if (gpuResult) {
        ctx.drawImage(gpuResult, 0, 0);
    }
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

export default newPreview;