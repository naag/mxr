# MXR Bass Synth (MB301): Reference & Simulation Model

This document summarizes the official user guide in our own words and records how
the simulator models each feature. Anything the manual doesn't document is marked
**ASSUMPTION** and should be checked against demo recordings or a real unit.

- Official product page: <https://www.jimdunlop.com/mxr-bass-synth/>
- Official user guide (PDF): <https://www.jimdunlop.com/content/manuals/MB301.pdf>
- We do **not** redistribute the manual or product photos. The pedal in the app is
  an original SVG drawing.

---

## 1. What the pedal is

A digital pedal that emulates a classic **monophonic, analog-style subtractive
synthesizer**, played by your bass. It listens to the note you play (**pitch
tracking**), then drives its own oscillators at that pitch. The oscillator sound goes
through a **4-pole resonant low-pass filter** with an **envelope**, then
modulation (chorus / LFO), compression and a gate, and is finally blended with
your clean ("dry") bass. Designed with bassist Ian Martin Allison.

"Monophonic" means one note at a time. That's why chords don't track well, and it's
an important point for the Learn mode.

## 2. Physical layout (top view, as drawn in the app)

```
 ┌───────────────────────────────────────────┐
 │  (VOICE)          ┌── SHAPE ────────────┐  │   ← power jack on top edge (9 V DC)
 │    ○              │ (○)  ●g  ●o  ●r     │  │
 │                   │       △   ◿   ⊓     │  │
 │  ╭───╮      ╭───╮     ╭───╮             │  │
 │  │MIX│      │CUT│     │ENV│   orange: MIX, SUB MIX
 │  ╰───╯      ╰───╯     ╰───╯   teal:   CUTOFF, ENVELOPE,
 │   MIX      CUTOFF   ENVELOPE          RESONANCE, MOD
 │  ╭───╮      ╭───╮     ╭───╮             │
 │  │SUB│      │RES│     │MOD│             │
 │  ╰───╯      ╰───╯     ╰───╯             │
 │ SUB MIX   RESONANCE    MOD              │
OUT                                        IN    ← side jacks (OUT left, IN right)
 │            ┌─────────┐                   │
 │            │   MXR   │  BASS INNOVATIONS │
 │            └─────────┘                   │
 │                 ◉   ← bypass LED (blue)  │
CTR             ⬤⬤⬤   ← footswitch          │    ← CTR jack + side switch (left, lower)
 │                                           │
 │           bass synth                      │
 │       ●  ●  ●  ●  (▸)  ← 4 bi-color preset LEDs + PRESETS button
 │       └─ PRESETS ─┘                       │
 └───────────────────────────────────────────┘
```

Colors sampled from the official product photo (approximate, refine during Phase 1):

| Element | Approx. color |
|---|---|
| Enclosure (charcoal, slightly blue-gray, matte powder coat) | `#3C3F44` |
| MIX / SUB MIX knobs (signal orange) | `#F26A10` |
| CUTOFF / RESONANCE / ENVELOPE / MOD knobs (teal) | `#5BB5BE` |
| VOICE / SHAPE button caps (light gray) | `#C4C5C0` |
| Screen printing (off-white) | `#E6E4DF` |
| SHAPE LEDs | green `#5FD35A` (△), amber `#F2A51F` (◿), red `#E41E30` (⊓) |
| Bypass LED | blue `#2FA8D8` (lit) |
| Preset LEDs | bi-color: green (presets 1–4) / red (presets 5–8) |

Knobs have a white pointer line and a scalloped skirt.

## 3. Primary controls

