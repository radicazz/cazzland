import { describe, expect, it } from "vitest";
import { genieVars } from "./motion";

describe("genieVars", () => {
  it("moves window center to launcher center", () => {
    const v = genieVars({ x: 100, y: 100, width: 400, height: 300 }, { x: 600, y: 800, width: 40, height: 40 });
    expect(v.x).toBe(620 - 300);
    expect(v.y).toBe(820 - 250);
  });
  it("clamps the scale", () => {
    const small = genieVars({ x: 0, y: 0, width: 4000, height: 4000 }, { x: 0, y: 0, width: 40, height: 40 });
    expect(small.sx).toBe(0.05);
    const big = genieVars({ x: 0, y: 0, width: 50, height: 50 }, { x: 0, y: 0, width: 40, height: 40 });
    expect(big.sy).toBe(0.4);
  });
});
