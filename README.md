# Cazzland

Cazzland is Cazz’s personal website, presented as an interactive desktop. The desktop brings together Cazz’s profile, links, and latest video.

## Development

Use Node.js 22.12 or later and npm.

```sh
npm ci
npm run dev
```

`npm run typecheck` checks the TypeScript source. `npm run build` checks types and builds the production site into `dist/`. After building, run `npm run preview` to serve the production output locally.

The Vite dev and preview servers show the bundled featured upload. The deployed site can refresh it through `/api/latest-video`, a Vercel Function that reads Cazz’s public YouTube feed. The bundled video remains available if the feed is unavailable.

## Vercel

Import the repository into Vercel with the repository root as the project root. [vercel.json](vercel.json) selects the Vite framework preset, installs with `npm ci`, and publishes `dist/` after running `npm run build`. Vercel also deploys the video endpoint, which requires no environment variables or YouTube API key. [Vercel’s Vite documentation](https://vercel.com/docs/frameworks/frontend/vite)

## License

The source code is licensed under the [MIT License](LICENSE).
