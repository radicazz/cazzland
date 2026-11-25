# Cazzland

Cazzland is a personal website built with React, TypeScript, and Vite. Use npm and keep `package-lock.json` in sync with dependency changes. Vercel serves the frontend and the latest-video endpoint.

## Agent roles

- The orchestrator clarifies the outcome, plans the work, and owns integration and final verification. Delegate independent work when the session supports it. Give each subagent the goal, owned files, interfaces, expected deliverables, and required checks. Coordinate shared files centrally or use separate worktrees for changes that need isolation.
- Implementation subagents own bounded changes and the checks for their area. Preserve other contributors’ changes and flag any interface or scope change to the orchestrator before editing outside the assignment.
- Advisors evaluate design choices, diagnose blockers, or validate assumptions. Give them a specific question and relevant evidence. Advisors return options, tradeoffs, and a recommendation with references. Implementation stays with the assigned owner.
- Reviewers independently check integrated changes against the request and existing behavior. Report actionable findings ordered by impact, with file references, affected behavior, and evidence. State which checks ran and what remains unverified. The orchestrator validates findings, assigns or makes fixes, and rechecks affected paths.

When model selection is available, use higher-capability models for orchestration, design advice, planning, and review. Use lower-cost capable models for bounded implementation. In a single-agent session, carry out the same planning, implementation, and review steps directly.

## Handoffs

Report changed files, interface changes, commands and outcomes, and any remaining work. Keep blockers specific enough for the next agent to reproduce. Update the README when commands or deployment behavior change. Keep shared agent instructions here and have `CLAUDE.md` import this file.

## Verification

1. Install dependencies with `npm ci`. Use `npm run dev` while developing. Run `npm run build` before handing off changes. It runs the TypeScript check and builds production files in `dist/`. Use `npm run preview` to inspect that output in a browser.
2. For desktop changes, check the initial layout at desktop and phone widths. Exercise dock buttons, stacking, drag, minimize, maximize, restore, and close where applicable. Confirm the relevant controls are reachable by keyboard, focus is visible, and the mobile layout and dock remain usable.
3. For video changes, check the featured thumbnail, click-to-load player, and YouTube links. Exercise a successful refresh and an unavailable feed to verify the bundled fallback. When changing `api/latest-video.js`, run `node --check api/latest-video.js` and exercise valid and malformed feeds, upstream failures, and unsupported methods against the handler.
4. For deployment changes, review the Vercel build settings and check both the home page and `/api/latest-video` on a Vercel preview when available. Report local build results, browser results, and deployed results with their actual environments.

## Commits

Use Conventional Commits with a short, lowercase subject, such as `feat: add desktop windows` or `fix: retain window focus`. Keep each commit focused on a single change.
