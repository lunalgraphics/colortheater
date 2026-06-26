/**
 * Simple color class that supports conversion between hex, RGB, and HSL.
 */
export class Color {
    /** @type {number} 0–255 */
    r;
    /** @type {number} 0–255 */
    g;
    /** @type {number} 0–255 */
    b;

    /**
     * @param {number} r 0–255
     * @param {number} g 0–255
     * @param {number} b 0–255
     */
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    /**
     * Create a Color from a hex string (e.g. "#ff5400" or "ff5400").
     * @param {string} hex
     * @returns {Color}
     */
    static fromHex(hex) {
        hex = hex.replace(/^#/, "");
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return new Color(r, g, b);
    }

    /**
     * Create a Color from HSL values.
     * @param {number} h Hue in degrees (-180 to 360, wraps)
     * @param {number} s Saturation 0–100
     * @param {number} l Lightness 0–100
     * @returns {Color}
     */
    static fromHSL(h, s, l) {
        // Normalize hue to 0–360
        h = ((h % 360) + 360) % 360;
        s = Math.max(0, Math.min(100, s)) / 100;
        l = Math.max(0, Math.min(100, l)) / 100;

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;

        let r1, g1, b1;
        if (h < 60) { r1 = c; g1 = x; b1 = 0; }
        else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
        else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
        else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
        else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
        else { r1 = c; g1 = 0; b1 = x; }

        return new Color(
            Math.round((r1 + m) * 255),
            Math.round((g1 + m) * 255),
            Math.round((b1 + m) * 255),
        );
    }

    /**
     * Get the hex string representation (e.g. "#ff5400").
     * @returns {string}
     */
    get hex() {
        const toHex = (n) => n.toString(16).padStart(2, "0");
        return `#${toHex(this.r)}${toHex(this.g)}${toHex(this.b)}`;
    }

    /**
     * Get HSL values.
     * @returns {{ h: number, s: number, l: number }} h: 0–360, s: 0–100, l: 0–100
     */
    get hsl() {
        const r = this.r / 255;
        const g = this.g / 255;
        const b = this.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;

        let h = 0;
        if (d !== 0) {
            if (max === r) h = ((g - b) / d) % 6;
            else if (max === g) h = (b - r) / d + 2;
            else h = (r - g) / d + 4;
            h *= 60;
            if (h < 0) h += 360;
        }

        const l = (max + min) / 2;
        const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

        return {
            h: Math.round(h * 10) / 10,
            s: Math.round(s * 1000) / 10,
            l: Math.round(l * 1000) / 10,
        };
    }

    /**
     * Get CSS hsl() string.
     * @returns {string}
     */
    get hslString() {
        const { h, s, l } = this.hsl;
        return `hsl(${h}deg, ${s}%, ${l}%)`;
    }
}
