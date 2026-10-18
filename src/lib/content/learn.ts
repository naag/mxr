/**
 * Learn mode copy (docs/learning-content.md, Part B). One entry per chapter; `steps` has one
 * text per goal check in `learn/chapters.ts`. `[[term]]` and `[[term|words]]` link to the
 * glossary (content/glossary.ts).
 */

export interface StepCopy {
  text: string
  /** Shown once the step is done. */
  done: string
}

export interface ChapterCopy {
  /** Short name for the chapter list and Next/Previous links. */
  short: string
  title: string
  concept: string
  intro: string
  hear: string
  see: string
  do: string
  steps: StepCopy[]
  analogy?: string
  more?: { title: string; text: string }
  /** Where the model guesses what the real pedal does. */
  honesty?: string
  takeaway: string
}

export const chapterCopy: readonly ChapterCopy[] = [
  {
    short: 'What this pedal does',
    title: 'What this pedal does',
    concept: 'The big picture',
    intro:
      'The Bass Synth listens to the note you play on your bass and plays a [[oscillator|synthesizer]] at the same pitch. You hear the synth, your clean bass, or a blend of both.',
    hear: 'A short bass riff. The footswitch flips between your clean bass and the synth.',
    see: 'The whole pedal in three steps: your bass, the pitch detective, the synth.',
    do: 'Tap the footswitch to switch the synth off, then on again. Listen to the difference.',
    steps: [
      {
        text: 'Tap the footswitch: synth off',
        done: 'Done. That is your clean bass on its own (bypass).',
      },
      {
        text: 'Tap it again: synth back on',
        done: 'Done. Same notes, a completely different sound.',
      },
    ],
    analogy:
      'Think of a singer who copies every note you play, the moment you play it, but with a voice of their own.',
    more: {
      title: 'Tell me more: how does it find the note?',
      text: 'The pedal measures how fast your string vibrates ([[pitch-tracking|pitch tracking]]). A low E repeats 41 times a second, so one cycle takes about 24 ms: the pedal has to wait for at least that long before it knows the note. That is why TRACKING asks which instrument you play, and why low notes start a touch later.',
    },
    takeaway:
      'It is a synth that your bass plays. It follows one note at a time ([[monophonic]]), so play single notes, not chords.',
  },
  {
    short: 'Sound is a wave',
    title: 'Sound is a wave',
    concept: 'Pitch and loudness',
    intro:
      'Sound is air moving back and forth. The [[oscilloscope]] draws that movement: how fast the wave repeats is the pitch, how tall it is is the loudness.',
    hear: 'A held note on a sawtooth. Play notes on the fretboard at the bottom of the page.',
    see: 'A big oscilloscope. It waits for the same point of each cycle, so the wave stands still.',
    do: 'Play the open E string, then the E at the 12th fret. Watch the wave squeeze to half its width.',
    steps: [
      { text: 'Play the open E string (E1)', done: 'Done. E1 repeats about 41 times a second.' },
      {
        text: 'Play the E at the 12th fret (E2)',
        done: 'Done. Twice as fast: each cycle is half as wide.',
      },
    ],
    analogy:
      'A guitar string, a speaker cone and your eardrum all do the same dance. The scope is a slow-motion camera on it.',
    more: {
      title: 'Tell me more: hertz and octaves',
      text: '[[frequency|Frequency]] is counted in hertz (Hz): repeats per second. E1 is 41.2 Hz, E2 is 82.4 Hz. Doubling the frequency always sounds like the same note, one [[octave]] higher.',
    },
    takeaway: 'One octave up means the wave repeats twice as fast.',
  },
  {
    short: 'Shape is character',
    title: 'Shape is character',
    concept: 'Waveforms and harmonics',
    intro:
      'Two notes at the same pitch can sound completely different. The difference is the shape of the wave, and every shape is made of [[harmonic|harmonics]]: quieter tones at 2×, 3×, 4× the note.',
    hear: 'A held E with the filter wide open, so you hear every harmonic.',
    see: 'A sine wave turning into a sawtooth as harmonics stack up, and the [[spectrum]] of the real sound.',
    do: 'Press SHAPE to step through triangle, sawtooth and square. Compare the bars in the spectrum.',
    steps: [
      {
        text: 'Pick the △ triangle',
        done: 'Done. Few, quickly fading odd harmonics: soft and flute-like.',
      },
      { text: 'Pick the ◿ sawtooth', done: 'Done. Every harmonic: bright, buzzy, brassy.' },
      { text: 'Pick the ⊓ square', done: 'Done. Only odd harmonics: hollow, woody, punchy.' },
    ],
    analogy:
      'Harmonics are like spices. The note is the dish; the shape decides which spices go in and how much.',
    more: {
      title: 'Tell me more: building waves from sines',
      text: 'Any repeating wave can be built by adding [[sine|sine waves]] at whole-number multiples of the note. A [[sawtooth]] uses all of them, each one quieter (1/2, 1/3, 1/4…). A [[square]] uses only the odd ones. Try it in the demo above.',
    },
    takeaway: 'The wave shape is the raw material. Harmonics are what the filter will carve.',
  },
  {
    short: 'Thicker: sub and voices',
    title: 'Thicker: sub and voices',
    concept: 'Layering oscillators',
    intro:
      'Several [[oscillator|oscillators]] at related pitches sound bigger than one. The [[sub-oscillator|sub]] adds weight one octave below; the voices add harmony above.',
    hear: 'The Octave Pump riff.',
    see: 'The oscilloscope with each oscillator drawn on its own (dashed) and their sum (solid).',
    do: 'Turn SUB MIX up. Then tap VOICE, hold it, and turn MIX: while VOICE is held, MIX sets the voices’ level (VOICE MIX).',
    steps: [
      {
        text: 'Turn SUB MIX past 1 o’clock',
        done: 'Done. A wave twice as wide appears underneath: one octave down.',
      },
      { text: 'Tap VOICE to switch the voices on', done: 'Done. Harmony voices join in.' },
      {
        text: 'Hold VOICE and turn MIX past 3 o’clock (VOICE MIX)',
        done: 'Done. The voices are loud now: a big, organ-like stack.',
      },
    ],
    more: {
      title: 'Tell me more: why one octave down?',
      text: 'Halving the frequency is the simplest thing a circuit can do: count every second cycle. Classic analog octave pedals work that way, which is why the sub is a square wave in this model.',
    },
    honesty:
      'We don’t know exactly which notes VOICE adds on the real pedal. We use a fifth and an octave above.',
    takeaway: 'Sub adds weight underneath. Voices add size and harmony on top.',
  },
  {
    short: 'Noise',
    title: 'Noise',
    concept: 'All frequencies at once',
    intro:
      '[[noise|Noise]] is random movement with no pitch at all. It contains every frequency at once, which is why it sounds like hiss, breath or wind.',
    hear: 'A held E. Noise blends in as you turn it up.',
    see: 'The wave gets fuzzy and the spectrum fills up evenly between the harmonics.',
    do: 'Hold VOICE and turn SUB MIX (NOISE MIX) past noon. Then try the filter low for breath and high for grit.',
    steps: [
      {
        text: 'Hold VOICE and turn SUB MIX to noon or more (NOISE MIX)',
        done: 'Done. Hiss joins the note.',
      },
      {
        text: 'Keep the noise and turn CUTOFF below 9 o’clock',
        done: 'Done. Dark noise sounds like breath or wind.',
      },
      {
        text: 'Now turn CUTOFF past 3 o’clock',
        done: 'Done. Bright noise sounds gritty and aggressive.',
      },
    ],
    analogy: 'Like a crowd talking all at once: no single voice, just a wash of sound.',
    takeaway: 'A little noise adds air and attack. Lots of it is a sound effect.',
  },
  {
    short: 'The filter',
    title: 'The filter: carving the sound',
    concept: 'Subtractive synthesis',
    intro:
      'A sawtooth is bright and buzzy because it is full of harmonics. A [[low-pass-filter|low-pass filter]] lets the low ones through and blocks the high ones. Most synth bass sounds start bright and get carved down like this.',
    hear: 'A held E on a sawtooth. The envelope is off, so the filter stays put.',
    see: 'Harmonics outside the teal curve fade out. The wave’s sharp edge rounds off.',
    do: 'Drag the CUTOFF knob down slowly, then back up. Listen as you go.',
    steps: [
      {
        text: 'Pick the ◿ sawtooth with SHAPE',
        done: 'Done. The sawtooth has every harmonic, so there is lots to carve.',
      },
      {
        text: 'Turn CUTOFF below 9 o’clock',
        done: 'Done. Only a handful of harmonics are left: dark and round.',
      },
      {
        text: 'Sweep it back up past 2 o’clock',
        done: 'Done. That rising “wow” is the sound of a filter opening.',
      },
    ],
    analogy:
      'Put a blanket over a speaker. The bass still gets through, but the fizz and hiss disappear. Turning CUTOFF down is like adding thicker and thicker blankets.',
    more: {
      title: 'Tell me more: why “4-pole”?',
      text: 'The pedal’s filter has four stages, called [[pole|poles]]. Each one turns the sound down a bit more above the [[cutoff]]. Together they make it 24 dB quieter one octave above the cutoff, about 16 times quieter. That steep slope gives classic Moog and ARP synths their smooth, deep sound.',
    },
    takeaway:
      'Start with a bright wave and carve it down. That is [[subtractive-synthesis|subtractive synthesis]], and CUTOFF is the carving knife.',
  },
  {
    short: 'Resonance',
    title: 'Resonance: the singing peak',
    concept: 'Resonance',
    intro:
      '[[resonance|Resonance]] boosts the frequencies right at the cutoff. The filter curve grows a peak, and whatever harmonic sits under it jumps out.',
    hear: 'The Long Tones riff, so you have time to sweep.',
    see: 'The filter curve grows a peak. In the spectrum, the harmonic nearest the peak jumps up.',
    do: 'Set RESONANCE to 2 o’clock, then sweep CUTOFF down and up again. Hear the “wow” and the “quack”.',
    steps: [
      {
        text: 'Turn RESONANCE to 2 o’clock or more',
        done: 'Done. The filter now rings at the cutoff.',
      },
      {
        text: 'Keep it high and turn CUTOFF below 10 o’clock',
        done: 'Done. The peak slides down through the harmonics.',
      },
      {
        text: 'Sweep CUTOFF back up past 2 o’clock',
        done: 'Done. That vocal sweep is the classic synth-bass “wow”.',
      },
    ],
    analogy: 'Like blowing across a bottle: one pitch sings out above the rest.',
    more: {
      title: 'Tell me more: is high resonance safe?',
      text: 'Turned all the way up, a real filter can start to whistle on its own. The app stops just short of that, and a safety limiter at the end keeps sudden peaks from getting painfully loud.',
    },
    takeaway: 'Cutoff and resonance together give synth bass its vocal, funky character.',
  },
  {
    short: 'The filter envelope',
    title: 'Movement: the filter envelope',
    concept: 'Envelopes',
    intro:
      'An [[envelope]] is an automatic hand on a knob. Every time a note starts, it opens the filter and lets it fall back. ENVELOPE sets how fast; FILTER ENV AMT sets how far, and which way.',
    hear: 'The Funk Drop riff with a resonant filter.',
    see: 'The envelope graph: the cutoff over the length of one note.',
    do: 'Try a fast and a slow envelope. Then hold VOICE and turn CUTOFF (FILTER ENV AMT) below noon to make notes duck instead.',
    steps: [
      {
        text: 'Set ENVELOPE between 8 and 10 o’clock',
        done: 'Done. A short “bow” on each note: plucky funk.',
      },
      { text: 'Now turn ENVELOPE past 3 o’clock', done: 'Done. A slow “wooooow” on every note.' },
      {
        text: 'Hold VOICE and turn CUTOFF below 11 o’clock (FILTER ENV AMT), with ENVELOPE on',
        done: 'Done. Notes duck darker instead of opening up: the SYNTHMAU5 trick.',
      },
    ],
    analogy: 'Like a wah pedal that you rock the same way on every note, without lifting a foot.',
    more: {
      title: 'Tell me more: attack and decay',
      text: 'Each envelope has an [[attack-decay|attack]] (how long it takes to open) and a decay (how long to fall back). On this pedal one ENVELOPE knob sets both: left is quick, right is slow. Fully left switches the envelope off.',
    },
    takeaway:
      'ENVELOPE sets the speed. FILTER ENV AMT sets the depth and direction ([[envelope-amount|envelope amount]]).',
  },
  {
    short: 'The amp envelope',
    title: 'Note shape: the amp envelope',
    concept: 'Volume over time',
    intro:
      'The [[amp-envelope|amp envelope]] shapes the volume of each note. On this pedal it sets how slowly each note fades in. The synth then fades out with your string.',
    hear: 'The Long Tones riff: whole notes, so you hear each one swell.',
    see: 'The volume lane of the envelope graph, and the wave after the amp growing taller.',
    do: 'Hold VOICE and turn ENVELOPE (AMP ENV) up for a slow swell, then back down for a punchy start.',
    steps: [
      {
        text: 'Hold VOICE and turn ENVELOPE past 2 o’clock (AMP ENV)',
        done: 'Done. Notes swell in like a bowed string.',
      },
      { text: 'Turn it back below 9 o’clock', done: 'Done. Instant start: punchy again.' },
    ],
    analogy: 'Like a violinist starting a note slowly with the bow, instead of plucking it.',
    takeaway: 'A slow fade-in turns plucks into pads.',
  },
  {
    short: 'Glide',
    title: 'Glide: sliding between notes',
    concept: 'Portamento',
    intro:
      '[[glide|Glide]] (portamento) slides the pitch from one note to the next instead of jumping. Longer glide, slower slide.',
    hear: 'The Funk Drop riff, or two notes you play on the fretboard.',
    see: 'The pitch graph: pitch over time. Steps become ramps.',
    do: 'Hold VOICE and turn RESONANCE (GLIDE) up. Then play the open A string and the A at the 12th fret.',
    steps: [
      {
        text: 'Hold VOICE and turn RESONANCE past 1 o’clock (GLIDE)',
        done: 'Done. Notes now slide.',
      },
      { text: 'Play the open A string (A1)', done: 'Done. Now jump an octave.' },
      {
        text: 'Play the A at the 12th fret (A2)',
        done: 'Done. Hear the swoop? That ramp is the glide.',
      },
    ],
    analogy: 'Like sliding your finger up a fretless neck instead of hopping between frets.',
    takeaway: 'Glide gives the slinky, fretless, P-Funk vibe.',
  },
  {
    short: 'Modulation',
    title: 'Modulation: keeping it alive',
    concept: 'LFO and chorus',
    intro:
      'An [[lfo|LFO]] is a slow, invisible oscillator that moves another control: here, the cutoff. [[chorus|Chorus]] layers slightly delayed, wobbling copies to make the sound wider. MOD sets how much; MOD BLEND picks between them.',
    hear: 'The Long Tones riff, so the movement has time to show.',
    see: 'A dot riding the LFO’s wave, wired to a wobbling cutoff marker.',
    do: 'Turn MOD up. Then hold VOICE and turn MOD (MOD BLEND) from chorus to LFO.',
    steps: [
      { text: 'Turn MOD past 1 o’clock', done: 'Done. The sound starts to move.' },
      {
        text: 'Hold VOICE and turn MOD below 8 o’clock (MOD BLEND: chorus)',
        done: 'Done. All chorus: a wide shimmer.',
      },
      {
        text: 'Now turn it past 4 o’clock (MOD BLEND: LFO)',
        done: 'Done. All LFO: the filter pulses up and down.',
      },
    ],
    analogy: 'Like a hand slowly turning the CUTOFF knob back and forth for you, forever.',
    honesty:
      'The manual doesn’t say how fast the LFO runs or which way MOD BLEND turns. We guess: faster as MOD goes up, chorus on the left.',
    takeaway: 'Modulation keeps sounds alive, from a gentle shimmer to a strong pulse.',
  },
  {
    short: 'Dynamics and output',
    title: 'Dynamics and output',
    concept: 'Compression and gate',
    intro:
      '[[compression|Compression]] turns loud notes down so soft ones keep up. The [[gate]] keeps the synth quiet between notes, and decides how soft a note can be and still trigger it. OUTPUT GAIN sets the final volume.',
    hear: 'The Ghost Notes riff: loud notes with soft ones in between.',
    see: 'The level meter with the compressor’s gain reduction, and the output wave.',
    do: 'Hold SHAPE and turn MIX (COMP) up. Play the Ghost Notes riff. Then hold SHAPE and turn CUTOFF (GATE SENS.) down.',
    steps: [
      {
        text: 'Hold SHAPE and turn MIX past 2 o’clock (COMP)',
        done: 'Done. Loud notes are pulled down: punchy and even.',
      },
      {
        text: 'Play the Ghost Notes riff',
        done: 'Done. Listen to the soft notes between the loud ones.',
      },
      {
        text: 'Hold SHAPE and turn CUTOFF below 9 o’clock (GATE SENS.)',
        done: 'Done. The soft ghost notes no longer trigger the synth.',
      },
    ],
    analogy:
      'A compressor is a sound engineer with a hand on the fader, pulling it down whenever you play loud.',
    more: {
      title: 'Tell me more: limiting',
      text: 'With COMP all the way up the compressor becomes a limiter: nothing gets past a set level. The SLEDGE preset leans on compression for its even, punchy sound.',
    },
    takeaway: 'Compression means consistency and punch.',
  },
  {
    short: 'Blend and routing',
    title: 'Blend and routing',
    concept: 'Dry, wet and stereo',
    intro:
      'Blending your clean bass ([[dry-wet|dry]]) with the synth (wet) keeps the definition of your playing. Routing decides where each part goes: through the effects or around them, and out of one or two outputs.',
    hear: 'The Octave Pump riff.',
    see: 'The signal flow with the clean path on the left, and the left and right output levels.',
    do: 'Set MIX to noon. Hold SHAPE and turn ENVELOPE (DRY THRU FX) on. Then hold SHAPE and turn MOD to STEREO (use headphones).',
    steps: [
      { text: 'Set MIX close to noon', done: 'Done. An even blend of clean bass and synth.' },
      {
        text: 'Hold SHAPE and turn ENVELOPE past noon (DRY THRU FX on)',
        done: 'Done. Your clean bass now goes through the filter too.',
      },
      {
        text: 'Hold SHAPE and turn MOD fully right (OUTPUT MODE: STEREO)',
        done: 'Done. Chorus and voices spread left and right.',
      },
    ],
    more: {
      title: 'Tell me more: the three output modes',
      text: 'MONO sends one mixed signal. WET/DRY sends the synth to the left (tip) and your clean bass to the right (ring), so each can go to its own amp. STEREO spreads the chorus and voices across both sides.',
    },
    takeaway: 'Most real-world synth bass tones are a blend.',
  },
  {
    short: 'Put it together',
    title: 'Put it together: the presets',
    concept: 'Reading a sound',
    intro:
      'Every [[preset]] is a recipe made of the ideas from the last chapters. Read the cards below, then load each one and hear how the ingredients add up.',
    hear: 'The Funk Drop riff, through whichever preset you pick.',
    see: 'A recipe card per preset: the knobs that matter, tagged with the chapter that explains them.',
    do: 'Tap PRESETS (or pick a card) to load a green preset, then a red one. End back in live mode.',
    steps: [
      { text: 'Load a green preset (G1–G4)', done: 'Done. Look at its card: which knobs make it?' },
      { text: 'Load a red preset (R1–R4)', done: 'Done. Compare it with the green one.' },
      {
        text: 'Go back to live mode (all preset lights off)',
        done: 'Done. Your own sound is where you left it.',
      },
    ],
    takeaway:
      'Every synth bass sound is wave + filter + movement + dynamics. Now you can read any of them.',
  },
]

