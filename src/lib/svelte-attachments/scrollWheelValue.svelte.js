/**
 * @typedef {Object} ScrollwheelOptions
 * @property {number} [debounceMs=250] - The delay in milliseconds to wait before triggering the change event.
 */

/**
 * Svelte 5 Attachment for scrollwheel changes on numeric input elements.
 * Changes the value instantly on scroll, and debounces the 'change' event until the user stops.
 *
 * @type {import('svelte/attachments').Attachment<HTMLInputElement, ScrollwheelOptions | undefined>}
 */
export function scrollwheelValue(node, options = {}) {
  const debounceMs = options?.debounceMs ?? 250;
  
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let debounceTimer;

  /**
   * Handles the wheel event and modifies the input element value.
   * @param {WheelEvent} e 
   */
  const handleWheel = (e) => {
    // Only alter value if the input element is currently focused
    if (document.activeElement !== node) return;
    
    // Prevent default browser behavior (scrolling the actual web page)
    e.preventDefault(); 

    // Extract configurations and fallbacks from the DOM properties
    const step = Number(node.step) || 1;
    const min = node.min === '' ? -Infinity : Number(node.min);
    const max = node.max === '' ? Infinity : Number(node.max);
    let value = Number(node.value) || 0;

    // Increment or decrement based on scroll direction
    if (e.deltaY < 0) {
      value += step;
    } else {
      value -= step;
    }

    // Clamp value strictly between min and max bounds
    value = Math.min(max, Math.max(min, value));
    node.value = String(value);

    // 1. Instantly fire 'input' so live framework bindings (like bind:value) react immediately
    node.dispatchEvent(new Event('input', { bubbles: true }));

    // 2. Debounce the native 'change' event for heavy tasks (like autosaving or network requests)
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      node.dispatchEvent(new Event('change', { bubbles: true }));
    }, debounceMs);
  };

  // Passive: false is strict requirement to allow e.preventDefault() to block viewport scrolling
  node.addEventListener('wheel', handleWheel, { passive: false });

  // Return the mandatory Svelte cleanup method
  return () => {
    node.removeEventListener('wheel', handleWheel);
    clearTimeout(debounceTimer);
  };
}
