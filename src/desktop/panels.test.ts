import { describe, expect, it } from "vitest";
import { PADDING, fit, type Bounds } from "./geometry";
import { defaultBounds, PANELS, SHORTCUTS_RESERVE, VIDEO_CHROME } from "./panels";

const overlaps = (a: Bounds, b: Bounds) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const inside = (b: Bounds, w: number, h: number) =>
  b.x >= PADDING - 0.5 && b.y >= PADDING - 0.5 && b.x + b.width <= w - PADDING + 0.5 && b.y + b.height <= h - PADDING + 0.5;

// Workspace = viewport minus the 54px menu bar.
const AREAS = [
  { width: 1920, height: 900 - 54 },
  { width: 1440, height: 800 - 54 },
  { width: 1024, height: 700 - 54 },
  { width: 800, height: 600 - 54 },
];

describe("defaultBounds terminal + videos", () => {
  for (const area of AREAS) {
    describe(`${area.width}x${area.height}`, () => {
      const videos = fit(defaultBounds("videos", area), area, PANELS.videos.min);
      const terminal = fit(defaultBounds("terminal", area), area, PANELS.terminal.min);
      const sideBySide = area.width >= 958;

      it("keeps both windows inside the workspace", () => {
        expect(inside(videos, area.width, area.height)).toBe(true);
        expect(inside(terminal, area.width, area.height)).toBe(true);
      });
      it("does not clip the video body", () => {
        expect(videos.height).toBeGreaterThanOrEqual((videos.width * 9) / 16 + VIDEO_CHROME - 0.5);
        expect(videos.width).toBeGreaterThanOrEqual(PANELS.videos.min!.width);
      });
      it("clears the shortcuts column when it is visible", () => {
        expect(terminal.x).toBeGreaterThanOrEqual(area.width > 900 ? SHORTCUTS_RESERVE : PADDING);
      });
      if (sideBySide) {
        it("places terminal left and videos right without overlap", () => {
          expect(overlaps(terminal, videos)).toBe(false);
          expect(terminal.x).toBeLessThan(videos.x);
          expect(terminal.y).toBeCloseTo(videos.y, 0);
        });
      } else {
        it("falls back to terminal over videos", () => {
          expect(overlaps(terminal, videos)).toBe(true);
        });
      }
    });
  }
});
