import { describe, expect, it } from "vitest";
import { applyDelta, fit, PADDING } from "./geometry";

const area = { width: 1000, height: 600 };

describe("fit", () => {
  it("keeps a window inside the workspace padding", () => {
    const b = fit({ x: -50, y: 9999, width: 400, height: 300 }, area);
    expect(b.x).toBe(PADDING);
    expect(b.y).toBe(area.height - 300 - PADDING);
  });

  it("enforces the minimum size and the workspace maximum", () => {
    expect(fit({ x: 0, y: 0, width: 10, height: 10 }, area, { width: 380, height: 360 })).toMatchObject({ width: 380, height: 360 });
    expect(fit({ x: 0, y: 0, width: 5000, height: 5000 }, area)).toMatchObject({ width: 976, height: 576 });
  });

  it("never returns a negative size in a tiny workspace", () => {
    const b = fit({ x: 0, y: 0, width: 400, height: 300 }, { width: 10, height: 10 });
    expect(b.width).toBeGreaterThanOrEqual(1);
    expect(b.height).toBeGreaterThanOrEqual(1);
  });
});

describe("applyDelta", () => {
  const start = { x: 100, y: 100, width: 400, height: 300 };

  it("moves by the delta", () => {
    expect(applyDelta(start, 30, -20, false, area)).toMatchObject({ x: 130, y: 80, width: 400, height: 300 });
  });

  it("clamps a drag to the workspace", () => {
    expect(applyDelta(start, 5000, 5000, false, area)).toMatchObject({ x: 1000 - 400 - PADDING, y: 600 - 300 - PADDING });
  });

  it("resizes without leaving the workspace or dropping below the minimum", () => {
    const grown = applyDelta(start, 5000, 5000, true, area);
    expect(grown.x + grown.width).toBeLessThanOrEqual(area.width - PADDING);
    const shrunk = applyDelta(start, -5000, -5000, true, area, { width: 320, height: 200 });
    expect(shrunk).toMatchObject({ width: 320, height: 200 });
  });
});
