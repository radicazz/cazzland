import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { Dock } from "./components/Dock";
import { MenuBar } from "./components/MenuBar";
import { Wallpaper } from "./components/Wallpaper";
import { Shortcuts } from "./components/Shortcuts";
import { MOVE_HINT_ID, Window } from "./components/Window";
import { fit } from "./desktop/geometry";
import { prefersReducedMotion } from "./desktop/motion";
import { defaultBounds, PANEL_IDS, PANELS, type PanelId } from "./desktop/panels";
import { useGestures } from "./desktop/useGestures";
import { DESKTOP_QUERY, useWorkspace } from "./desktop/useWorkspace";
import { activeWindow, hasVisibleMaximized, initialWindows, windowReducer, type WindowState } from "./desktop/windowReducer";
import "./styles/tokens.css";
import "./styles/wallpaper.css";
import "./styles/menubar.css";
import "./styles/tabs.css";
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
  const tabs = useRef<Partial<Record<PanelId, HTMLButtonElement>>>({});
  const brand = useRef<HTMLButtonElement | null>(null);
  const pendingFocus = useRef<PanelId | null>(null);
  // Desktop focus target once a closed window's tab has left the DOM.
  const pendingTab = useRef<PanelId | "brand" | null>(null);
  const active = activeWindow(state);
  // Closed windows stay mounted until their exit animation ends. `gen` remounts a reopened window.
  const [exiting, setExiting] = useState<Partial<Record<PanelId, { win: WindowState; z: number }>>>({});
  const [gen, setGen] = useState<Partial<Record<PanelId, number>>>({});
  const launcherRect = useCallback((id: PanelId) => {
    // Query the DOM: inline ref callbacks are detached during commit, before Window's layout effects run.
    // Desktop minimizes toward the window's tab icon; the dock tile is the mobile fallback.
    const target = matchMedia(DESKTOP_QUERY).matches
      ? document.querySelector<HTMLElement>(`.desk-tabs [data-app="${id}"] .desk-tab-icon`) ?? document.querySelector<HTMLElement>(".desk-brand")
      : document.querySelector<HTMLElement>(`.desk-dock [data-app="${id}"] .desk-tile`);
    const rect = target?.getBoundingClientRect();
    return rect && (rect.width || rect.height) ? rect : undefined;
  }, []);
  const onExited = useCallback((id: PanelId) => {
    setExiting((current) => {
      if (!current[id]) return current;
      const { [id]: _done, ...rest } = current;
      return rest;
    });
  }, []);

  // After `show`, move focus into the window (and scroll to it on the stacked mobile layout).
  useLayoutEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    pendingFocus.current = null;
    const panel = windowEls.current[id];
    panel?.focus({ preventScroll: true });
    if (!matchMedia(DESKTOP_QUERY).matches) panel?.scrollIntoView({ block: "start" });
  }, [state]);

  // After a close, the tab is gone: focus the neighbouring tab (or the launcher) so focus never falls to <body>.
  useLayoutEffect(() => {
    const target = pendingTab.current;
    if (!target) return;
    pendingTab.current = null;
    (target === "brand" ? brand.current : tabs.current[target] ?? brand.current)?.focus({ preventScroll: true });
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

  // Panel bodies get stable callbacks (via a latest-ref) so PanelContent's memo keeps working.
  const latest = useRef({ show: (_id: PanelId) => {}, dismiss: (_id: PanelId, _close: boolean) => {} });
  const openApp = useCallback((id: PanelId) => latest.current.show(id), []);
  const closePanel = useCallback((id: PanelId) => latest.current.dismiss(id, true), []);

  function show(id: PanelId) {
    // Don't pull focus away from a window that already holds it (e.g. `terminal` typed in the terminal).
    if (!windowEls.current[id]?.contains(document.activeElement)) pendingFocus.current = id;
    if (exiting[id]) {
      onExited(id);
      setGen((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
    }
    dispatch({ type: "show", id });
  }

  function dismiss(id: PanelId, close: boolean) {
    const win = state.windows[id];
    if (close && win && !win.minimized && !prefersReducedMotion()) {
      setExiting((current) => ({ ...current, [id]: { win, z: 1 + state.order.indexOf(id) } }));
    }
    dispatch({ type: close ? "close" : "minimize", id });
    if (!isDesktop) launchers.current[id]?.focus({ preventScroll: true });
    else if (!close) tabs.current[id]?.focus({ preventScroll: true });
    else {
      const rest = PANEL_IDS.filter((panel) => state.windows[panel]);
      const index = rest.indexOf(id);
      pendingTab.current = rest[index + 1] ?? rest[index - 1] ?? "brand";
    }
  }

  function toggle(id: PanelId) {
    if (active === id && isDesktop) dismiss(id, false);
    else show(id);
  }

  latest.current = { show, dismiss };

  return (
    <div className="desktop">
      <Wallpaper />
      <MenuBar
        open={state.order}
        minimized={(id) => Boolean(state.windows[id]?.minimized)}
        active={active}
        showTabs={isDesktop}
        brandRef={brand}
        registerTab={(id, element) => { tabs.current[id] = element ?? undefined; }}
        onToggle={toggle}
        onClose={(id) => dismiss(id, true)}
        onOpen={show}
      />
      <main className="desk-workspace" ref={workspace} aria-label="Desktop windows">
        <p id={MOVE_HINT_ID} className="sr-only">
          Use the arrow keys to move or resize. Hold Shift for larger steps.
        </p>
        <Shortcuts hidden={hasVisibleMaximized(state)} onOpen={show} />
        {PANEL_IDS.filter((id) => state.windows[id] || exiting[id]).map((id) => {
          const ghost = state.windows[id] ? undefined : exiting[id];
          const win = (state.windows[id] ?? ghost?.win)!;
          const min = PANELS[id].min;
          const bounds = fit(win.bounds ?? defaultBounds(id, area), area, min);
          const gesture = { id, bounds, min: min ?? { width: 300, height: 150 } };
          return (
            <Window
              key={`${id}:${gen[id] ?? 0}`}
              id={id}
              closing={Boolean(ghost)}
              launcherRect={launcherRect}
              onExited={onExited}
              openApp={openApp}
              closePanel={closePanel}
              bounds={bounds}
              state={win}
              active={!ghost && active === id}
              zIndex={ghost ? ghost.z : 1 + state.order.indexOf(id)}
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
        onToggle={toggle}
      />
    </div>
  );
}
