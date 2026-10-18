# MXR Bass Synth Explorer: Product & Implementation Plan

> Status: **reviewed, decisions recorded in §11** · Created 2026-10-18 · Owner: @naag
>
> Visual mockup (private Claude artifact; interactive pedal, Play desktop and mobile,
> Under the hood, Learn chapter 5, design language):
> <https://claude.ai/artifact/VLFJfYPHoXTgFQucm1bFJD>
>
> Companion documents:
> - [`pedal-reference.md`](./pedal-reference.md): what the real pedal does (from the official
>   manual) and how we model each control. Read this first.
> - [`learning-content.md`](./learning-content.md): plain-language copy, Learn-mode chapters,
>   glossary and riffs.

---

## 1. Vision

A single-page web app that puts a **faithful, playable replica of the MXR Bass Synth
(MB301)** on screen and uses it to teach **how a synthesizer makes sound**, aimed at
people who aren't synth experts.

The user turns a knob on the pedal and **immediately hears and sees** what it does: the
waveform changes shape, harmonics vanish from the spectrum as the filter closes, the
envelope draws its curve, and the signal-flow diagram lights up the stage that knob
controls.

### Goals
1. **Understand the pedal:** every knob, button, LED, secondary parameter, preset and
   footswitch behavior from the manual, explorable without the manual.
2. **Understand synthesis:** oscillators, harmonics, filters, resonance, envelopes,
   modulation, dynamics, taught through hearing, seeing and doing.
3. **Look professional:** a studio-grade dark UI with a realistic pedal drawing, smooth
   motion, and responsive design from phone to wide desktop.
4. **Be trustworthy:** clear about what's documented vs. modeled, accessible, safe
   volume, automated tests from day one.

### Non-goals (v1)
- A bit-exact clone of the pedal's DSP. We don't have its firmware. We build an
  *educational model* that behaves like the manual describes.
- A DAW plugin, MIDI controller support, or a user account / cloud save.
- Polyphony. The real pedal is monophonic, and so are we.
- Plugging in a real instrument (decided: no live input). TRACKING and GATE SENS are
  explained and simulated, not measured.
- A light theme or translations (decided: dark only, English only).

### Target audience
- **Primary:** bassists who own or consider the pedal and want to understand the knobs.
- **Secondary:** curious musicians and beginners who want an intuitive intro to
  subtractive synthesis.
- Assumed knowledge: knows what a bass and a pedal are. **No** synth terms assumed.

---

## 2. Experience overview

### 2.1 Core principle: three linked layers
Every interaction ties together:

```
   CONTROL (pedal)  ◄──────►  STRUCTURE (signal flow)  ◄──────►  RESULT (sound + visuals)
   "what I touch"             "where in the chain"               "what I hear / see"
```

Hovering or focusing a knob highlights its stage in the signal-flow diagram and its
visual (e.g. CUTOFF → filter block glows teal → the filter curve on the spectrum
brightens). This **linked highlighting** is the main teaching device and is
consistent everywhere in the app.

### 2.2 Views (hash-routed SPA)

| Route | View | Purpose |
|---|---|---|
| `#/` | **Play** (home) | Pedal + live visuals + sound source. Free exploration. |
| `#/flow` | **Under the hood** | Full signal-flow diagram with a mini scope at every stage. |
| `#/learn/:chapter` | **Learn** | Guided chapters (see `learning-content.md`). |
| `#/presets` | **Presets** | Gallery of the 8 presets as "recipe cards". |
| `#/reference` | **Reference** | Manual-style reference: controls, secondary layer, glossary. |

The pedal and the sound-source bar stay mounted across views, so audio never stops
on navigation. On wide screens the pedal is always visible. On mobile it collapses to a
"mini pedal" bar that expands on tap.

### 2.3 Layout: desktop (≥ 1280 px)

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ ◼ Bass Synth Explorer   Play · Under the hood · Learn · Presets · Reference   🔊 ▮▮▯ │
├──────────────────────────────┬─────────────────────────────────────────────────────┤
│                              │  ┌───────────────────────────────────────────────┐  │
│                              │  │  OSCILLOSCOPE (triggered, stage selectable)   │  │
│      ┌──────────────┐        │  └───────────────────────────────────────────────┘  │
│      │              │        │  ┌───────────────────────────────────────────────┐  │
│      │   PEDAL      │        │  │  SPECTRUM + filter curve overlay              │  │
│      │   (SVG)      │        │  └───────────────────────────────────────────────┘  │
│      │              │        │  ┌──────────────────────┐ ┌──────────────────────┐  │
│      │              │        │  │ ENVELOPE (time)      │ │ PITCH / GLIDE        │  │
│      └──────────────┘        │  └──────────────────────┘ └──────────────────────┘  │
│   [Hold VOICE] [Hold SHAPE]  │  ┌───────────────────────────────────────────────┐  │
│   Expression ▮▮▮▯▯           │  │ CONTROL CARD: "CUTOFF: how bright the synth…" │  │
│                              │  └───────────────────────────────────────────────┘  │
├──────────────────────────────┴─────────────────────────────────────────────────────┤
│ SOURCE: (Riff ▾ Funk Drop) ▶ ■  ♩=96  │  Fretboard ▸ E|A|D|G frets 0–12  │ Keys Z X C │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Layout: tablet & mobile
- **Tablet (768–1279):** pedal left (≈ 40%), visuals stacked right. The control card
  becomes a bottom sheet.
