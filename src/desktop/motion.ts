/** Window/dock motion: durations (ms, mirrored in window.css/dock.css) and pure helpers. */
import { clamp } from "./geometry";

export const MOTION = { open: 180, close: 140, genie: 240, morph: 240, bounce: 520 } as const;
/** Added to every duration so a missed animationend/transitionend can never strand a window. */
export const FALLBACK_MS = 80;

export type WindowPhase = "idle" | "entering" | "minimizing" | "restoring" | "morphing";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const prefersReducedMotion = () => matchMedia(REDUCED_MOTION_QUERY).matches;

type Rect = { x: number; y: number; width: number; height: number };

/** Offset and scale that carry a window's center onto the dock launcher's center. */
export function genieVars(win: Rect, launcher: Rect) {
  const sx = clamp(launcher.width / Math.max(win.width, 1), 0.05, 0.4);
  const sy = clamp(launcher.height / Math.max(win.height, 1), 0.05, 0.4);
  return {
    x: launcher.x + launcher.width / 2 - (win.x + win.width / 2),
    y: launcher.y + launcher.height / 2 - (win.y + win.height / 2),
    sx,
    sy,
  };
}
