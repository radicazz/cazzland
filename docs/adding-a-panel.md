# Adding a panel (window)

Example: a "Merch" panel.

1. **Id and metadata** – `src/desktop/panels.ts`: add `"merch"` to `PanelId`, `PANEL_IDS` (this is the dock/shortcut order) and `PANELS` (`label`, optional `title`, optional `min` size so content never clips). Add a `defaultBounds` branch only if the cascade default is wrong.
2. **Icon** – `src/components/Icon.tsx`: add a lucide icon under the same key as the id.
3. **Colors** – `src/styles/tokens.css`: add `[data-app="merch"] { --app-color: …; --app-tint: …; }`.
4. **Content** – create `src/panels/Merch.tsx` and register it in the `content` map in `src/panels/index.tsx`. It receives `PanelProps`:
   - `minimized` – stop background work (timers, playback) while true.
   - `openApp(id)` – open, raise and focus another panel.
   - `closeSelf()` – close this panel's own window.

   Reuse `LinkRow` and the `desk-list` / `desk-link` classes from `src/styles/panels.css`; put new styles in a new `src/styles/<name>.css` imported by `App.tsx` (or by the panel component itself, as `Terminal.tsx` does).
5. **Open by default?** Add it to `initialWindows` (desktop) and/or `mobileWindows` (phone) in `windowReducer.ts` (and update the reducer test). `App` picks one at first render from the breakpoint and never switches on resize.
6. **Terminal** – nothing to do: the terminal reads `PANEL_IDS`/`PANELS`, so `merch` and `open merch` launch the panel, and `apps`, `ls apps` and Tab completion list it (see `docs/terminal.md`).
7. **Check** – `pnpm run build && pnpm test`, then run the desktop QA checklist in `docs/testing.md`. TypeScript will flag any `Record<PanelId, …>` you forgot to extend.

External links must use `target="_blank" rel="noreferrer"`. Icons are decorative: `Icon` sets `aria-hidden`, so every icon button needs a text label or `aria-label`.