- **Mobile (< 768):** pedal on top at full width (knobs ≥ 44 px touch targets), visuals
  in a swipeable tab strip below (Scope · Spectrum · Envelope · Pitch), and a sticky
  source bar at the bottom. VOICE/SHAPE "hold" works with a second finger, and there's
  also a **layer toggle** (Main · Voice · Shape) because press-and-turn is awkward on touch.

### 2.5 Sound sources

A real pedal needs a bass plugged in. The app has no live input (decided), so it
offers three built-in sources:

1. **Riff player:** original looping riffs (see `learning-content.md` §D) with
   tempo control. This is the default, so people hear something with one click.
2. **Virtual fretboard:** a 4-string, 12-fret fretboard you can click or tap, with
   string-plucked visuals.
3. **Computer keyboard:** `Z X C V…` / `A S D F…` rows mapped to frets. Shown
   as a hint overlay.

In all three, the "bass" is synthesized (Karplus–Strong plucked string). It provides
the **dry signal** (so MIX, DRY THRU FX and bypass A/B are real), and it sends exact
note events to the synth voice. That way we skip pitch detection, which is honest
because chapter 0 explains what the real pedal has to do instead. TRACKING and GATE
SENS are still on the pedal and explained, and they're simulated in a simple way:
GATE SENS decides whether soft (ghost) notes from the riff trigger the synth, and
TRACKING adds the tracking delay a real detector needs for low notes.

### 2.6 Audio UX & safety
- Audio starts only after a user gesture: a prominent **"Start sound"** button. Its first
  click also starts the default riff at low volume.
- Master volume and a **safety limiter** sit at the end of the chain (−1 dBFS ceiling).
  High resonance can't produce painful peaks.
- Output meter in the header and a mute shortcut (`M`).
- If audio is off, visuals still work: they're rendered offline from the same DSP
  (see §5.5), so the app is useful in a silent office.

