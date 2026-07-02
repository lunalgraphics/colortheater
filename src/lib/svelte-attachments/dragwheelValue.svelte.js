/**
 * @typedef {Object} DragwheelOptions
 * @property {number} [debounceMs=250] - The delay in milliseconds to wait before triggering the change event.
 * @property {number} [sensitivity=2] - The number of horizontal pixels required to change the input by 1 step.
 */

/**
 * Svelte 5 Attachment for horizontal drag value adjustments on numeric input elements.
 * Changes the value instantly on drag, and debounces the 'change' event until dragging stops.
 *
 * @type {import('svelte/attachments').Attachment<HTMLInputElement, DragwheelOptions | undefined>}
 */
export function dragwheelValue(node, options = {}) {
  const debounceMs = options?.debounceMs ?? 250;
  const sensitivity = options?.sensitivity ?? 2;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let debounceTimer;
  
  // Track accumulated pixel movements
  let accumulatedX = 0;

  /**
   * Evaluates delta changes and applies clamped values back to the input
   * @param {number} stepDelta 
   */
  const updateInputValue = (stepDelta) => {
    const step = Number(node.step) || 1;
    const min = node.min === '' ? -Infinity : Number(node.min);
    const max = node.max === '' ? Infinity : Number(node.max);
    let value = Number(node.value) || 0;

    // Apply incremental steps
    value += stepDelta * step;

    // Clamp value strictly between DOM min and max bounds
    value = Math.min(max, Math.max(min, value));
    node.value = String(value);

    // 1. Instantly fire 'input' so live Svelte bindings react immediately
    node.dispatchEvent(new Event('input', { bubbles: true }));

    // 2. Debounce the native 'change' event for heavy tasks (like server updates)
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      node.dispatchEvent(new Event('change', { bubbles: true }));
    }, debounceMs);
  };

  /**
   * Tracks mouse movement across the screen
   * @param {MouseEvent} e
   */
  const handleMouseMove = (e) => {
    accumulatedX += e.movementX;

    // Determine how many formal steps have been cleared by movement sensitivity
    const stepsToMove = Math.trunc(accumulatedX / sensitivity);

    if (stepsToMove !== 0) {
      updateInputValue(stepsToMove);
      // Retain the remainder pixel fraction for smooth micro-movements
      accumulatedX %= sensitivity;
    }
  };

  /**
   * Tears down global listeners when user releases click
   */
  const handleMouseUp = () => {
    // Restore layout states
    document.body.style.cursor = '';
    node.style.cursor = 'ew-resize';

    // Remove window captures to stop dragging outside boundaries
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  /**
   * Initialises the drag session on primary click
   * @param {MouseEvent} e
   */
  const handleMouseDown = (e) => {
    // Ignore right clicks or secondary buttons
    if (e.button !== 0) return;
    
    // Ignore if input is disabled or read-only
    if (node.disabled || node.readOnly) return;

    // Focus input so it visually registers interaction
    node.focus();
    
    // Prevent highlighted text selections while scrubbing numbers
    e.preventDefault();

    // Reset layout accumulators
    accumulatedX = 0;

    // Force cursor persistence globally even if user drifts off-input
    document.body.style.cursor = 'ew-resize';

    // Hook onto window to maintain full capture across the viewport
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Give the input an intuitive visual hint on hover
  node.style.cursor = 'ew-resize';
  node.addEventListener('mousedown', handleMouseDown);

  // Return Svelte lifecycle cleanup method
  return () => {
    node.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    clearTimeout(debounceTimer);
  };
}
