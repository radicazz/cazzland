# Window manager

State lives in `src/desktop/windowReducer.ts` (pure, tested in `windowReducer.test.ts`).

```ts
type WindowsState = { order: PanelId[]; windows: Partial<Record<PanelId, WindowState>> };
type WindowState = { minimized: boolean; maximized: boolean; bounds?: Bounds };
```

A window is **open** iff it has an entry in `windows` and an id in `order`.

## Actions

| Action | Effect |
| --- | --- |
| `show` | Open if closed; un-minimize; move to top. Keeps `maximized`/`bounds` of a minimized window. |
| `raise` | Move an **open** window to the top. Never opens a closed one. |
| `minimize` | Hide, keep `bounds` and `maximized`. |
| `close` | Delete the entry: bounds and maximized state are forgotten, so reopening uses defaults. |
| `toggleMaximize` | Flip `maximized` and raise. |
| `setBounds` | Store the (already `fit`-clamped) bounds from a drag/resize. |

## Invariants (tests enforce these; keep them true)

1. `order` is the stacking order, bottom to top. `zIndex = 1 + index`.
2. `order` contains exactly the open windows, no duplicates.
3. The **active** window is the topmost non-minimized one (`activeWindow`).
4. Closing is the "reset": there is intentionally no global reset button.
5. Maximized windows cannot be dragged or resized; the resize grip is not rendered.
6. Bounds are never trusted at render time: always `fit(bounds ?? defaults, area, panel.min)`.

## Interaction contract

- Dock click: if the window is active (desktop only) it minimizes, otherwise it `show`s and moves focus into the window. After minimize/close, focus returns to the dock button.
- Titlebar drag moves; double-click toggles maximize; the title has `role="button"` and moves with arrow keys (Shift = 48px, else 16px). The resize grip is a button resized with arrow keys.
- Minimizing the Videos window stops playback (`PanelProps.minimized`).
- A click inside the video iframe never reaches React; `App` listens for window `blur` and raises the window containing the focused iframe.
- Focus lost to `<body>` when a window maximizes is moved to its Maximize/Restore button.

## Changing it

Add an action to the reducer **and a test first**, then wire it in `App.tsx`. Do not add parallel state in components.