| # | Control | Manual says (paraphrased) | Simulator mapping (0–1 knob value `k`) |
|---|---|---|---|
| 1 | **VOICE** button | Adds extra oscillators, tuned in harmony, for a more complex tone. | Toggles voice oscillators. **ASSUMPTION:** intervals +7 and +12 semitones (fifth and octave), same waveform as main. Kept in one constant (`VOICE_INTERVALS`) so it's easy to change. |
| 2 | **CUTOFF** | Sets the cutoff frequency of the 4-pole resonant low-pass filter. | `fc = 40 Hz · 2^(8k)` → 40 Hz … 10.2 kHz (exponential, 8 octaves). |
| 3 | **MIX** | Blend between dry and synth. | Equal-power crossfade: 0 = dry only, 1 = synth only. |
| 4 | **SUB MIX** | Blend between main synth and sub signal. | Equal-power crossfade main ↔ sub. Sub = 1 octave below. **ASSUMPTION:** square-wave sub from a flip-flop-style divider (classic analog octave design). |
| 6 | **FOOTSWITCH** | Tap = engage/bypass. Hold = preset-scroll mode (tap to advance; hold again or time-out to exit). Optional *freeze* mode (see §6). | State machine in `pedal/machine.ts`; hold threshold ≈ 600 ms (**ASSUMPTION**). |
| 7 | **SHAPE** button | Selects waveform: triangle (subtle, smooth), sawtooth (rich, aggressive), square (fat, rubbery punch). LED shows the choice. | Cycles △ → ◿ → ⊓ → △. Band-limited oscillators (PolyBLEP). |
| 8 | **ENVELOPE** | Attack/decay time of the filter envelope. Low = fast, plucky; high = slow sweep. Fully CCW = envelope off. | `k = 0` → off. Otherwise attack `1 ms · 300^k'`, decay `60 ms · 50^k'` (k' = rescaled k). One knob scales both times, like a combined "speed" control. |
| 9 | **MOD** | Amount of modulation. | Depth 0…1 shared between chorus and filter LFO according to MOD BLEND. **ASSUMPTION:** LFO rate also rises with the knob (0.3 Hz → 6 Hz) to get from "subtle shimmer" to "pulsing". |
| 10 | **RESONANCE** | Boosts gain at the cutoff frequency; sharper, more expressive at high settings. | Ladder feedback `0 … 3.9` (4 = self-oscillation), with partial bass-loss compensation. |
| 11 | **PRESETS** button | Selects one of 8 presets. | Cycles Live → G1…G4 → R1…R4 → Live. **ASSUMPTION** about including Live in the cycle. Hold 2 s = copy / save (see §5). |

Knob rotation range: 300° (7 o'clock → 5 o'clock), noon = 0.5. Values in the UI
are shown as **clock positions** ("2 o'clock"), because that's how players talk
about knobs, plus 0–10 and physical units.

## 4. Secondary parameters (hold VOICE or SHAPE + turn a knob)

Holding **VOICE** while turning a knob changes a *sound* parameter. These are saved per
preset and can be controlled by an expression pedal. Holding **SHAPE** changes a
*utility* setting. These can't be controlled by expression, and some are global.

| Knob | VOICE layer (per preset, expression-able) | SHAPE layer (utility) |
|---|---|---|
| MIX | **VOICE MIX**: main osc ↔ voice oscs. Min removes voice oscs. | **COMP**: compression from off → tight limiting. |
| SUB MIX | **NOISE MIX**: oscillators ↔ noise generator. | **OUTPUT GAIN**: ±18 dB, 0 dB at noon. |
| CUTOFF | **FILTER ENV AMOUNT**: bipolar. Above noon the envelope opens the filter; below noon it closes it ("ducking"). | **GATE SENS.** *(global)*: how responsive the pedal is when your signal is below its running average level. Higher suits dynamic or legato playing. Sustain doesn't depend on it. |
| RESONANCE | **GLIDE**: time to slide from one note to the next (legato / portamento). | **TRACKING** *(global)*, 3 positions: **5S** (CCW, default: low B up to high C of a 24-fret 6-string), **4S** (noon: faster, down to low E), **GTR** (CW: 24-fret guitar range). |
| ENVELOPE | **AMP ENV**: fade-in (attack) time of each note. | **DRY THRU FX**: off / on. When on, the dry signal also runs through filter, chorus, compression and gate. |
| MOD | **MOD BLEND**: chorus ↔ filter-LFO mix. | **OUTPUT MODE** *(global)*, 3 positions: **MONO** (CCW, default, true bypass), **WET/DRY** (noon: wet on tip/left, dry on ring/right, buffered bypass), **STEREO** (CW: voice oscs panned, stereo filter + chorus, buffered bypass). |

Simulator mappings for secondary values:

| Param | Mapping |
|---|---|
| VOICE MIX | linear gain of voice oscs 0…1 relative to main |
| NOISE MIX | equal-power crossfade osc ↔ white noise |
| FILTER ENV AMOUNT | `(k − 0.5) · 2 · 5` octaves → −5 … +5 octaves of cutoff modulation |
| GLIDE | 0 → 0 ms; else `5 ms · 200^k` (≈ 1 s max), glide in the pitch (log) domain |
| AMP ENV | attack `1 ms · 1500^k` (≈ 1.5 s max) |
| MOD BLEND | 0 = chorus only, 1 = filter LFO only (**ASSUMPTION** on direction) |
| COMP | ratio 1:1 → ∞:1 (limit), threshold falls with `k`, auto make-up |
| OUTPUT GAIN | `(k − 0.5) · 36` dB |
| GATE SENS | the app has no live input, so this is simulated: soft (ghost) notes from the built-in riffs below the threshold don't trigger the synth |
| TRACKING | 3-way stepped; simulated as the tracking delay before a low note sounds (longest in 5S, shortest in 4S) |
| DRY THRU FX | 2-way stepped (`k < 0.5` off) |
| OUTPUT MODE | 3-way stepped |

In the UI, 3-position "knobs" snap to three detents and show their legend
(e.g. `MONO · WET/DRY · STEREO`).

## 5. Presets & live mode

- 8 presets: 4 **green** (LEDs 1–4 green), 4 **red** (LEDs 1–4 red), plus **live
  mode** (all preset LEDs off). Live mode reflects the current knob positions and
  automatically remembers button and secondary-parameter states.
- When a preset has been edited away from its saved state, its LED **flashes softly**.
- **Scrolling:** PRESETS button, the footswitch (hold → scroll mode; the SHAPE LED
  flashes to show the current preset), or an external switch on CTR (press = forward,
  hold = back).
- **Save:** hold PRESETS 2 s → LEDs flash hard (settings copied) → go to the target
  preset → hold PRESETS 2 s again → saved. Changing the preset cancels this, and so does a time-out.
  You can't save into live mode.
- **Reset one preset:** hold footswitch + PRESETS 5 s. **Factory reset:** hold VOICE +
  SHAPE while powering up (5 s). The bypass LED flashes to confirm.

Factory presets (descriptions from the manual). The **knob values are our own
first-draft approximations** made from those descriptions. The manual doesn't
publish them, so they get replaced with values measured on the real pedal during
calibration (PLAN Phase 4b):

| Bank | Name | Inspiration (per manual) | Draft recipe |
|---|---|---|---|
| G1 | **THRILLENGANES** | Greg Phillinganes' ARP 2600 work on "Thriller". Octave-down, '80s. | ◿ saw, SUB MIX 1, CUTOFF 11, RES 10, ENVELOPE 9 (short), ENV AMT 2, MIX 3 |
| G2 | **WONDERFUL** | Stevie Wonder's left hand on the TONTO synth. Short, funky resonant drop. | ⊓ square, CUTOFF 9, RES 2, ENVELOPE 9, ENV AMT 3, GLIDE 9, MIX 2 |
| G3 | **LIZARD SYNTH** | Herbie Hancock's ARP Odyssey on "Chameleon". High resonance, '70s funk. | ◿ saw, CUTOFF 10, RES 3, ENVELOPE 11, ENV AMT 2, MIX 4 |
| G4 | **SYNTHADELIC** | Bernie Worrell's Minimoog on "Flashlight". Octave-down, wide open. | ⊓ square, SUB MIX 2, CUTOFF 3, RES 10, ENVELOPE off, GLIDE 10, MIX 4 |
| R1 | **SLEDGE** | Tony Levin on "Sledgehammer". Analog octave + compression + chorus. | △ triangle, SUB MIX 2, CUTOFF 1, COMP 3, MOD 12, MOD BLEND 8 (chorus), MIX 1 |
| R2 | **ARMY OF SYNTH** | Synth bass on Björk's "Army of Me". Use expression for intensity. | ◿ saw + VOICE, CUTOFF 10, RES 12, ENVELOPE 10, COMP 2; toe: CUTOFF 3, RES 2 |
| R3 | **NINE INCH SYNTH** | Trent Reznor's "Head Like a Hole". Rock or dance. | ⊓ square + VOICE, CUTOFF 12, RES 1, ENVELOPE 10, ENV AMT 2, NOISE 9, MIX 4 |
| R4 | **SYNTHMAU5** | Sidechain "pumping" à la deadmau5. Dark, atmospheric. | ◿ saw, CUTOFF 10, RES 12, ENVELOPE 1, ENV AMT 9 (negative = ducking), AMP ENV 11, MOD 10, MIX 5 |

(Values are clock positions; "off" = fully CCW.)

### Hold times and timeouts used by the simulator

The manual gives the 2 s (copy/save) and 5 s (reset) holds. The rest are **ASSUMPTIONS**,
kept in `TIMING` in `src/lib/pedal/machine.ts`:

| Rule | Value |
|---|---|
| VOICE / SHAPE tap (no knob turned) | shorter than 500 ms |
| Footswitch hold (preset scroll or freeze) | 600 ms |
| Preset scroll ends after no taps for | 5 s |
| Copy/save menu ends after | 15 s |
| PRESETS cycle includes live mode | live → G1 … G4 → R1 … R4 → live |
| Double-click a knob | back to the preset's saved value (live mode: the starting value) |

### Sound-engine assumptions

Also **ASSUMPTIONS**, kept as named constants in `src/lib/audio/dsp/pedal-dsp.ts` so they're
easy to change after calibration (PLAN Phase 4b):

| What | Model |
|---|---|
| VOICE intervals | +7 and +12 semitones, same wave as the main oscillator (`VOICE_INTERVALS`) |
| Sub oscillator | square, one octave down, phase-locked to the main oscillator |
| TRACKING delay before a note sounds | 5S 20 ms, 4S 12 ms, GTR 6 ms (`TRACKING_DELAY_MS`) |
| GATE SENS. | notes softer than 0.3 × (1 − sensitivity) don't trigger the synth |
| Amp | the synth's level follows the string (1 ms attack, 80 ms release), times AMP ENV |
| MOD | LFO moves the cutoff by up to ±1.5 octaves × MOD × MOD BLEND; chorus depth is MOD × (1 − MOD BLEND) |
| DRY THRU FX | the clean bass is also fed into the filter, then through amp, chorus and compression |
| Freeze | holds the current level and pitch; releasing the string no longer stops the note |
| Bypass | the clean signal in every output mode |

## 6. Footswitch freeze mode

Hold the footswitch and turn RESONANCE to max: holding the footswitch now **freezes
the current note** (infinite sustain) instead of scrolling presets. Hold the footswitch
and turn RESONANCE to min to go back. In the simulator, a frozen note keeps the
oscillators sounding at the frozen pitch and level until the footswitch is released.

## 7. Expression pedal

Each preset (and live mode) stores a **heel** state and a **toe** state. The
expression pedal morphs between them. The heel state is also what you get without a
pedal connected. Primary knobs and VOICE-layer parameters can be morphed; SHAPE-layer
parameters can't. In the simulator: a virtual expression pedal (a rocker that works as a
slider) plus a "set heel / set toe" editor that shows which parameters differ.

