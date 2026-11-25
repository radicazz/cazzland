# `/api/latest-video`

Vercel Function (`api/latest-video.js`). Reads the public YouTube Atom feed for channel `UC9iIZaEy1r_q6CRAiXBqXOA` and returns the newest upload. No API key or environment variables.

| Case | Status | Body | Caching |
| --- | --- | --- | --- |
| Success | 200 | `{ id, title, published }` | browser 5 min; CDN 1 h + 24 h stale-while-revalidate |
| `POST`/other | 405 | empty, `Allow: GET, HEAD` | – |
| Upstream error, timeout (5 s), malformed feed | 502 | `{ error }` | browser `no-store`; CDN 60 s |

Parsing lives in `api/_lib/feed.js` (`latestFromFeed`): tolerates attributes on `<entry>`, CDATA titles and XML entities; returns `null` for anything malformed. Tests: `api/_lib/latest-video.test.js` (kept under `_lib` so Vercel does not deploy it as a function).

## Client fallback

`src/Video.tsx` ships a bundled `featured` upload and `public/latest-video.jpg` thumbnail. It only replaces it when the API returns a valid 11-char id, a non-empty title, and a `published` date **not older** than the bundled one. Any failure silently keeps the bundled video.

**When the channel posts something new**, optionally refresh the bundle: update `featured` in `src/Video.tsx` and replace `public/latest-video.jpg` (1280×720). This is only a cold-start/offline fallback, so it is not urgent.
