/**
 * Window-manager state. One entry per OPEN window; closing deletes the entry.
 *
 * Invariants (see docs/window-manager.md):
 *  - `order` is the stacking order, bottom to top, and holds exactly the open windows.
 *  - zIndex === 1 + index in `order`; the active window is the topmost non-minimized one.
 *  - minimize keeps bounds and maximized; close discards both (reopening gives defaults).
 *  - raise never opens a window; only `show` does.
 */
import type { Bounds } from "./geometry";
import type { PanelId } from "./panels";

export type WindowState = { minimized: boolean; maximized: boolean; bounds?: Bounds };
export type WindowsState = {
  order: PanelId[];
  windows: Partial<Record<PanelId, WindowState>>;
};

export type WindowAction =
  | { type: "show"; id: PanelId }
  | { type: "raise"; id: PanelId }
  | { type: "minimize"; id: PanelId }
  | { type: "close"; id: PanelId }
  | { type: "toggleMaximize"; id: PanelId }
  | { type: "setBounds"; id: PanelId; bounds: Bounds };

/** Desktop default. */
export const initialWindows: WindowsState = {
  order: ["videos", "terminal"],
  windows: {
    videos: { minimized: false, maximized: false },
    terminal: { minimized: false, maximized: false },
  },
};

/** Phone default: the terminal is too fiddly on a touch screen, so About leads (and is active, being on top). */
export const mobileWindows: WindowsState = {
  order: ["videos", "about"],
  windows: {
    videos: { minimized: false, maximized: false },
    about: { minimized: false, maximized: false },
  },
};

function toTop(order: PanelId[], id: PanelId) {
  return order.at(-1) === id ? order : [...order.filter((item) => item !== id), id];
}

export function windowReducer(state: WindowsState, action: WindowAction): WindowsState {
  const current = state.windows[action.id];

  switch (action.type) {
    case "show":
      return {
        order: toTop(state.order, action.id),
        windows: {
          ...state.windows,
          [action.id]: { maximized: false, ...current, minimized: false },
        },
      };
    case "raise": {
      if (!current) return state;
      const order = toTop(state.order, action.id);
      return order === state.order ? state : { ...state, order };
    }
    case "minimize":
      if (!current || current.minimized) return state;
      return { ...state, windows: { ...state.windows, [action.id]: { ...current, minimized: true } } };
    case "close": {
      if (!current) return state;
      const { [action.id]: _closed, ...windows } = state.windows;
      return { order: state.order.filter((id) => id !== action.id), windows };
    }
    case "toggleMaximize":
      if (!current) return state;
      return {
        order: toTop(state.order, action.id),
        windows: { ...state.windows, [action.id]: { ...current, maximized: !current.maximized } },
      };
    case "setBounds":
      if (!current) return state;
      return { ...state, windows: { ...state.windows, [action.id]: { ...current, bounds: action.bounds } } };
  }
}

/** Topmost window that is not minimized. */
export function activeWindow(state: WindowsState): PanelId | undefined {
  return state.order.findLast((id) => !state.windows[id]?.minimized);
}

export function hasVisibleMaximized(state: WindowsState) {
  return state.order.some((id) => state.windows[id]?.maximized && !state.windows[id]?.minimized);
}
