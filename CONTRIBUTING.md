# Contributing to Color Theater

Thanks for your interest in contributing. This document covers how to set up the project, what the conventions are, and where contributions are most welcome.

---

## Getting started

1. Fork the repo and clone your fork
2. `npm install`
3. `npm run dev` to start the dev server

The web app runs on `http://localhost:5173`. There's no test suite, so you'll be verifying changes manually in the browser.

---

## Areas where contributions are welcome

**New built-in presets** — The easiest kind of contribution. See [Adding a Preset](#adding-a-preset) below.

**New color grading controls** — Curves, levels, HSL selective color, etc. See [Adding a Control](#adding-a-control).

**Render engine improvements** — Performance, correctness, or new blending modes in `src/lib/renderEngine/`.

**UI/UX improvements** — Better layouts, accessibility, mobile experience.

**LUT improvements** — Larger grid accuracy, new export formats.

**Photopea integration** — The `photopeaScripts.js` integration is relatively new and has rough edges. Improvements are very welcome.

---

## Adding a Preset

Open `src/lib/utils/builtInPresets.js` and add an entry to the `builtInPresets` array:

```js
{
    name: "Your Preset Name",
    values: {
        brightness: 100, contrast: 100, saturation: 100, sepia: 0,
        colorMatrix: [[100,0,0,0,0],[0,100,0,0,0],[0,0,100,0,0],[0,0,0,100,0]],
        tintColor: "#808080", tintAmount: 0,
        highlightColor: "#808080", highlightAmount: 0,
        shadowColor: "#808080", shadowAmount: 0,
        vignetteColor: "#000000", vignetteSize: 50, vignetteOpacity: 0, vignetteBlending: "multiply",
    },
},
```

The easiest workflow is to dial in a look using the app itself, then use **Export Preset** to get a `.ctpreset.json` file. The JSON fields map directly to the `values` object above.

All numeric values are in percentage units (100 = identity for multiplicative parameters, 0 = off for additive ones). Colors are hex strings.

---

## Adding a Control

The grading pipeline reads everything from the `gradeState` object in `src/lib/state.svelte.js`. To add a new control:

### 1. Add the property to `gradeState`

```js
// in state.svelte.js
export const gradeState = $state({
    // ... existing properties
    myNewParameter: 0, // describe units here
});
```

Also add it to `resetState()` and to the `previewRefs` shape if needed.

### 2. Add it to the history tracker

Open `src/lib/history.svelte.js` and add the property name to `TRACKED_KEYS`:

```js
const TRACKED_KEYS = [
    // ...
    "myNewParameter",
];
```

### 3. Implement the rendering effect

Open `src/lib/renderEngine/index.js` and add a new numbered pass to `renderEngine()`, or modify an existing pass. The function receives the full state object and draws to a `<canvas>`.

### 4. Create a control component

Add a `.svelte` file in `src/lib/components/controls/`. Bind directly to `gradeState` using Svelte's `bind:value`:

```svelte
<script>
    import { gradeState } from "../../state.svelte";
    import Slider from "../Slider.svelte";
</script>

<i>My New Control</i> <br />
<Slider bind:value={gradeState.myNewParameter} min={0} max={100} --width="100%" />
```

### 5. Add it to the panel

Import and add your component inside `src/lib/components/ControlPanel.svelte`.

### 6. Update presets

Add the new property to:
- `exportPreset()` in `builtInPresets.js`
- `importPreset()` in `builtInPresets.js` (with a sensible fallback for old presets)
- The `values` shape of each built-in preset
- The `buildPreviewState()` helper in `PresetControls.svelte`

---

## Code conventions

**State is the single source of truth.** Don't read from the DOM or from SVG attributes. Read from `gradeState`. Write to `gradeState`. The render pipeline reads state and draws — it doesn't write back.

**Render function is pure-ish.** `renderEngine(canvas, image, state)` should produce the same output for the same inputs. It has a WebGL singleton for performance (unavoidable), but no other side effects.

**Keep render and UI separate.** Components bind to `gradeState`. `renderEngine` reads `gradeState`. They don't call each other directly — the `$effect` in `App.svelte` is the bridge.

**Svelte 5 runes only.** Use `$state`, `$derived`, `$effect`, `$props`, `$bindable`. Don't use Svelte 4's store API (`writable`, `readable`, etc.).

**No DOM querying in components.** Svelte's `bind:this` is fine for getting element refs. `document.querySelector` outside of event handlers is a red flag.

**All values in display units.** Store percentages (0–100 or 0–200), hex color strings, etc. in state. Convert to 0–1 floats or CSS values only at the point of use inside `renderEngine` or `ctx.filter`.

---

## Pull Request checklist

- [ ] `npm run build` passes with no errors
- [ ] The feature works in the browser via `npm run dev`
- [ ] New `gradeState` properties are added to `TRACKED_KEYS` in `history.svelte.js`
- [ ] New parameters are handled in `exportPreset`, `importPreset`, and built-in preset objects
- [ ] Comments explain any non-obvious logic (especially in `renderEngine` and `LutUtils`)
- [ ] No hardcoded magic numbers without an explanatory comment

---

## Questions

Open an issue if you're unsure where something should go. The codebase is small enough that a quick read of `App.svelte`, `state.svelte.js`, and `renderEngine/index.js` will give you the full picture.
