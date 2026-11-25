# Testing and QA

## Automated

```sh
pnpm test            # vitest (tests inside api/ must live in api/_lib/): geometry, window reducer, clock format, feed parser, API handler
pnpm run build       # tsc --noEmit + vite build
node --check api/latest-video.js
```

Pure modules are where the logic lives, so that is where tests go. Add a reducer test before changing window behavior.

## Manual QA (run `pnpm run build && pnpm run preview`)

Desktop (1440×900 and 1024×700) and phone (390×844):

- [ ] First load: About and Videos open, nothing clipped (also at 800 and 880px wide).
- [ ] Default layout: Terminal left, Videos right, side by side, clear of the shortcuts column (>900px); at 800px wide Terminal overlaps Videos; no "Watch on YouTube" clipping.
- [ ] Tabs (desktop): one per open window; click activates, click on active minimizes, minimized tab is dimmed, x closes; labels collapse to icons at <=1000px; no bar overflow at 761px; focus ring visible.
- [ ] Launcher menu: the "Desktop" brand opens every app (also while a window is maximized and at 800px); Escape returns focus to the brand; outside click closes.
- [ ] Genie: minimize flies to the window's tab (not the top-left corner); reduced motion has no animation.
- [ ] Focus: after minimize focus is on the tab; after close on a neighbouring tab or the brand; never `<body>`.
- [ ] Phone: dock click opens/focuses; dock is hidden on desktop.
- [ ] Windows: drag, resize (including to the minimum), minimize, maximize, restore, close, reopen (defaults restored).
- [ ] Keyboard only: Tab reaches every control with a visible focus ring; arrow keys move/resize; Shift = larger steps.
- [ ] Maximize Videos at 1024×700: no scrolling inside the window.
- [ ] Play the video, click About, then click inside the video: Videos comes to the front. Minimize Videos: audio stops.
- [ ] Clock shows local date/time, updates on the minute; phone shows the short form.
- [ ] Reduced motion (OS setting or DevTools emulation): wallpaper still, no window animation, nothing stuck.
- [ ] Video: thumbnail, click-to-load, YouTube link; block `/api/latest-video` and confirm the bundled video remains.
- [ ] Phone: dock fixed, cards stack, controls ≥ 44px.

## Deploy checks

Preview deploy: home page loads with no CSP errors in the console (the policy is in `vercel.json`), `/api/latest-video` returns 200 JSON, the OG image resolves. Report results with their environment (local build, local browser, Vercel preview).
