# Learning Content Outline

The educational backbone of the app, written for **people who aren't synth
experts**: bass players, curious musicians and beginners. This is draft copy to
review before implementation. The final strings live in `src/lib/content/` so text
can change without touching components.

## Voice & tone guidelines

- **Plain words first, terms second.** "Brightness (the *cutoff frequency*)". The
  jargon goes in italics the first time and links to the glossary.
- **Every concept = something you hear + something you see + something you do.** No
  chapter is just text.
- **Short.** Each explanation card ≤ 60 words. Details sit behind "Tell me more".
- **Analogies from the physical world**, never from other synth jargon.
- **Musician units.** Show note names next to Hz (`E1 · 41 Hz`), clock positions
  next to numbers, "dark ↔ bright" next to dB.
- **Honest about the model.** Where we guess how the real pedal works, say so in
  one line ("We don't know exactly which notes VOICE adds. We use a fifth and an
  octave.").

---

## Part A: Control cards (shown on hover, focus or tap of a control)

Each card has: **one-liner** · **turn left / turn right** · **live value** · **"See
it"** (highlights the matching visual) · optional **"Tell me more"**.

| Control | One-liner | ← Turn left | Turn right → |
|---|---|---|---|
| MIX | Blends your clean bass with the synth. | More of your real bass | More synth |
| SUB MIX | Blends in a second synth voice one octave lower. | Main synth only | Deep sub only |
| CUTOFF | How bright the synth is: it lets low sounds through and blocks high ones. | Darker, muffled | Brighter, buzzier |
| RESONANCE | Adds a sharp, singing peak right at the cutoff point. | Smooth | Squelchy, vocal, whistly |
| ENVELOPE | How fast the brightness "blooms" and fades after each note. Off at minimum. | Quick pluck | Slow sweep |
| MOD | Adds movement: shimmer (chorus) or a pulsing wobble (LFO). | Still | Moving, pulsing |
| VOICE | Adds extra synth voices tuned in harmony for a bigger sound. | (off) | (on) |
| SHAPE | Picks the basic wave the synth starts from. | △ smooth → ◿ rich → ⊓ hollow, punchy | |
| Footswitch | Tap: synth on/off. Hold: browse presets. | | |
| PRESETS | Steps through the 8 built-in sounds (and back to "live"). | | |
| VOICE MIX | How loud the extra voices are. | Voices gone | Voices loud |
| NOISE MIX | Blends in hiss for breathy, gritty textures. | Pure tone | Mostly noise |
| FILTER ENV AMT | How far, and which way, the envelope moves the cutoff. | Notes "duck" darker | Notes "bloom" brighter |
| GLIDE | Slides smoothly from one note to the next. | Instant jumps | Slow slides |
| AMP ENV | How slowly each note fades in. | Instant | Slow swell |
| MOD BLEND | What MOD moves. | Chorus shimmer | Filter wobble |
| COMP | Evens out loud and soft notes. | Natural dynamics | Squashed, even, punchy |
| OUTPUT GAIN | Overall volume, ±18 dB. | Quieter | Louder |
| GATE SENS. | How easily soft notes trigger the synth. | Ignores soft playing | Catches every ghost note |
| TRACKING | Tells the pedal what instrument range to listen for. | 5-string | 4-string · Guitar |
| DRY THRU FX | Sends your clean bass through the filter and effects too. | Off | On |
| OUTPUT MODE | How the sound leaves the pedal. | Mono | Wet/Dry · Stereo |

---

## Part B: Learn chapters (guided tour)

Each chapter defines:
- **Goal**: what the learner understands afterwards.
- **Hear**: what the audio does (a riff or held note plays automatically).
- **See**: which visual is in focus.
- **Do**: the experiment. The UI highlights the relevant control(s), and other
  controls are dimmed but still usable. The chapter checks the goal live (e.g.
  "CUTOFF is now below 9 o'clock ✓") before showing "Next".
- **Takeaway**: one sentence.

### 0. What this pedal does
- **Goal:** The pedal *listens* to your note and *plays a synthesizer* at the same pitch.
- **Hear:** A short bass riff. Footswitch toggles clean ↔ synth.
- **See:** Signal flow with only three blocks: *Your bass → Pitch detective → Synth*.
- **Do:** Tap the footswitch a few times (A/B).
- **Takeaway:** It's a synth that your bass plays. It plays one note at a time
  (*monophonic*), so play single notes, not chords.
- **Tell me more:** Pitch tracking, why low notes take longer to detect (a 41 Hz
  wave takes ~24 ms for a single cycle), what TRACKING does.

### 1. Sound is a wave
- **Goal:** Pitch = how fast the wave repeats; loudness = how tall it is.
- **Hear:** A held note; the learner plays different frets on the virtual fretboard.
- **See:** Big oscilloscope (triggered, so the wave stands still), plus a readout
  "E1 · 41.2 Hz · 41 repeats per second".
- **Do:** Play the open E, then the 12th fret. Watch the wave squeeze to half its width.
- **Takeaway:** One octave up = the wave repeats twice as fast.

### 2. Shape = character (SHAPE)
- **Goal:** Different wave shapes contain different **harmonics** (quieter overtones above the note).
- **See:** Scope + **spectrum** (bars labeled 1×, 2×, 3× … the note).
  Animated "build a sawtooth from sine waves" demo: stacking harmonics one by one
  turns a smooth sine into a saw.
- **Do:** Press SHAPE through △ ◿ ⊓. Compare the bar patterns:
  - △ triangle: few, quickly fading odd harmonics → soft, flute-like
  - ◿ sawtooth: *all* harmonics → bright, buzzy, brassy
  - ⊓ square: only *odd* harmonics → hollow, woody, punchy
- **Takeaway:** The wave shape is the raw material. Harmonics are what the
  filter will carve.

### 3. Thicker: sub & voices (SUB MIX, VOICE, VOICE MIX)
- **Goal:** Layering oscillators at related pitches makes the sound bigger.
- **See:** Scope with the layers drawn separately (main, sub, voices) and summed.
- **Do:** Turn SUB MIX up. See a wave with *double* the width appear (one octave
  down). Press VOICE and hold it while turning MIX (= VOICE MIX).
- **Takeaway:** Sub adds weight underneath. Voices add size and harmony on top.
- **Honesty note:** We don't know the exact voice intervals. We model a fifth + octave.

### 4. Noise (NOISE MIX)
- **Goal:** Noise is random sound containing all frequencies at once.
- **See:** Scope shows fuzz, spectrum fills up evenly.
- **Do:** Hold VOICE, turn SUB MIX (= NOISE MIX). Try it with the filter low for
  "breath", high for "grit".
- **Takeaway:** A little noise adds air and attack. Lots of it is a sound effect.

### 5. Subtractive synthesis: the filter (CUTOFF)
- **Goal:** A **low-pass filter** removes harmonics above the cutoff, so the sound gets darker.
- **Analogy:** Like putting a thicker and thicker blanket over the speaker. The
  bass gets through, the fizz doesn't.
- **See:** Spectrum with the **filter curve** drawn on top. Harmonics outside the curve fade out.
  The scope shows the saw's sharp edge rounding off.
- **Do:** Sweep CUTOFF slowly from min to max with ◿ saw selected.
- **Takeaway:** Start with a bright wave and carve it down. That's *subtractive*
  synthesis, the method behind classic Moog/ARP synths.
- **Tell me more:** "4-pole" / 24 dB per octave: one octave above the cutoff, sound is
  about 16× quieter (−24 dB), so the filter is steep and dramatic.

### 6. Resonance (RESONANCE)
- **Goal:** Resonance boosts frequencies right at the cutoff.
- **Analogy:** Like blowing across a bottle: one pitch "sings" out.
- **See:** The filter curve grows a peak. In the spectrum, the harmonic nearest
  the peak jumps up.
- **Do:** Set RESONANCE to 2 o'clock and sweep CUTOFF again. Hear the "wow" / "quack".
- **Takeaway:** Cutoff + resonance together give the vocal, funky character.
- **Safety:** The app's safety limiter keeps high resonance from getting painfully loud.

### 7. Movement: the filter envelope (ENVELOPE, FILTER ENV AMOUNT)
- **Goal:** An **envelope** is an automatic knob-turner, triggered by every note.
- **See:** **Envelope graph**: cutoff over time for the last note, with a
  moving playhead. The spectrum animates in sync.
- **Do:**
  1. ENVELOPE at 9 o'clock → short "bow" on each note (plucky funk).
  2. ENVELOPE at 3 o'clock → slow "wooooow".
  3. Hold VOICE, turn CUTOFF (= FILTER ENV AMOUNT) below noon → notes *duck*
     darker instead (the SYNTHMAU5 trick).
- **Takeaway:** Envelope speed = ENVELOPE. Depth and direction = FILTER ENV AMOUNT.

### 8. Note shape: amp envelope (AMP ENV)
- **Goal:** The amp envelope shapes the *volume* of each note over time.
- **See:** Envelope graph (volume lane) and the scope's height growing.
- **Do:** Hold VOICE, turn ENVELOPE (= AMP ENV). Short = punchy, long = swells like a bowed string.
- **Takeaway:** Fade-in time turns plucks into pads.

### 9. Glide (GLIDE)
- **Goal:** Glide (*portamento*) slides the pitch between notes instead of jumping.
- **See:** **Pitch graph** (pitch over time). Steps become ramps.
- **Do:** Hold VOICE, turn RESONANCE (= GLIDE). Play two notes an octave apart.
- **Takeaway:** Glide gives the slinky, fretless, P-Funk vibe.

### 10. Modulation (MOD, MOD BLEND)
- **Goal:** An **LFO** is a slow, invisible oscillator that moves another control.
  **Chorus** layers slightly delayed, wobbling copies to make the sound wider.
- **See:** A small LFO dot riding a sine wave, wired to a wobbling cutoff marker on
  the spectrum. For chorus: two slightly offset waveforms on the scope.
- **Do:** Turn MOD up. Hold VOICE, turn MOD (= MOD BLEND) from chorus to LFO.
- **Takeaway:** Modulation keeps sounds alive, from shimmer to pulse.

### 11. Dynamics & output (COMP, GATE SENS., OUTPUT GAIN)
- **Goal:** Compression evens out levels. The gate silences the synth when you're
  not playing. Output gain sets the overall volume.
- **See:** Level meter with a gain-reduction bar. Waveform of a riff with loud
  and soft notes before/after compression.
- **Do:** Hold SHAPE, turn MIX (= COMP). Play the "dynamics" riff with ghost notes.
- **Takeaway:** Compression = consistency and punch. The SLEDGE preset leans on it.

### 12. Blend & routing (MIX, DRY THRU FX, OUTPUT MODE)
- **Goal:** Blending dry + synth keeps your bass's definition. Routing changes
  where the signal goes.
- **See:** Signal-flow diagram with the dry path animating. Stereo field meter (L/R).
- **Do:** MIX at noon. Hold SHAPE, turn ENVELOPE (= DRY THRU FX on): the dry bass now gets
  filtered too. Hold SHAPE, turn MOD to STEREO (use headphones).
- **Takeaway:** Most real-world synth-bass tones are a blend.

### 13. Put it together: the presets
- **Goal:** Read a preset as a recipe of the concepts above.
- **See:** Preset recipe card: each important knob is tagged with the chapter it
  belongs to ("RES high → ch. 6").
- **Do:** Walk through the 8 presets. "Recreate it" challenge (stretch): from a
  neutral patch, match a target. A similarity meter compares spectrum and envelope
  with the target, and hints point to the knob that's furthest off.

---

## Part C: Glossary (initial list)

Oscillator · Waveform · Sine / Triangle / Sawtooth / Square · Harmonic / Overtone ·
Fundamental · Frequency (Hz) · Octave · Sub-oscillator · Noise · Subtractive synthesis ·
Low-pass filter · Cutoff · Resonance · Pole / dB per octave · Envelope · Attack /
Decay · Envelope amount · Amp envelope (VCA) · LFO · Chorus · Glide / Portamento ·
Monophonic · Pitch tracking · Gate · Compression / Limiting · Dry / Wet · Mix ·
Expression pedal · Preset · Stereo · Aliasing (advanced) · Spectrum · Spectrogram ·
Oscilloscope.

Each entry: a definition of 1–2 sentences, a tiny inline SVG illustration where
helpful, and a "See it on the pedal" link that jumps to the related control or chapter.

## Part D: Riffs for the built-in player

Original riffs only (no transcriptions of copyrighted bass lines). They are written
to show off each concept and are "in the style of" the preset eras:

| Riff | Style | Shows off |
|---|---|---|
| Octave Pump | '80s pop, 8th-note octaves | Sub, plucky envelope |
| Funk Drop | '70s funk, syncopated 16ths with slides | Resonance, envelope, glide |
| Ghost Notes | Funk with dynamics | Compression, gate |
| Long Tones | Whole notes | Filter sweeps, LFO, amp-env swells |
| Industrial | Driving 8ths on one note | Voice, noise, aggressive saw |
| Four on the Floor | Notes on the beat with a kick click | Negative env amount ("ducking") |
| Held E | One sustained note | Steady-state visuals for every chapter |

Riffs are stored as simple note-event data (`{ beat, midi, lengthBeats, velocity }`)
with a tempo, so they also serve as deterministic test inputs.
