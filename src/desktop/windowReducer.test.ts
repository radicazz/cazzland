import { describe, expect, it } from "vitest";
import { activeWindow, hasVisibleMaximized, initialWindows, mobileWindows, windowReducer, type WindowsState } from "./windowReducer";

const bounds = { x: 20, y: 20, width: 400, height: 300 };
const run = (state: WindowsState, ...actions: Parameters<typeof windowReducer>[1][]) =>
  actions.reduce(windowReducer, state);

describe("windowReducer", () => {
  it("starts with videos under the terminal, terminal active", () => {
    expect(initialWindows.order).toEqual(["videos", "terminal"]);
    expect(activeWindow(initialWindows)).toBe("terminal");
  });

  it("phone default opens About on top of Videos, without the terminal", () => {
    expect(mobileWindows.order).toEqual(["videos", "about"]);
    expect(activeWindow(mobileWindows)).toBe("about");
    expect(mobileWindows.windows.terminal).toBeUndefined();
  });

  it("show opens a closed window on top", () => {
    const s = run(initialWindows, { type: "show", id: "about" });
    expect(s.order).toEqual(["videos", "terminal", "about"]);
    expect(activeWindow(s)).toBe("about");
  });

  it("raise reorders open windows but never opens a closed one", () => {
    expect(run(initialWindows, { type: "raise", id: "videos" }).order).toEqual(["terminal", "videos"]);
    expect(run(initialWindows, { type: "raise", id: "about" })).toBe(initialWindows);
  });

  it("minimize keeps bounds and maximized; show restores and raises", () => {
    const s = run(
      initialWindows,
      { type: "setBounds", id: "videos", bounds },
      { type: "toggleMaximize", id: "videos" },
      { type: "minimize", id: "videos" },
    );
    expect(activeWindow(s)).toBe("terminal");
    expect(hasVisibleMaximized(s)).toBe(false);
    const back = run(s, { type: "show", id: "videos" });
    expect(back.windows.videos).toEqual({ minimized: false, maximized: true, bounds });
    expect(activeWindow(back)).toBe("videos");
  });

  it("close discards bounds and maximized state", () => {
    const s = run(
      initialWindows,
      { type: "setBounds", id: "terminal", bounds },
      { type: "toggleMaximize", id: "terminal" },
      { type: "close", id: "terminal" },
      { type: "show", id: "terminal" },
    );
    expect(s.windows.terminal).toEqual({ minimized: false, maximized: false });
  });

  it("order always matches the open windows", () => {
    const s = run(initialWindows, { type: "show", id: "about" }, { type: "close", id: "videos" }, { type: "minimize", id: "terminal" });
    expect(s.order.toSorted()).toEqual(Object.keys(s.windows).toSorted());
  });

  it("ignores actions for windows that are not open", () => {
    for (const type of ["minimize", "close", "toggleMaximize"] as const) {
      expect(run(initialWindows, { type, id: "about" })).toBe(initialWindows);
    }
    expect(run(initialWindows, { type: "setBounds", id: "about", bounds })).toBe(initialWindows);
  });
});
