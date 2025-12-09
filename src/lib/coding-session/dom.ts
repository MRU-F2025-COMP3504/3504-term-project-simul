/**
 * DOM utility functions for coding session components
 */

/**
 * Calculate coordinates relative to a container element
 *
 * Converts absolute client coordinates to coordinates relative to the
 * container element's bounding box. Useful for recording mouse positions
 * within a specific container (e.g., editor area).
 *
 * @param element - The container element to use as reference
 * @param clientX - Absolute X coordinate (from MouseEvent)
 * @param clientY - Absolute Y coordinate (from MouseEvent)
 * @returns Object with x and y coordinates relative to the element
 *
 * @example
 * const editorDiv = document.getElementById('editor');
 * const {x, y} = positionWithin(editorDiv, event.clientX, event.clientY);
 * // x and y are now relative to editorDiv's top-left corner
 */
export function positionWithin(
  element: HTMLElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}