export interface PresetRecipe {
  era: string
  why: string
  /** Key ingredients: what to look at, and the chapter that explains it. */
  keys: { label: string; chapter: number }[]
}

/** Short recipe cards for chapter 13 (the full gallery comes in the Presets view). */
export const presetRecipes: readonly PresetRecipe[] = [
  {
    era: '’80s pop',
    why: 'A bright sawtooth with a deep sub and a fast, plucky envelope.',
    keys: [
      { label: '◿ sawtooth', chapter: 2 },
      { label: 'SUB MIX up', chapter: 3 },
      { label: 'short ENVELOPE', chapter: 7 },
    ],
  },
  {
    era: '’70s funk',
    why: 'A square wave, a resonant drop on every note and a touch of glide.',
    keys: [
      { label: '⊓ square', chapter: 2 },
      { label: 'RESONANCE', chapter: 6 },
      { label: 'GLIDE', chapter: 9 },
    ],
  },
  {
    era: '’70s jazz-funk',
    why: 'A sawtooth through a strongly resonant filter that the envelope sweeps open.',
    keys: [
      { label: 'RESONANCE high', chapter: 6 },
      { label: 'ENVELOPE', chapter: 7 },
    ],
  },
  {
    era: '’70s P-Funk',
    why: 'A wide-open square with a sub underneath and long, slinky glides.',
    keys: [
      { label: 'CUTOFF open', chapter: 5 },
      { label: 'SUB MIX', chapter: 3 },
      { label: 'GLIDE long', chapter: 9 },
    ],
  },
  {
    era: '’80s art rock',
    why: 'A soft triangle with a sub octave, chorus shimmer and compression.',
    keys: [
      { label: '△ triangle', chapter: 2 },
      { label: 'chorus (MOD)', chapter: 10 },
      { label: 'COMP', chapter: 11 },
    ],
  },
  {
    era: '’90s industrial',
    why: 'A sawtooth with harmony voices and a high, squelchy resonance.',
    keys: [
      { label: 'VOICE on', chapter: 3 },
      { label: 'RESONANCE high', chapter: 6 },
      { label: 'ENVELOPE', chapter: 7 },
    ],
  },
  {
    era: '’90s rock',
    why: 'A square with voices, an open filter and some noise for grit.',
    keys: [
      { label: 'VOICE on', chapter: 3 },
      { label: 'NOISE MIX', chapter: 4 },
      { label: 'CUTOFF open', chapter: 5 },
    ],
  },
  {
    era: '2000s electronic',
    why: 'Notes that duck darker (negative envelope amount), slow swells and LFO movement.',
    keys: [
      { label: 'FILTER ENV AMT below noon', chapter: 7 },
      { label: 'AMP ENV', chapter: 8 },
      { label: 'MOD', chapter: 10 },
    ],
  },
]

