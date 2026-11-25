# Cazzland

Cazzland is Cazz’s personal website, presented as an interactive desktop: an animated wallpaper, a menu bar with a live clock, a dock, desktop shortcuts, and real windows you can drag, resize, minimize, maximize and close. It shows Cazz’s profile, links, and latest video. Built with React, TypeScript and Vite.

## Development

Use Node.js 22.12 or later and [pnpm](https://pnpm.io) (`corepack enable` picks up the pinned version).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

| Command | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server |
| `pnpm test` | Unit tests (window manager, geometry, clock, feed parser, API handler) |
| `pnpm run typecheck` | TypeScript check only |
| `pnpm run build` | Typecheck + production build into `dist/` |
| `pnpm run preview` | Serve `dist/` locally |

The Vite dev and preview servers show the bundled featured upload. The deployed site refreshes it through `/api/latest-video`, a Vercel Function that reads Cazz’s public YouTube feed; the bundled video stays if the feed is unavailable.

## Working on it (humans and agents)

Start with [AGENTS.md](AGENTS.md), which links to the docs in [docs/](docs/): architecture, window manager, adding a panel, design tokens, API, and testing/QA.

## Vercel

Import the repository with the repository root as the project root. [vercel.json](vercel.json) selects the Vite preset, installs with `pnpm install --frozen-lockfile`, builds with `pnpm run build`, publishes `dist/`, and sets security headers (including a Content-Security-Policy). The video endpoint needs no environment variables or API key. [Vercel’s Vite documentation](https://vercel.com/docs/frameworks/frontend/vite)

Before the first production deploy, check a preview: the home page loads with a clean console, `/api/latest-video` returns JSON, and set an absolute `og:image` URL in `index.html` once the domain is known.

## License

The source code is licensed under the [MIT License](LICENSE).
