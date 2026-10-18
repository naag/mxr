# Bass Synth Explorer

Educational SPA around the MXR Bass Synth (MB301) pedal. Read these before changing
behavior:

- `docs/PLAN.md`: architecture, testing strategy, roadmap (phases with checkboxes), decisions
- `docs/pedal-reference.md`: what the real pedal does and how we model it. Mark anything
  not in the manual as **ASSUMPTION**
- `docs/learning-content.md`: user-facing copy and Learn chapters
- `docs/mockup/`: approved look-and-feel mockup (reference for geometry, colors, copy)

## Stack

Svelte 5 (runes) + TypeScript, plain Vite SPA (no SvelteKit), Tailwind CSS v4 (tokens in
`src/app.css` `@theme`), Vitest (node + browser mode), Playwright, ESLint + Prettier.
Dark theme only, English only, no live audio input.

## Commands

- `npm run dev`: dev server
- `npm run lint`, `npm run check`, `npm test`, `npm run test:e2e`, `npm run test:all`
- In the Claude Code cloud container, Playwright browsers are preinstalled at an older
  version. Prefix browser tests with `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium` instead
  of running `playwright install`.

## Conventions

- Routing is hash-based (`#/learn/5`); `src/lib/router.ts` is pure and unit-tested.
- User-facing strings live in `src/lib/content/`, not in components.
- Unit tests sit next to the code (`foo.test.ts`); component tests use `*.svelte.test.ts`
  and run in browser mode; E2E specs live in `tests/e2e/`. Tag cross-browser smoke tests
  with `@smoke`.
- Prefer role-based locators in tests. Every view must pass the axe scan (no serious or
  critical violations).
- Prettier style: no semicolons, single quotes, 100 columns. `docs/` is excluded from
  Prettier.
- Use theme tokens (`bg-surface`, `text-muted`, `stroke-stage-filter`) rather than raw hex.
- Tick the matching checkbox in `docs/PLAN.md` §8 when a roadmap item is done.
- Pedal geometry lives in `src/lib/pedal/layout.ts` (SVG units from the mockup); knob math
  (angles, clock labels) in `src/lib/pedal/knob.ts`. Pedal controls are SVG elements with
  ARIA roles (`slider`, `button`), so tests can find them by role and name.
- Screenshot tests are tagged `@visual` and only run via `npm run test:visual`.
- Pedal behavior lives in the pure reducer `src/lib/pedal/machine.ts` (`reduce(state, event,
now)`); parameters and their mappings in `params.ts`; factory presets in `presets.ts`. The
  Svelte store `pedal.svelte.ts` only wraps them. Change behavior in the machine and test it
  there first.
- The sound engine is pure TypeScript in `src/lib/audio/dsp/` (no Web Audio types), so the
  worklet, offline renders and unit tests share it. `renderOffline()` in `src/lib/audio/render.ts`
  returns every tap (dry, osc, filter, amp, fx, cutoffHz, pitch). DSP tests assert on
  measurements (pitch, harmonics, spectral centroid, RMS) from `dsp/analysis.ts`, with the
  tolerance stated in the test.
- The `pedal` and `audio` stores are app-wide singletons in `src/lib/state.svelte.ts`;
  `App.svelte` syncs pedal settings into the audio engine. The AudioWorklet only talks to the
  main thread through the messages in `src/lib/audio/protocol.ts`.
- Visuals live in `src/lib/viz/`: pure analysis and drawing (`analysis.ts`, `draw/*.ts`), the
  offline "computed" snapshot (`computed.ts`, rendered in a worker), and control ↔ visual links
  (`links.ts`). Components draw live from the analysers via the shared `scheduler()` and fall
  back to the snapshot when the sound is off. A new parameter needs a `PARAM_LINKS` entry, and
  `computed.test.ts` checks that it visibly changes a linked visual.
- E2E audio checks use `window.__MXR_TEST__` (test builds only, see `src/lib/test-hooks.ts`):
  analyser levels per tap, telemetry, and deterministic offline renders.
