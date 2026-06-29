import { gradeState } from "./state.svelte.js";

/**
 * Keys from gradeState that we track in history (excludes image source/dimensions).
 */
const TRACKED_KEYS = [
    "brightness", "contrast", "saturation", "sepia",
    "colorMatrix",
    "tintColor", "tintAmount",
    "highlightColor", "highlightAmount",
    "shadowColor", "shadowAmount",
    "vignetteColor", "vignetteSize", "vignetteOpacity", "vignetteBlending",
];

/**
 * Take a deep snapshot of the tracked gradeState properties.
 * @returns {object}
 */
function snapshot() {
    const snap = {};
    for (const key of TRACKED_KEYS) {
        const val = gradeState[key];
        snap[key] = Array.isArray(val) ? val.map(row => [...row]) : val;
    }
    return snap;
}

/**
 * Restore a snapshot into gradeState.
 * @param {object} snap
 */
function restore(snap) {
    for (const key of TRACKED_KEYS) {
        const val = snap[key];
        gradeState[key] = Array.isArray(val) ? val.map(row => [...row]) : val;
    }
}

/** @type {object[]} */
let undoStack = [];
/** @type {object[]} */
let redoStack = [];

/** Debounce timer for coalescing rapid changes into one history entry */
let debounceTimer = null;

/**
 * Counter for how many pushHistory calls to skip.
 * Incremented before a restore, decremented when pushHistory is called.
 * This handles the async nature of Svelte effects — the effect fires AFTER
 * the synchronous restore completes, so a simple boolean flag doesn't work.
 */
let skipCount = 0;

/**
 * Call this to record the current state into history.
 * Debounced — rapid calls within 400ms are coalesced into one entry.
 */
export function pushHistory() {
    if (skipCount > 0) {
        skipCount--;
        return;
    }

    if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
        debounceTimer = null;
        const snap = snapshot();

        // Don't push if identical to the last entry
        if (undoStack.length > 0) {
            const last = undoStack[undoStack.length - 1];
            if (JSON.stringify(last) === JSON.stringify(snap)) return;
        }

        undoStack.push(snap);
        // Cap history at 50 entries
        if (undoStack.length > 50) undoStack.shift();
        // Any new change invalidates the redo stack
        redoStack = [];
    }, 400);
}

/**
 * Undo: restore the previous state.
 */
export function undo() {
    // Flush any pending debounced push so we have the latest state saved
    if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
        const snap = snapshot();
        if (undoStack.length === 0 || JSON.stringify(undoStack[undoStack.length - 1]) !== JSON.stringify(snap)) {
            undoStack.push(snap);
        }
    }

    if (undoStack.length <= 1) return; // Need at least 2: one to stay as "current was", one to restore to

    // The top of the stack is the current state — pop it to redo stack
    redoStack.push(undoStack.pop());

    // Now restore the new top
    const prev = undoStack[undoStack.length - 1];
    skipCount++;
    restore(prev);
}

/**
 * Redo: restore the next state from the redo stack.
 */
export function redo() {
    if (redoStack.length === 0) return;

    const next = redoStack.pop();
    undoStack.push(next);
    skipCount++;
    restore(next);
}

/**
 * Initialize history with the current state as the baseline.
 * Call once after the app is ready.
 */
export function initHistory() {
    undoStack = [snapshot()];
    redoStack = [];
}

/**
 * Keyboard event handler for undo/redo.
 * Attach to window keydown.
 * @param {KeyboardEvent} e
 */
export function handleUndoRedoKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === "Z" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
    }
}