export const learnCopy = {
  chaptersLabel: 'Chapters',
  progress: 'YOUR PROGRESS',
  progressText: (done: number, total: number) => `${done} of ${total} chapters done`,
  chapter: (n: number) => `CHAPTER ${n}`,
  hear: 'HEAR',
  see: 'SEE',
  do: 'DO',
  experiment: 'Experiment',
  optional: 'optional',
  stepNow: 'Not yet.',
  analogy: 'THINK OF IT LIKE THIS',
  honesty: 'HONEST ABOUT THE MODEL',
  takeaway: 'Takeaway:',
  setup: 'Set up the sound for this chapter',
  setupHint: 'Replaces your live-mode sound with this chapter’s starting point.',
  playRiff: (name: string) => `Play ${name}`,
  stopRiff: 'Stop riff',
  next: (title: string) => `Next: ${title}`,
  previous: (n: number, title: string) => `Chapter ${n}: ${title}`,
  nextHintDone: 'Nice work.',
  nextHint: (step: string) => `To continue: ${step.charAt(0).toLowerCase()}${step.slice(1)}`,
  finished: 'You finished every chapter. Keep exploring on the Play page.',
  toPlay: 'Back to Play',
  reset: 'Reset progress',
  pedal: 'The pedal',
  pedalHint: 'Highlighted controls matter in this chapter. The dim ones still work.',
  flowLink: 'See the full signal flow',
  recipeLoad: (code: string, name: string) => `Load ${code} ${name}`,
  recipeChapter: (n: number) => `ch. ${n}`,
  miniFlow: {
    label: 'The pedal in three steps',
    bass: 'Your bass',
    bassSub: 'plays a note',
    detective: 'Pitch detective',
    detectiveSub: 'finds which note',
    synth: 'Synth',
    synthSub: 'plays it back, its own way',
    off: 'synth off: you hear your clean bass',
    on: 'synth on',
  },
  additive: {
    title: 'Build a wave from sines',
    label: 'Harmonics',
    shapeLabel: 'Target wave',
    saw: 'Sawtooth',
    square: 'Square',
    readout: (n: number, shape: string) =>
      n === 1
        ? 'Just the note: a pure sine wave.'
        : `${n} harmonics added: getting closer to a ${shape.toLowerCase()}.`,
    sum: 'Sum so far',
    newest: 'Newest harmonic',
    target: 'Target',
    play: 'Build it step by step',
    pause: 'Pause',
  },
  lfo: {
    title: 'The LFO at work',
    off: 'MOD is at minimum, so nothing moves. Turn MOD up.',
    chorusOnly:
      'MOD BLEND is all chorus, so the cutoff stays still and the sound shimmers instead.',
    readout: (rate: string, oct: string) =>
      `The LFO swings ${rate} and moves the cutoff by up to ${oct}.`,
    dot: 'LFO',
    cutoff: 'cutoff',
  },
}
