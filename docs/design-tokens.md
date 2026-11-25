# Design tokens and style rules

The look is a dark purple "night desktop" with pink and violet glow. Do not change that identity; extend it.

## Color

Defined in `src/styles/tokens.css`.

| Token | Value | Use |
| --- | --- | --- |
| `--accent` | `#ff9fc3` | Links, focus rings, active indicators |
| `--surface` | `#1b1621` | Window background |
| `--chrome` | `#18111ce8` | Menu bar and dock |
| `--line` | `#ffffff25` | Borders |
| `--muted` | `#cec2cf` | Secondary text (10:1 on surface) |
| `[data-app]` → `--app-color` / `--app-tint` | per panel | Tile gradient, title icon, active title bar |

Glow colors for the wallpaper: pink `#f3599f`, violet `#9865fc`.

## Rules

- One CSS file per component in `src/styles/`; shared tokens, reset and utilities only in `tokens.css`.
- Class prefix `desk-` for desktop UI. Mobile rules live in a `@media (max-width: 760px)` block at the bottom of the file they affect. Desktop/mobile breakpoint is **761px** (mirrored in `useWorkspace.ts`).
- Every control needs a visible `:focus-visible` outline (global rule uses `--accent`). Hit targets ≥ 36px (44px on mobile).
- Text contrast ≥ 4.5:1. Use `.sr-only` for screen-reader-only text.

## Motion

- Animate `transform` and `opacity` only. Never animate `filter`, `box-shadow`, or `background-position` on large layers. Never transition window `left/top/width/height` except in the short-lived maximize/restore state.
- Durations: micro-interactions 150–180ms, window enter/exit ≤ 200ms, ambient wallpaper loops 20s+.
- There is no pause button. `@media (prefers-reduced-motion: reduce)` must switch **all** motion off, and any exit animation must complete immediately in that mode (never wait for an `animationend` that will not fire).
