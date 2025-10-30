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

/**
 * Check if a point is within an element's bounds
 *
 * @param element - The container element
 * @param clientX - Absolute X coordinate
 * @param clientY - Absolute Y coordinate
 * @returns true if the point is within the element, false otherwise
 */
export function isPointWithin(
  element: HTMLElement,
  clientX: number,
  clientY: number,
): boolean {
  const rect = element.getBoundingClientRect();
  return (
    clientX >= rect.left
    && clientX <= rect.right
    && clientY >= rect.top
    && clientY <= rect.bottom
  );
}

/**
 * Get the distance between two points
 *
 * @param x1 - First point X coordinate
 * @param y1 - First point Y coordinate
 * @param x2 - Second point X coordinate
 * @param y2 - Second point Y coordinate
 * @returns Euclidean distance between the two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
