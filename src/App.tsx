import { useEffect, useLayoutEffect, useReducer, useRef } from "react";
import { Dock } from "./components/Dock";
import { MenuBar } from "./components/MenuBar";
import { Wallpaper } from "./components/Wallpaper";
import { Shortcuts } from "./components/Shortcuts";
import { MOVE_HINT_ID, Window } from "./components/Window";
import { fit } from "./desktop/geometry";
import { defaultBounds, PANEL_IDS, PANELS, type PanelId } from "./desktop/panels";
import { useGestures } from "./desktop/useGestures";
import { DESKTOP_QUERY, useWorkspace } from "./desktop/useWorkspace";
import { activeWindow, hasVisibleMaximized, initialWindows, windowReducer } from "./desktop/windowReducer";
import "./styles/tokens.css";
import "./styles/wallpaper.css";
import "./styles/menubar.css";
import "./styles/shortcuts.css";
import "./styles/window.css";
import "./styles/dock.css";
import "./styles/panels.css";

export default function App() {
  const [state, dispatch] = useReducer(windowReducer, initialWindows);
  const workspace = useRef<HTMLElement>(null);
  const { area, areaRef, isDesktop } = useWorkspace(workspace);
  const { startPointer, startKeyboard } = useGestures(areaRef, isDesktop, dispatch);
  const windowEls = useRef<Partial<Record<PanelId, HTMLElement>>>({});
  const launchers = useRef<Partial<Record<PanelId, HTMLButtonElement>>>({});
  const pendingFocus = useRef<PanelId | null>(null);
  const active = activeWindow(state);

  // After `show`, move focus into the window (and scroll to it on the stacked mobile layout).
  useLayoutEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    pendingFocus.current = null;
    const panel = windowEls.current[id];
    panel?.focus({ preventScroll: true });
    if (!matchMedia(DESKTOP_QUERY).matches) panel?.scrollIntoView({ block: "start" });
  }, [state]);

  // Clicks inside a cross-origin iframe (the video) never reach React. The page blurs instead,
  // so raise whichever window now holds the focused iframe.
  useEffect(() => {
    function onBlur() {
      setTimeout(() => {
        const id = document.activeElement instanceof HTMLIFrameElement
          ? (document.activeElement.closest("[data-window]") as HTMLElement | null)?.dataset.window
          : undefined;
        if (id) dispatch({ type: "raise", id: id as PanelId });
      });
    }
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  function show(id: PanelId) {
    pendingFocus.current = id;
    dispatch({ type: "show", id });
  }

  function dismiss(id: PanelId, close: boolean) {
    dispatch({ type: close ? "close" : "minimize", id });
    launchers.current[id]?.focus({ preventScroll: true });
  }

  return (
    <div className="desktop">
      <Wallpaper />
      <MenuBar />
      <main className="desk-workspace" ref={workspace} aria-label="Desktop windows">
        <p id={MOVE_HINT_ID} className="sr-only">
          Use the arrow keys to move or resize. Hold Shift for larger steps.
        </p>
        <Shortcuts hidden={hasVisibleMaximized(state)} onOpen={show} />
        {PANEL_IDS.filter((id) => state.windows[id]).map((id) => {
          const win = state.windows[id]!;
          const min = PANELS[id].min;
          const bounds = fit(win.bounds ?? defaultBounds(id, area), area, min);
          const gesture = { id, bounds, min: min ?? { width: 300, height: 150 } };
          return (
            <Window
              key={id}
              id={id}
              bounds={bounds}
              state={win}
              active={active === id}
              zIndex={1 + state.order.indexOf(id)}
              isDesktop={isDesktop}
              register={(panel, element) => { windowEls.current[panel] = element ?? undefined; }}
              onRaise={(panel) => dispatch({ type: "raise", id: panel })}
              onMinimize={(panel) => dismiss(panel, false)}
              onClose={(panel) => dismiss(panel, true)}
              onToggleMaximize={(panel) => dispatch({ type: "toggleMaximize", id: panel })}
              onPointerGesture={(event, resize) => startPointer(event, { ...gesture, resize }, win.maximized)}
              onKeyGesture={(event, resize) => startKeyboard(event, { ...gesture, resize })}
            />
          );
        })}
      </main>
      <Dock
        open={state.order}
        minimized={(id) => Boolean(state.windows[id]?.minimized)}
        active={active}
        register={(id, element) => { launchers.current[id] = element ?? undefined; }}
        onToggle={(id) => (active === id && isDesktop ? dismiss(id, false) : show(id))}
      />
    </div>
  );
}
