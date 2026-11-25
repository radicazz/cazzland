# Terminal

The Terminal panel (`id: "terminal"`, title `cazz@cazzland: ~`) is the site's main window. On mount it plays a short login and `fastfetch` boot, then gives the visitor an interactive prompt.

## Files

```
src/desktop/terminal/content.ts    DATA: every fact, link, blurb, logo row and fastfetch line. Edit this first.
src/desktop/terminal/types.ts      Span / Block / Step / Effect types
src/desktop/terminal/commands.ts   PURE: run(input, ctx) -> { blocks, effects }, complete(), history helpers, bootSteps()
src/desktop/terminal/session.ts    PURE: log + animation queue reducer (boot, emerge)
src/desktop/terminal/commands.test.ts   vitest for all of the above
src/panels/Terminal.tsx            React: timers, key handling, performs effects
src/panels/terminal/Output.tsx     Renders blocks (spans, links, fastfetch grid)
src/panels/terminal/PromptInput.tsx  Real <input> over a mirror that draws the block cursor
src/styles/terminal.css            Look, colours (`t-<tone>` classes), mobile and reduced-motion rules
```

## How it works

- `run()` never touches the DOM. Whatever it needs from the browser (time, uptime, viewport, locale, time zone, cores, memory) arrives in `ctx.sys`, which `Terminal.tsx` reads fresh for each command.
- Output is data. A `Block` is a `line` made of `Span`s (`{ text, tone?, href? }`) or a `fetch` (logo column plus info column). A span with `href` renders as a real `<a target="_blank" rel="noreferrer">`. Nothing uses `dangerouslySetInnerHTML`.
- Side effects are returned as values and performed by the component: `open` (`openApp(id)`), `close` (`closeSelf()`), `clear`, `openUrl` (`window.open(url, "_blank", "noopener,noreferrer")`, run inside the key handler so popup blockers allow it) and `animate` (a list of `Step`s).
- The boot sequence and `emerge` are `Step` queues in `session.ts`. The component runs a single `setTimeout` per step, and cleanup clears it. That means a StrictMode double mount can't print twice, and nothing advances while the window is minimized.
- Apps come from `PANEL_IDS`/`PANELS` (`src/desktop/panels.ts`). A new panel is launchable as `<id>` or `open <id>` with no terminal changes. A built-in command with the same name wins, so avoid ids like `links` or `help`.

## Adding a command

1. Add an entry to `COMMANDS` in `commands.ts`:
   ```ts
   merch: { help: "where to buy stuff", run: (args, ctx, rest) => ok(line(t("soon", "mint"))) },
   ```
   Commands with `help` show up in `help` and in Tab completion. Leave `help` out for a hidden easter egg. Use `usage` when the help column should show arguments.
2. Put any text about Cazz in `content.ts`, not in the command.
3. Return effects rather than calling browser APIs. If the command animates, return `{ type: "animate", steps }` and keep each delay short.
4. Add a test in `commands.test.ts`, then run `pnpm test && pnpm run build`.

## Content rules

Facts about Cazz come only from what the site already says: name, handle, topics, the links in `LINKS` and the featured video. `FEATURED_VIDEO` copies the bundled upload in `src/Video.tsx`, so update both together. Playful system lines are fine when they are obviously a joke (`Shell: zsh (cazzsh)`, `Terminal: cazzterm`) or computed live: resolution, locale and time zone, uptime since page load, and `Hardware` only when `navigator.hardwareConcurrency` / `navigator.deviceMemory` exist (otherwise the line is omitted). `APP_LINKS` lists the links printed after opening an app by name (`socials` opens the window and prints YouTube/GitHub/X). Don't invent hardware or personal facts.

## Interaction

- The prompt is a real single-line `<input>` labelled "Terminal command input". Clicking anywhere in the terminal focuses it, unless the click was on a link or the user is selecting text. It autofocuses on mount only with `(pointer: fine)`, so touch devices don't get a surprise keyboard.
- Enter runs the line, and an empty line just reprints the prompt. ↑/↓ walk history. Tab completes commands, apps, links, `cat`/`ls` targets and `emerge --sync`. Tab is only captured when there is something to complete, so keyboard users can still tab out. Ctrl+C cancels a running animation, or abandons the current line with `^C`, unless text is selected (then it copies). Ctrl+L clears.
- Any key press or pointer press during the boot skips to the finished state.

## Accessibility and motion

- The log is `role="log"`. It has `aria-live="off"` during the boot and `"polite"` afterwards, so only whole lines of command output are announced, never characters.
- The line being typed, the ASCII logo and `decorative` spans (the separator and colour swatches) are `aria-hidden`. Links stay in the accessible tree with a visible focus ring.
- The cursor is the focus indicator: solid and blinking when the input is focused, hollow when it isn't.
- The boot is sized to fit a ~460px-tall terminal body at 1440×900 without scrolling. Adding fastfetch lines pushes the logo off the top on first load, so trim something when you add one.
- With `prefers-reduced-motion: reduce`, the finished boot renders on the first paint. `emerge` prints instantly, and the cursor blink and row reveal are off.
- Animations use only `opacity`/`transform` (the fastfetch row reveal) and `steps()` (the cursor blink). Scanlines and glow are static.
- All text tones are at least 4.5:1 on `#0f0a14`. The colour swatches are decorative.
- On mobile (≤ 760px), the terminal sets its own height (`min(64svh, 540px)`) because windows are auto-height cards there. The fastfetch logo stacks above the info when the terminal is narrower than 540px.

## Commands

`help`, `fastfetch`/`neofetch`, `cat about.txt`, `ls [dir]`, `apps`, `open <app|link>`, `links`, `whoami`, `id`, `hostname`, `uname [-a]`, `pwd`, `cd`, `date`, `uptime`, `echo`, `history`, `clear`, `exit`/`logout`, every app id (`videos`, `community`, `socials`, `support`, `terminal`) and every link id (`youtube`, `github`, `x`/`twitter`, `discord`, `patreon`).

## Easter eggs

- `sudo <anything>`: not in the sudoers file. This incident will be reported.
- `rm -rf /` (and friends): a polite refusal. Any other `rm` hits a read-only file system.
- `cowsay <text>`
- `emerge --sync` and `emerge <pkg>`: a short fake Portage sync or compile. It can be cancelled with Ctrl+C, and the package name is sanitised.
- `vim`, `nano`, `emacs`