- **ASSUMPTION:** how the toe state is set from the front panel. The app uses a Heel/Toe
  switch: with Toe selected, knobs set toe values and you hear the toe sound; rocking the
  pedal ends the toe edit.
- **ASSUMPTION:** the morph is linear in knob position (0–1) for every parameter.
- The toe state is saved per preset (and in live mode) like the rest of the patch.

## 8. Jacks & power

- **IN** (mono), **OUT** (TRS, stereo-capable), **CTR** (expression / tap / external
  switch input, *or* right-channel audio out, chosen with a side switch: TAP/EXP vs
  AUDIO), **power** 9 V DC center-negative, 330 mA, no battery.
- Specs: input impedance 1 MΩ, output impedance 100 Ω, max input +5 dBV, noise floor
  −97 dBV.

The app draws the jacks and lets you hover them for a short tooltip. They aren't
interactive except for the CTR switch, which picks the virtual expression pedal vs.
stereo output.

## 9. Our simulated signal flow

The manual doesn't document the internal order. This is the plausible classic order
we model (and teach), consistent with the DRY THRU FX description:

```
            ┌──────────────────────── dry (clean bass) ─────────────────────────────┐
            │                           (DRY THRU FX on → dry also enters ⓒ)        │
 IN ──┬─────┘                                                                       ▼
      │                                                                          ┌─────┐   ┌────────┐
      └─► ⓐ TRACKING ─ note pitch, onset, level ─┐                               │ MIX │──►│ OUTPUT │──► OUT
          (5S / 4S / GTR, GATE SENS)             │                               └─────┘   │  GAIN  │   (MONO /
                                                 ▼                                  ▲      └────────┘    WET-DRY /
          ⓑ OSCILLATORS (GLIDE on pitch)                                            │                    STEREO)
            main osc  (SHAPE △ ◿ ⊓)  ──┐                                            │
            voice osc (VOICE, VOICE MIX)┼─► SUB MIX ─► NOISE MIX ─► ⓒ FILTER ─► ⓓ AMP ─► ⓔ CHORUS ─► ⓕ COMP ─► ⓖ GATE
            sub osc   (−1 octave)  ────┘     ▲            ▲          4-pole LPF   AMP ENV    (MOD ·      (COMP)    (GATE SENS)
                                             │         noise gen     CUTOFF, RES  × note      MOD BLEND)
                                                                     ▲       ▲     level
                                                     FILTER ENV ─────┘       └── LFO (MOD · MOD BLEND)
                                                     (ENVELOPE, FILTER ENV AMOUNT)
```

Stage letters ⓐ–ⓖ are the "tap points" the Under-the-hood view visualizes.