### 2.7 Pedal interaction details
- **Knobs:** drag vertically (Shift = fine), mouse wheel, arrow keys (PgUp/PgDn = big
  steps, Home/End = min/max), double-click / double-tap = reset to the preset value.
  The value shows as a clock position, 0–10, and in physical units ("2 o'clock · 6.8 ·
  1.9 kHz").
- **Secondary layer:** while VOICE (or SHAPE) is held, either by pointer, by
  keyboard (`V` / `S` held), or with the layer toggle, the knob legends **morph** to
  their secondary names (VOICE MIX, NOISE MIX…) and the knob pointers jump to the
  secondary values. A subtle colored halo shows which layer is active. Short tap of
  VOICE/SHAPE = normal button behavior, hold + turn = secondary, matching the hardware.
- **3-way and 2-way secondary params** (TRACKING, OUTPUT MODE, DRY THRU FX) snap to
  detents and show their position legends.
- **Footswitch:** tap = bypass toggle (LED off/on). Hold ≥ 600 ms = preset-scroll
  mode (LED soft-flashes, SHAPE LED shows the preset). Freeze mode is configured exactly
  as in the manual (hold footswitch + RESONANCE to max).
- **PRESETS button:** tap = next preset, hold 2 s = copy/save flow. Preset LEDs show
  green/red bank, off = live, soft flash = modified.
- **Preset changes animate** the knobs to their new positions (spring motion, about 400 ms),
  so users see which controls a preset uses.
- **Expression pedal:** an optional virtual expression pedal (vertical rocker) appears when
  the CTR switch is set to TAP/EXP, with heel/toe editing (see reference §7).
- **Share:** the current patch is encoded into the URL (`#/?p=<base64>`), with a "Copy
  link to this sound" button. Live mode persists to `localStorage` (like the real
  pedal's live mode). Storage access is wrapped in try/catch.

---

## 3. Visualizations

All visuals share one color language (§4.2) and a "Simple ⇄ Detailed" toggle.
**Simple** hides grids and units and shows friendly labels. **Detailed** shows Hz, dB and note
names. Each visual has a live, screen-reader-friendly **text readout** (e.g.
"Fundamental E1 41 Hz · brightness ~1.2 kHz · filter peak at 900 Hz"). This is
both a learning aid and a stable hook for tests.

| Visual | What it shows | Key details |
|---|---|---|
| **Oscilloscope** | Waveform over time at a selected tap point (osc · filter · amp · out). | **Pitch-synchronous trigger** (rising zero-crossing near the known period), so the wave stands still instead of scrolling. Optional "layers" mode draws main/sub/voices separately plus the sum. Shows 2–3 cycles and auto-scales time with pitch. |
| **Spectrum** | Harmonics (bars at 1×, 2×, 3×… with note labels) or a continuous FFT. | Log-frequency axis 20 Hz–12 kHz. **Analytic filter response curve** (from the 4-pole ladder transfer function) overlaid and animated with envelope/LFO. Harmonics above the curve dim out. |
| **Envelope graph** | Cutoff (filter env) and volume (amp env) over the last ~2 s. | Static shape preview (computed) + live playhead on each note. Bipolar shading for negative env amount. |
| **Pitch graph** | Pitch over time, piano-roll style with note-name gridlines. | Shows glide ramps vs. steps, and the frozen note when freeze is active. |
| **LFO / chorus widget** | A dot moving on a sine and the parameter it moves. | Only visible when MOD > 0. |
| **Signal-flow diagram** | Blocks ⓐ–ⓖ from reference §9, with animated "signal particles" on active paths. | Inactive stages are greyed out (e.g. NOISE at 0, ENV off). Clicking a block focuses its tap point in the scope. Mini scopes in Under-the-hood view. |
| **Spectrogram** (detailed mode) | Frequency over time as a heat map. | Great for seeing filter sweeps. Canvas 2D with scrolling ImageData. |
| **Level & GR meter** | Output level, compressor gain reduction, stereo L/R. | |
| **Additive demo** (Learn ch. 2) | Building a saw/square from sine harmonics, step by step. | Pure computed animation, no audio graph needed. |

Rendering approach:
- **Canvas 2D** for anything that animates per frame (scope, spectrum, spectrogram,
  meters), scaled for `devicePixelRatio`. **SVG** for the pedal, diagrams and static
  graphs (crisp, styleable, accessible).
- One shared `requestAnimationFrame` scheduler drives all visuals. Off-screen visuals
  (via `IntersectionObserver`) and hidden tabs pause.
- Drawing code is **pure functions** (`drawScope(ctx, samples, opts)`) separated from
  Svelte components, so it can be unit-tested and snapshot-tested.

---

## 4. Visual design system

### 4.1 Mood
"Studio at night." A deep neutral background, the pedal lit like a product shot
(soft key light from the top left, subtle floor shadow), and visuals glowing like
hardware displays. Refined, not "gamer neon". Lots of negative space, precise
alignment, and restrained motion.

### 4.2 Color tokens (Tailwind v4 `@theme`)

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#0D1014` | page background |
| `--color-surface` / `-raised` | `#11161C` / `#151A20` | panels / buttons, inputs |
| `--color-line` | `#1E252D` | hairlines, grids |
| `--color-text` / `-muted` | `#E8EAED` / `#A3ADB7` | text |
| `--color-pedal-body` | `#3C3F44` | enclosure (from product photo) |
| `--color-knob-orange` | `#F26A10` | MIX, SUB MIX |
| `--color-knob-teal` | `#5BB5BE` | CUTOFF, RES, ENVELOPE, MOD |
| `--color-silk` | `#E6E4DF` | pedal screen print |
| **Stage colors** (diagrams, scopes, halos) | | |
| `--color-stage-osc` | amber `#F2A93B` | oscillators, sub, voice, noise, glide |
| `--color-stage-filter` | teal `#43C6CF` | cutoff, resonance |
| `--color-stage-env` | violet `#A68BF5` | filter env, amp env |
| `--color-stage-mod` | pink `#EE7BB8` | LFO, chorus |
| `--color-stage-dyn` | lime `#A6D96A` | comp, gate, mix, output |
| `--color-stage-input` | slate `#8C99A8` | your bass, tracking, dry path |
| Layer legends | blue `#8FD3FF` / green `#8BE59A` | knob labels while VOICE / SHAPE is held (matches the manual's diagram) |

Stage colors are checked for ≥ 3:1 contrast against surfaces. Color is never the only
cue: every stage also has a label and icon. Dark theme only (decided). These values
match the mockup's "Design language" board.

### 4.3 Typography
- **Instrument Sans** (UI and headings, variable weight and width), **JetBrains Mono**
  (numeric readouts with tabular figures). Self-hosted via `@fontsource-variable/*`, with no
  third-party requests.
- The pedal's screen print uses Instrument Sans at 85% width, bold. The "bass synth"
  wordmark uses **Comfortaa** Light, which is close to the rounded lowercase on the pedal.

### 4.4 The pedal drawing
- Built as **one SVG component tree** at the real proportions of the enclosure
  (≈ 0.54 width : height, measured from the manual photo; confirm the real dimensions
  during Phase 1). Knob positions are measured from the same diagram.
- Realism through: matte powder-coat texture (`feTurbulence` noise at low opacity),
  knob skirts with radial highlights and scallops, white pointer lines, chrome
  footswitch with conic-gradient sheen, LEDs with bloom (`feGaussianBlur`) when lit,
  side jacks in perspective, and a soft drop shadow.
- **Branding:** the "MXR" box logo and "bass synth" wordmark are redrawn, not copied
  from photos. MXR naming and the preset names stay (decided: private use).
- The mockup's `Pedal` board is the visual reference for Phase 1: same coordinates,
  gradients, scalloped knob outline and LED treatment.

### 4.5 Motion
- Knob springs (`svelte/motion` `Spring`), LED fades, layer-swap crossfades, signal
  particles in the flow diagram.
- `prefers-reduced-motion`: no particles, no springs (instant jumps), static LEDs (no
  flashing; a different icon state instead).

### 4.6 Component library
- Custom: `Pedal`, `Knob`, `PushButton`, `Footswitch`, `Led`, `Jack`, `ExpressionPedal`,
  `Fretboard`, all visualizers.
- **Bits UI** (headless, accessible Svelte primitives) for tabs, tooltips, popovers,
  dialogs, toggle groups, and **Lucide** icons (`@lucide/svelte`).

---

## 5. Technical architecture

### 5.1 Stack (decision)

| Concern | Choice | Why |
|---|---|---|
| UI framework | **Svelte 5** (runes) + **TypeScript** | Compiled, fine-grained reactivity: a knob drag at 60+ updates/s updates only the bound attributes, without virtual-DOM diffing across a dozen visuals. Built-in `Spring`/`Tween` and transitions cover the motion needs. Small bundles. |
| Build | **Vite** (plain SPA, *not* SvelteKit) | Everything is browser-only (Web Audio, canvas). SSR/prerendering adds config and SSR guards around audio code for no benefit. Hash routing is enough. A move to SvelteKit later stays possible if we want prerendered lesson pages. |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`, CSS-first `@theme`) | Design tokens in CSS, fast iteration, no runtime. |
| UI primitives | **Bits UI** + **Lucide** | Accessible headless components that match our own styling. |
| Audio | **Web Audio API + AudioWorklet**, own DSP in TypeScript | Full control over a 4-pole ladder filter, band-limited oscillators and per-stage taps. The same DSP code runs in unit tests and offline renders. No Tone.js: we'd use little of it and fight its abstractions for custom DSP. |
| Unit / component tests | **Vitest** (+ browser mode with the Playwright provider for components) | Native Vite integration. |
| E2E / visual / a11y | **Playwright** + `@axe-core/playwright` | Cross-browser, screenshots, audio checks via test hooks. |
| Lint / format | ESLint (flat config) + `eslint-plugin-svelte`, Prettier (+ svelte & tailwind plugins), `svelte-check` | |
| CI/CD | GitHub Actions → GitHub Pages | Free static hosting, preview artifacts per PR. |
| Package manager / runtime | npm, Node 22 LTS | Matches the dev container. |

Versions on npm at planning time (2026-10-18): svelte 5.57, vite 8.3,
tailwindcss 4.3, vitest 5.0, @playwright/test 1.64, bits-ui 2.19. Pin exact versions
at scaffold time. Check `svelte-check` compatibility before adopting TypeScript 7.

### 5.2 Source layout

```
.
├── docs/                         # this plan, reference, content
├── public/                       # favicon, og-image, (optional CC0 samples)
├── src/
│   ├── main.ts
│   ├── App.svelte                # shell: header, router outlet, persistent pedal + source bar
│   ├── app.css                   # Tailwind import + @theme tokens + fonts
│   ├── lib/
│   │   ├── pedal/
│   │   │   ├── params.ts         # param definitions: id, layer, range, mapping, units, formatters
│   │   │   ├── presets.ts        # factory presets (typed data) + validation
│   │   │   ├── machine.ts        # pure state machine: footswitch/preset/hold/save/freeze logic
│   │   │   └── pedal.svelte.ts   # reactive store wrapping machine + params ($state/$derived)
│   │   ├── audio/
│   │   │   ├── dsp/              # PURE TS, no Web Audio types: unit-testable everywhere
│   │   │   │   ├── oscillator.ts # PolyBLEP saw/square, triangle; phase-locked sub divider
│   │   │   │   ├── ladder.ts     # 4-pole ZDF ladder w/ tanh saturation, resonance comp.
│   │   │   │   ├── envelope.ts   # AD filter env, attack/release amp env
│   │   │   │   ├── glide.ts      # log-domain portamento
│   │   │   │   ├── lfo.ts, chorus.ts, compressor.ts, gate.ts, noise.ts (seeded PRNG)
│   │   │   │   ├── pluck.ts      # Karplus–Strong virtual bass
│   │   │   │   └── pedal-dsp.ts  # composes the full chain; process(block) → outputs + taps
│   │   │   ├── worklets/
│   │   │   │   └── pedal.worklet.ts   # AudioWorkletProcessor wrapping pedal-dsp
│   │   │   ├── engine.ts         # AudioContext lifecycle, graph, analysers per tap, limiter
│   │   │   ├── offline.ts        # renderPatch(params, notes, ms) via pedal-dsp (Web Worker)
│   │   │   └── sources/          # riff sequencer, fretboard and keyboard input
│   │   ├── viz/
│   │   │   ├── draw/             # pure drawing functions (scope, spectrum, envelope…)
│   │   │   ├── analysis.ts       # FFT helpers, trigger detection, spectral centroid
│   │   │   ├── scheduler.ts      # shared rAF loop with visibility pausing
│   │   │   └── *.svelte          # Scope, Spectrum, EnvelopeGraph, PitchGraph, Spectrogram, Meter, SignalFlow
│   │   ├── components/
│   │   │   ├── pedal/            # Pedal, Knob, PushButton, Footswitch, Led, Jack, ExpressionPedal
│   │   │   └── ui/               # shell, cards, ControlCard, LayerToggle, SourceBar, Fretboard
│   │   ├── learn/                # chapter definitions (data) + chapter-specific widgets
│   │   ├── content/              # all user-facing copy (controls, chapters, glossary)
│   │   ├── router.svelte.ts      # tiny hash router
│   │   └── test-hooks.ts         # window.__MXR_TEST__ (only when VITE_TEST_HOOKS=true)
│   └── views/                    # PlayView, FlowView, LearnView, PresetsView, ReferenceView
├── tests/
│   ├── e2e/                      # Playwright specs + fixtures (e.g. bass-e1.wav)
│   └── setup/                    # shared test utilities
├── playwright.config.ts
├── vite.config.ts                # also holds Vitest config
└── .github/workflows/            # ci.yml, deploy.yml
```
Unit tests are colocated (`ladder.test.ts` next to `ladder.ts`).

### 5.3 State model

- **`params.ts` is the single source of truth.** Every parameter declares
  `{ id, label, layer: 'main'|'voice'|'shape', knob: 'MIX'|…, kind: 'continuous'|'stepped',
  steps?, default, toPhysical(k), format(k), expressionable, global }`. The UI, the
  audio engine, the content cards, the presets and the tests all read from it.
- **Patch** = `{ shape, voiceOn, values: Record<ParamId, number /*0..1*/>, toe?: Partial<…> }`.
- **Pedal machine** (`machine.ts`): a pure reducer `(state, event, now) → state`
  for footswitch press/release timing, PRESETS tap/hold, VOICE/SHAPE hold layers,
  preset scroll mode, copy/save, reset, freeze configuration, the modified flag and LED
  states (including flash patterns). Pure and time-injected means it's trivial to unit-test.
- **Reactive layer** (`pedal.svelte.ts`): `$state` wraps the machine, and `$derived`
  computes the effective patch (heel/toe morph applied) and LED view-models. One
  `$effect` pushes param changes to the audio engine (batched per animation frame).

### 5.4 Audio graph

```
 [Riff/Fretboard/Keys] ──note events──┐
 [Pluck (virtual bass)] ──dry audio───┤
                                       ▼
                    ┌───────── AudioWorkletNode "pedal" ─────────┐
                    │ tracking → osc → filter → amp → chorus →    │── out 0 (stereo main) ──► Gain (master) ──► Limiter ──► destination
                    │ comp → gate → mix → output gain             │── out 1..4 (taps: osc, filter, amp, fx) ──► AnalyserNodes
                    └──────────── port: params in, ───────────────┘
                                  telemetry out (~60 Hz: cutoff Hz, env, pitch, LFO, GR)
```

- One worklet runs the whole chain from `pedal-dsp.ts`, so audio, offline renders
  and unit tests share the same code.
- Params arrive as smoothed `AudioParam`s (k-rate/a-rate where it matters, e.g. cutoff)
  plus port messages for discrete state (shape, voice, stepped settings, note events).
- **Telemetry** (control values for envelope/pitch graphs) goes back via
  `port.postMessage`, about 60 small messages per second. *No SharedArrayBuffer*, because GitHub
  Pages can't set the COOP/COEP headers it needs.
- The worklet is built as a separate Vite entry (`?worker&url` / `new URL(..., import.meta.url)`)
  so it's bundled and hashed.
- Oversampling (2×) inside the ladder and oscillators keeps aliasing low at high
  resonance. Keep it switchable for low-end devices.

### 5.5 Offline ("computed") rendering
`offline.ts` runs `pedal-dsp` in a **Web Worker** for a short render (e.g. 3 cycles
for the scope, 1.5 s for envelope graphs) whenever params change (debounced ≈ 30 ms).
It powers:
- visuals while audio is off,
- clean "theory" overlays (e.g. the ideal waveform layers),
- **deterministic tests**: a seeded PRNG and fixed sample rate make renders bit-stable.

### 5.6 Performance budget
- Initial JS ≤ 200 KB gzip (Learn content lazy-loaded per chapter).
- 60 fps with all Play-view visuals on a mid-range laptop. ≥ 30 fps on a mid-range phone.
- Worklet CPU ≤ 15% of one core at 48 kHz with 2× oversampling.
- Lighthouse: Performance ≥ 90, Accessibility 100, Best Practices ≥ 95.

### 5.7 Browser support
Latest 2 versions of Chrome, Edge, Firefox and Safari (macOS and iOS 17+). iOS caveats:
audio needs a gesture, and the hardware silent switch can mute Web Audio. Show a hint.

---

## 6. Accessibility

- Knobs are `role="slider"` with `aria-valuetext` such as "Cutoff, 2 o'clock, about 1.9
  kilohertz". Buttons are real `<button>`s with `aria-pressed`. The footswitch announces
  "Synth on/off". LEDs are decorative (`aria-hidden`), with state shown in text.
- Full keyboard operation of the pedal, including layer holds (`V`, `S`), the
  footswitch (`Space`), presets (`P` / `Shift+P`) and the fretboard keys. A shortcut
  sheet opens with `?`.
- Visible focus rings on the pedal (styled to fit the hardware look).
- Live text readouts for visuals in `aria-live="polite"` regions, throttled to ≤ 1/s.
- Contrast: text ≥ 4.5:1, UI graphics ≥ 3:1. Supports reduced motion (§4.5).
- axe-core scan of every view in CI (zero serious/critical violations).

---

## 7. Testing strategy

### 7.1 Pyramid

| Layer | Tool | What | Examples |
|---|---|---|---|
| **Unit: model** | Vitest (node) | params, presets, machine | Knob→Hz mapping endpoints and monotonicity. Clock-position formatter. Every preset validates against `params`. Footswitch: tap < 600 ms toggles bypass, hold enters scroll mode, timeout exits. PRESETS hold 2 s copies, second hold saves, can't save into live. Freeze config via RESONANCE extremes. Modified flag and LED flash states. |
| **Unit: DSP** | Vitest (node) | pure DSP modules | Oscillator fundamental within ±0.5 cent (zero-crossings / FFT). Saw harmonics ∝ 1/n, square has odd harmonics only. Sub = f/2 and phase-locked. Ladder: −24 dB ±3 dB one octave above cutoff, resonance peak grows monotonically, stable (no NaN/Inf) across the whole range. Envelope times within ±5%. Glide reaches the target in the configured time. Noise is deterministic with a seed. Compressor reduces crest factor. No denormals or DC offset. |
| **Unit: viz** | Vitest | analysis + draw functions | Trigger finds a stable phase. Spectral centroid of a known signal. Draw functions against a mock/OffscreenCanvas (call-recording). |
| **Component** | Vitest browser mode | Knob, PushButton, Footswitch, LayerToggle | Keyboard/drag/wheel change value and ARIA attributes. Hold timing. Reduced-motion branch. |
| **E2E** | Playwright | user flows | See 7.2. |
| **Visual regression** | Playwright `toHaveScreenshot` | pedal and key visuals | Pedal in each SHAPE, layer and LED state. Scope/spectrum from **offline renders** (deterministic). Desktop and mobile. |
| **Accessibility** | `@axe-core/playwright` | every view | Zero serious/critical violations. |
| **Performance (nightly)** | Playwright + `performance` API | frame time during a knob sweep | p95 frame ≤ 20 ms on CI desktop profile (informational at first). |

### 7.2 E2E scenarios (initial set)
1. **Smoke:** the app loads with no console errors, the pedal renders 6 knobs, 3 buttons,
   footswitch and LEDs, and every view route resolves.
2. **Knobs:** drag CUTOFF up → `aria-valuenow` rises and the readout shows a higher Hz. Arrow
   keys step. Double-click resets.
3. **SHAPE / VOICE:** SHAPE cycles △→◿→⊓ and the right LED lights. VOICE toggles `aria-pressed`.
4. **Secondary layer:** hold VOICE (pointer down) → knob names become VOICE MIX… GLIDE.
   Turning MIX changes VOICE MIX, not MIX. Release → names revert. Same for SHAPE and the
   layer toggle.
5. **Footswitch:** tap → bypass LED off/on. Hold → scroll mode, tap advances presets, timeout
   exits (using Playwright's clock API, `page.clock`).
6. **Presets:** selecting SLEDGE moves knobs to the expected values and sets the LED to red #1.
   Editing a knob → modified (flash) state. Copy/save flow. Live mode persists across reload.
7. **Audio, real-time:** click "Start sound" → `AudioContext.state === 'running'`. Play a
   note → output RMS > threshold (via `window.__MXR_TEST__.levels()`). Bypass → synth tap
   silent and dry present.
8. **Audio, cause → effect (deterministic):** via `__MXR_TEST__.renderOffline(patch, notes)`:
   lowering CUTOFF lowers the spectral centroid. SUB MIX max → the fundamental halves. GLIDE > 0 →
   pitch ramp duration matches. Negative env amount → centroid dips after onset.
9. **Linked highlighting:** hovering CUTOFF highlights the filter block and spectrum curve
   (asserted via `data-highlighted` attributes).
10. **Learn:** chapter 5 detects "CUTOFF below 9 o'clock ✓" and enables Next. Deep link
    `#/learn/6` opens chapter 6.
11. **Share link:** copy the URL with a patch → open it in a new page → same knob values.
12. **Responsive:** mobile project: the layer toggle works, visual tabs swipe, no horizontal scroll.
13. **Calibration regression:** offline renders of each preset stay within tolerance of
    the reference numbers measured from the real pedal (see Phase 4b).

### 7.3 Playwright configuration notes
- `webServer`: `npm run build -- --mode test && npm run preview -- --port 4173`. The `test` mode
  sets `VITE_TEST_HOOKS=true`. Production builds never include the hooks (asserted by a
  unit test on the built bundle).
- Projects: `chromium` (full suite + visual), `mobile-chromium` (Pixel 7 profile), and
  `firefox` + `webkit` (smoke + core flows) in CI.
- Chromium launch args: `--autoplay-policy=no-user-gesture-required`.
- Prefer role-based locators (`getByRole('slider', { name: 'Cutoff' })`). Use `data-testid`
  only for canvases.
- Screenshot baselines are generated **in CI on Linux** (official Playwright Docker
  image matching the pinned version) to avoid cross-OS font and rendering differences.
  `npm run test:visual:update` runs in that container.
- **Claude Code cloud container note:** it ships Playwright 1.56.1 with Chromium 141 at
  `/opt/pw-browsers`. If the pinned `@playwright/test` differs, set
  `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium`. The config passes it as
  `launchOptions.executablePath` instead of downloading browsers.

### 7.4 npm scripts (planned)
```
dev            vite
build          vite build
preview        vite preview
check          svelte-check --tsconfig ./tsconfig.json
lint           eslint . && prettier --check .
format         prettier --write .
test           vitest run                 # unit + component
test:watch     vitest
test:e2e       playwright test
test:visual    playwright test --grep @visual
test:all       npm run lint && npm run check && npm run test && npm run test:e2e
```

### 7.5 CI (GitHub Actions)
- **ci.yml** (PRs + main): install (cache) → lint → check → unit/component tests →
  build → Playwright (chromium + mobile, then firefox/webkit smoke) → upload the HTML
  report and traces on failure.
- **deploy.yml** (main): build with `base: '/mxr/'` → `actions/upload-pages-artifact` →
  `actions/deploy-pages`.
- Required checks for merging: lint, check, unit, e2e-chromium.

---

## 8. Implementation roadmap

Each phase is **one reviewable PR** (or a small series), ends green in CI, and leaves
the app deployable. Checkboxes track progress.

### Phase 0: Foundation & tooling
- [x] Scaffold Vite + Svelte 5 + TS (`npm create vite@latest -- --template svelte-ts`).
- [x] Tailwind v4 via `@tailwindcss/vite`, theme tokens from §4.2, self-hosted fonts.
- [x] ESLint + Prettier + `svelte-check`, plus an `.editorconfig`.
- [x] Vitest (node + browser mode) with one sample test each.
- [x] Playwright config (§7.3) with a smoke test, and the `PW_CHROMIUM_PATH` fallback.
- [x] App shell: header, hash router, empty views, footer disclaimer (§10).
- [x] GitHub Actions CI + Pages deploy. `CLAUDE.md` with conventions and pointers to these docs.
- [ ] Optional: Claude Code SessionStart hook that runs `npm ci` in cloud sessions.
- **Done when:** `npm run test:all` passes locally and in CI, and the shell is live on Pages.
  (Local: passing. CI and Pages run once the work is on `main` and Pages is set to deploy
  from GitHub Actions.)

### Phase 1: The pedal (visual + interaction, no audio)
- [x] `Knob` (drag/wheel/keys, 300° sweep, clock formatting, ARIA), `PushButton`,
  `Footswitch`, `Led` (on/off/soft-flash/hard-flash), `Jack`.
- [x] `Pedal` SVG: enclosure, texture, screen print, logo, layout per reference §2,
  responsive scaling.
- [x] Hover/focus tooltips with the control-card one-liners (`ControlCaption`; jacks use
  SVG `<title>` tooltips).
- [x] Tests: component tests for Knob/Buttons, E2E scenarios 1–3, visual snapshot test.
- [ ] Visual baseline: generate `pedal.png` in the official Playwright Docker image for the
  pinned version and compare it in CI. The test exists (`npm run test:visual`) but no
  baseline is committed yet, because local browsers differ from CI's.
- **Done when:** the pedal is visually close to the product photo (side-by-side review) and fully
  keyboard-operable.

Phase 1 keeps a small `PedalState` class (`src/lib/pedal/pedal.svelte.ts`) for knob values,
SHAPE, VOICE, bypass and a PRESETS counter. Phase 2 replaces it with `params.ts` and the
state machine.

### Phase 2: Pedal brain (params, presets, state machine)
- [ ] `params.ts` with all 6 × 3 parameters and mappings from reference §3–4.
- [ ] `machine.ts`: footswitch, PRESETS, layers, scroll, copy/save, reset, freeze config,
  modified flag, LED view-model.
- [ ] Draft factory presets (reference §5), live mode + `localStorage`, URL share.
- [ ] Secondary-layer UI: legend morph, layer toggle, stepped-knob detents.
- [ ] Animated preset transitions.
- [ ] Tests: exhaustive unit tests for the machine and params, E2E 4–6 and 11.
- **Done when:** every behavior in the manual's controls/presets sections works with
  visual feedback, still silent.

### Phase 3: DSP core (pure TypeScript)
- [ ] Oscillators (PolyBLEP saw/square, triangle), sub divider, voice oscs, noise.
- [ ] 4-pole ZDF ladder with saturation and resonance compensation, 2× oversampling.
- [ ] Filter envelope (AD), amp envelope, glide, LFO, chorus, compressor, gate, output gain.
- [ ] Karplus–Strong virtual bass. `pedal-dsp.ts` composition with tap outputs.
- [ ] Tests: DSP unit suite (§7.1), with numeric tolerances documented in each test.
- **Done when:** offline renders of every preset pass sanity tests (no clipping before the
  limiter, no NaNs, expected spectra trends).

### Phase 4: Audio engine & sound sources
- [ ] AudioWorklet wrapper, engine lifecycle (start/suspend/resume), master volume, limiter,
  analysers per tap, telemetry channel.
- [ ] Riff sequencer (look-ahead scheduling on the audio clock) with the riffs from
  learning-content §D, plus the fretboard and keyboard input.
- [ ] Bypass, MIX, DRY THRU FX, output modes (mono / wet-dry → L/R / stereo), freeze.
- [ ] "Start sound" UX, mute, output meter, iOS hints.
- [ ] Test hooks + E2E 7–8.
- **Done when:** all presets are playable with every source in all supported browsers.

### Phase 4b: Calibration against the real MB301
The owner has the real pedal, so the assumptions in `pedal-reference.md` get checked
against it instead of guessed from demo videos.
- [ ] Record reference clips: a DI bass (or a re-amped test riff from the app's riff
  player) through the real pedal into an audio interface, once per factory preset and
  for single-knob sweeps (CUTOFF, RESONANCE, ENVELOPE, MOD, GLIDE, SUB MIX).
- [ ] Settle each **ASSUMPTION**: VOICE intervals, sub-oscillator waveform, MOD rate and
  MOD BLEND direction, whether Live mode sits in the PRESETS cycle, footswitch hold time,
  knob-to-value curves.
- [ ] Note each factory preset's real knob positions on the pedal itself (preset
  values aren't printed anywhere, so dial them in by ear until they match). Replace the draft
  recipes in `pedal-reference.md` §5.
- [ ] Log findings in `docs/calibration.md`. Store derived numbers (spectral centroid
  over time, envelope timing, levels) as JSON fixtures for E2E 13; keep the raw audio out
  of the repo.
- **Done when:** every ASSUMPTION is confirmed or corrected, and an A/B listening
  session finds each preset recognizably close.

### Phase 5: Core visualizations
- [ ] rAF scheduler, analysis helpers, offline-render worker.
- [ ] Oscilloscope (triggered, tap selector, layers mode), spectrum + analytic filter
  curve, envelope graph, pitch graph, level/GR meter.
- [ ] Simple ⇄ Detailed toggle, live text readouts.
- [ ] Linked highlighting between pedal ↔ visuals.
- [ ] Tests: viz unit tests, visual snapshots from offline renders, E2E 9.
- **Done when:** every primary and secondary parameter has a visible effect in at least one visual.

### Phase 6: Under the hood (signal flow)
- [ ] Signal-flow diagram (reference §9) with stage colors, active/inactive states,
  animated particles, click-to-inspect, and mini scopes per tap.
- [ ] Dry-path and stereo routing visualized per OUTPUT MODE and DRY THRU FX.
- **Done when:** a non-expert test user can point to "where the sound gets darker".

### Phase 7: Learn mode
- [ ] Chapter framework: goal checks, focused controls, dimming, progress (persisted),
  next/prev, deep links.
- [ ] Chapters 0–13 from `learning-content.md`, plus the additive-synthesis demo and LFO widget.
- [ ] Glossary with inline illustrations and cross-links.
- [ ] Tests: E2E 10, a11y scans of every chapter.
- **Done when:** content is reviewed for plain language (no unexplained jargon).

### Phase 8: Presets gallery & expression
- [ ] Preset recipe cards (key knobs tagged with chapters, era/instrument context).
- [ ] Virtual expression pedal with heel/toe editor and morph visualization.
- [ ] Spectrogram (detailed mode).
- **Done when:** each preset card explains *why* it sounds the way it does.

### Phase 9: Polish & launch
- [ ] Responsive pass (all breakpoints), touch ergonomics, reduced motion.
- [ ] Performance pass against §5.6, plus lazy loading.
- [ ] Full a11y audit (keyboard-only and screen-reader walkthrough).
- [ ] Open Graph image, favicon, about/disclaimer page, README screenshots.
- **Done when:** Lighthouse targets are met and there are no open P1 bugs.

### Phase 10 (stretch): Extras
- [ ] "Recreate the preset" challenge with a similarity meter.
- [ ] Optional: PWA / offline support.

---

## 9. Definition of done (every PR)
- `npm run test:all` green, and CI green on all required checks.
- New behavior has tests at the lowest sensible layer, plus E2E for user-visible flows.
- No new axe violations. Visual snapshot changes reviewed and intentional.
- User-facing copy lives in `src/lib/content/`, not hard-coded in components.
- Any new modeling assumption is recorded in `pedal-reference.md` (marked **ASSUMPTION**).

---

## 10. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Real pedal internals unknown (voice intervals, signal order, LFO rate, preset values) | Sound differs from the real unit | Mark assumptions in the reference doc and keep constants in one place. Calibrate against the owner's real MB301 (Phase 4b). Say so in-app ("educational model"). |
| Trademark (MXR, Dunlop, preset names, pedal look) | Low: private use | Keep the disclaimer in the footer. Original drawings only, no photos or manual redistribution, link to the official manual. Revisit if the app is ever made public. |
| Web Audio differences (Safari, iOS) | Glitches, no sound | AudioWorklet is supported everywhere now. Test on WebKit in CI. Show an iOS silent-switch hint. Offline visuals still work without sound. |
| DSP CPU on low-end phones | Dropouts | Oversampling switch, adaptive viz frame rate, pause off-screen visuals. |
| Flaky audio/visual tests | CI noise | Deterministic offline renders for assertions. Real-time audio tests only check coarse levels. Visual baselines generated only in the CI container. |
| Loud resonance / self-oscillation | Hearing / speaker risk | Safety limiter, conservative default volume, resonance max below self-oscillation. |
| Scope creep in Learn content | Delays | Chapters are data-driven. Ship 0–7 first, then the rest. |

---

## 11. Decisions (reviewed 2026-10-18)

| # | Question | Decision |
|---|---|---|
| 1 | Framework | **Svelte 5 + Vite + Tailwind v4** (as proposed) |
| 2 | Hosting | **GitHub Pages** at `naag.github.io/mxr` |
| 3 | Branding | **Keep MXR naming and preset names.** Private use, disclaimer stays |
| 4 | Real bass input | **Not planned.** Built-in riff, fretboard and keyboard only |
| 5 | Theme | **Dark only** |
| 6 | Language | **English only** |
| 7 | Preset tuning | **Owner has a real MB301.** Calibration is Phase 4b |

The mockup look (pedal drawing, colors, type, layout) was approved on 2026-10-18.
