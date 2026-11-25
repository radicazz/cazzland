/** Pure window geometry. No React, no DOM: safe to unit test. */

export type Size = { width: number; height: number };
export type Bounds = Size & { x: number; y: number };

/** Gap kept between a window and the workspace edge. */
export const PADDING = 12;
/** Fallback minimum window size when a panel does not declare one. */
export const DEFAULT_MIN: Size = { width: 300, height: 150 };

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Keep a window inside the workspace and above its minimum size. */
export function fit(bounds: Bounds, area: Size, min: Size = DEFAULT_MIN): Bounds {
  const availableWidth = Math.max(1, area.width - 2 * PADDING);
  const availableHeight = Math.max(1, area.height - 2 * PADDING);
  const width = clamp(bounds.width, Math.min(min.width, availableWidth), availableWidth);
  const height = clamp(bounds.height, Math.min(min.height, availableHeight), availableHeight);
  return {
    width,
    height,
    x: clamp(bounds.x, PADDING, Math.max(PADDING, area.width - width - PADDING)),
    y: clamp(bounds.y, PADDING, Math.max(PADDING, area.height - height - PADDING)),
  };
}

/** Move (or resize) `start` by a pointer/keyboard delta, then fit it to the workspace. */
export function applyDelta(
  start: Bounds,
  dx: number,
  dy: number,
  resize: boolean,
  area: Size,
  min: Size = DEFAULT_MIN,
): Bounds {
  const next = resize
    ? {
        ...start,
        width: Math.min(start.width + dx, area.width - start.x - PADDING),
        height: Math.min(start.height + dy, area.height - start.y - PADDING),
      }
    : { ...start, x: start.x + dx, y: start.y + dy };
  return fit(next, area, min);
}
