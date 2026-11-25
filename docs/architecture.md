# Architecture

Cazzland is a single-page React app styled as a desktop OS: a menu bar, a wallpaper, draggable windows, desktop shortcuts and a dock. There is no router and no backend except one Vercel Function.

## Map

```
index.html                 Vite entry, meta/OG tags
api/latest-video.js        Vercel Function: newest YouTube upload (see docs/api.md)
api/_lib/feed.js           Feed parser (underscore = not deployed as a function)
public/                    Static assets served from /
src/main.tsx               Mounts <App/>
src/App.tsx                Composition root: owns window state, focus, wiring. No layout logic.
src/desktop/               Window manager, framework-light
  geometry.ts              PURE: Bounds/Size, fit(), applyDelta(), PADDING
  panels.ts                PURE data: PanelId, PANEL_IDS, PANELS (label/title/min), defaultBounds()
  windowReducer.ts         PURE: window state machine (see docs/window-manager.md)
  useWorkspace.ts          Workspace size + desktop/mobile breakpoint (areaRef avoids stale closures)
  useGestures.ts           Pointer drag/resize (rAF-batched) and arrow-key move/resize
  clockFormat.ts           PURE: menu bar clock formatting + next-minute delay
  motion.ts                PURE: animation durations, reduced-motion check, genie (minimize) vars
src/components/            Presentational pieces: Window, Dock, Shortcuts, MenuBar, Clock, Wallpaper (animated stars/aurora), Icon
src/panels/                Window bodies; index.tsx maps PanelId -> component
src/Video.tsx              The "Videos" panel (click-to-load player, live refresh, bundled fallback)
src/styles/                One CSS file per component + tokens.css (see docs/design-tokens.md)
```

## Data flow

`App` holds `useReducer(windowReducer)`. Components receive plain props and callbacks; they never read the reducer directly. Geometry is derived on every render from `state.windows[id].bounds ?? defaultBounds(id, area)` and passed through `fit()`, so windows are always re-clamped after a viewport change without losing the user's chosen position.

Two layouts share the same DOM:

- **Desktop** (`min-width: 761px`): windows are absolutely positioned from CSS variables `--window-x/y/width/height`.
- **Mobile** (`max-width: 760px`): windows become stacked cards; dragging, resizing and maximize are disabled and the dock is fixed to the bottom.

## Rules of thumb

- Put logic in pure modules (`geometry`, `windowReducer`, `clockFormat`, `api/_lib`) and test it. Components stay thin.
- Anything a panel needs to know about its window arrives through `PanelProps` (`src/panels/index.tsx`), not by importing window state.
- Never add a CSS transition on `left/top/width/height` globally: it makes drag and resize laggy.

## Motion

Windows animate open, close (kept mounted in an `exiting` snapshot in `App` until the exit ends), minimize (genie toward the dock icon) and maximize/restore (a short-lived scoped geometry transition). Every phase has a timeout fallback, and with `prefers-reduced-motion: reduce` phases finish immediately. See `docs/design-tokens.md` for the motion rules.
