/**
 * Renders the color-graded preview onto a <canvas> element.
 * Reads all parameters from the state object passed in — no DOM/SVG querying.
 *
 * @param {HTMLCanvasElement} canvas - Target canvas element
 * @param {HTMLImageElement} image - Source image element (must be loaded)
 * @param {object} state - The gradeState object from state.svelte.js
 */
export default function newPreview(canvas, image, state) {
    if (!image || !image.complete || !image.naturalWidth) return;

    const w = state.imageWidth;
    const h = state.imageHeight;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");

    // --- 1. Draw base image with basic adjustments (brightness, contrast, saturation, sepia) ---
    ctx.save();
    ctx.filter = [
        `brightness(${state.brightness / 100})`,
        `contrast(${state.contrast / 100})`,
        `saturate(${state.saturation / 100})`,
        `sepia(${state.sepia / 100})`,
    ].join(" ");
    ctx.drawImage(image, 0, 0, w, h);
    ctx.restore();

    // --- 2. Apply color matrix via WebGL ---
    const matrix = flattenColorMatrix(state.colorMatrix);
    const gpuResult = applyGPUColorMatrix(canvas, matrix);
    if (gpuResult) {
        ctx.save();
        ctx.drawImage(gpuResult, 0, 0);
        ctx.restore();
    }

    // --- 3. Tint overlay (soft-light blend) ---
    if (state.tintAmount > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "soft-light";
        ctx.fillStyle = state.tintColor;
        // Amount 0–100 maps to opacity 0–1, 100–200 draws a second pass
        const primaryOpacity = Math.min(state.tintAmount, 100) / 100;
        ctx.globalAlpha = primaryOpacity;
        ctx.fillRect(0, 0, w, h);
        if (state.tintAmount > 100) {
            ctx.globalAlpha = (state.tintAmount - 100) / 100;
            ctx.fillRect(0, 0, w, h);
        }
        ctx.restore();
    }

    // --- 4. Split toning (highlights via color-dodge, shadows via color-burn) ---
    if (state.highlightAmount > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "color-dodge";
        ctx.fillStyle = state.highlightColor;
        ctx.filter = `brightness(${state.highlightAmount / 2}%)`;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }
    if (state.shadowAmount > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "color-burn";
        ctx.fillStyle = state.shadowColor;
        ctx.filter = `invert(100%) brightness(${state.shadowAmount / 2}%) invert(100%)`;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }

    // --- 5. Vignette ---
    if (state.vignetteOpacity > 0) {
        ctx.save();
        ctx.globalCompositeOperation = state.vignetteBlending;
        ctx.globalAlpha = state.vignetteOpacity / 100;

        // Render vignette gradient into an offscreen buffer
        const vBuffer = document.createElement("canvas");
        vBuffer.width = 512;
        vBuffer.height = 512;
        const vCtx = vBuffer.getContext("2d");
        const grad = vCtx.createRadialGradient(256, 256, 0, 256, 256, 256);
        // Inner stop: transparent from center outward based on size
        const innerOffset = (100 - state.vignetteSize) / 100;
        grad.addColorStop(innerOffset, "transparent");
        grad.addColorStop(1, state.vignetteColor);
        vCtx.fillStyle = grad;
        vCtx.fillRect(0, 0, 512, 512);

        // Draw stretched to cover canvas with 22% overflow (matches original ellipse rx/ry = 72%)
        ctx.drawImage(vBuffer, -w * 0.22, -h * 0.22, w * 1.44, h * 1.44);
        ctx.restore();
    }
}

/**
 * Convert the 4x4+offsets percentage matrix into a flat 20-element array
 * with values in the 0–1 range (suitable for WebGL).
 *
 * @param {number[][]} matrix - 4x5 matrix with percentage values (100 = 1.0)
 * @returns {number[]} Flat 20-element array
 */
function flattenColorMatrix(matrix) {
    const flat = [];
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 5; col++) {
            flat.push(matrix[row][col] / 100);
        }
    }
    return flat;
}

// --- Singleton WebGL context for color matrix operations ---
// Avoids the cost of creating a canvas, compiling shaders, and linking a program every frame.

/** @type {{ canvas: HTMLCanvasElement, gl: WebGLRenderingContext, program: WebGLProgram, texture: WebGLTexture, locs: { matrix: WebGLUniformLocation, offset: WebGLUniformLocation, resolution: WebGLUniformLocation } } | null} */
let glState = null;

function getGLState() {
    if (glState) return glState;

    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false });
    if (!gl) return null;

    const vs = `
        attribute vec2 p;
        void main() { gl_Position = vec4(p, 0, 1); }
    `;

    const fs = `
        precision mediump float;
        uniform sampler2D tex;
        uniform mat4 u_matrix;
        uniform vec4 u_offset;
        uniform vec2 u_resolution;
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;
            vec4 color = texture2D(tex, vec2(uv.x, 1.0 - uv.y));
            gl_FragColor = clamp((color * u_matrix) + u_offset, 0.0, 1.0);
        }
    `;

    // Compile shaders
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

    // Fullscreen quad (permanent buffer)
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const pLoc = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(pLoc);
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

    // Create a reusable texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Cache uniform locations
    const locs = {
        matrix: gl.getUniformLocation(program, "u_matrix"),
        offset: gl.getUniformLocation(program, "u_offset"),
        resolution: gl.getUniformLocation(program, "u_resolution"),
    };

    glState = { canvas, gl, program, texture, locs };
    return glState;
}

/**
 * Apply a 4x5 color matrix to an image element using WebGL for GPU acceleration.
 * Uses a persistent WebGL context to avoid per-frame setup costs.
 *
 * @param {HTMLCanvasElement|HTMLImageElement} imageElement - Source to read pixels from
 * @param {number[]} matrix - Flat 20-element matrix (values in 0–1 range)
 * @returns {HTMLCanvasElement|null} Canvas with the result, or null if WebGL unavailable
 */
function applyGPUColorMatrix(imageElement, matrix) {
    const state = getGLState();
    if (!state) return null;

    const { canvas, gl, texture, locs } = state;

    const w = imageElement.naturalWidth || imageElement.width;
    const h = imageElement.naturalHeight || imageElement.height;

    // Resize only when dimensions change
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
    }

    // Upload source pixels into the existing texture
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageElement);

    // Update uniforms
    gl.uniformMatrix4fv(locs.matrix, false, new Float32Array([
        matrix[0],  matrix[5],  matrix[10], matrix[15],
        matrix[1],  matrix[6],  matrix[11], matrix[16],
        matrix[2],  matrix[7],  matrix[12], matrix[17],
        matrix[3],  matrix[8],  matrix[13], matrix[18],
    ]));
    gl.uniform4fv(locs.offset, new Float32Array([matrix[4], matrix[9], matrix[14], matrix[19]]));
    gl.uniform2f(locs.resolution, w, h);
    gl.viewport(0, 0, w, h);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return canvas;
}
