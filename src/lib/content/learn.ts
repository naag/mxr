/**
 * Learn chapters (docs/learning-content.md Part B). `[[term]]` or `[[term|words]]` links to a
 * glossary entry (content/glossary.ts). The checks behind each step are in learn/chapters.ts.
 */

export interface ChapterCopy {
  topic: string
  title: string
  intro: string
  hear: string
  see: string
  do: string
  steps: string[]
  analogy?: string
  more?: { title: string; text: string }
  honesty?: string
  takeaway: string
}

export const learnCopy = {
  kicker: (n: number, topic: string) => `Chapter ${n} · ${topic}`,
  chaptersLabel: 'Chapters',
  hear: 'Hear',
  see: 'See',
  do: 'Do',
  setup: 'Set up this chapter',
  setupHint: 'Sets the knobs for this experiment and starts the sound.',
  experiment: 'Experiment',
  stepDone: 'done',
  stepTodo: 'to do',
  analogy: 'Think of it like this',
  takeaway: 'Takeaway:',
  honesty: 'Honest note:',
  previous: (title: string) => `Previous: ${title}`,
  next: (title: string) => `Next: ${title}`,
  finish: 'Finish: explore the presets',
  nextLocked: 'Finish the experiment to go on, or pick any chapter from the list.',
  nextReady: 'Nice work. On to the next one.',
  chapterDone: 'Chapter done',
  progress: (done: number, total: number) => `${done} of ${total} chapters done`,
  focusHint: 'The controls for this chapter are lit; the others are dimmed but still work.',
  pipeline: {
    label: 'What the pedal does',
    bass: 'Your bass',
    detective: 'Pitch detective',
    synth: 'Synth',
    bypassed: 'Footswitch off: you hear only your bass.',
    engaged: 'Footswitch on: the synth plays the note it heard.',
  },
  additive: {
    title: 'Build a wave from sine waves',
    shape: 'Target wave',
    shapes: { saw: 'Sawtooth', square: 'Square', triangle: 'Triangle' },
    harmonics: 'Harmonics',
    fewer: 'Fewer harmonics',
    more: 'More harmonics',
    play: 'Build it step by step',
    stop: 'Stop',
    readout: (shape: string, n: number, used: number) =>
      `${shape} from ${used} sine ${used === 1 ? 'wave' : 'waves'} (harmonics 1 to ${n})`,
    sum: 'Sum so far',
    target: 'Target',
    newest: 'Newest harmonic',
  },
  lfo: {
    title: 'The LFO: a slow, invisible knob-turner',
    off: 'MOD is at minimum, so nothing moves. Turn MOD up to see the LFO.',
    chorusOnly:
      'MOD BLEND is all chorus, so the LFO isn’t moving the filter. Hold VOICE and turn MOD right.',
    readout: (rate: number, oct: number) =>
      `The LFO swings ${rate.toFixed(1)} times a second and moves the cutoff up and down by ${oct.toFixed(1)} octaves.`,
    cutoff: 'cutoff',
  },
} as const

export const chapterCopy: ChapterCopy[] = [
  {
    topic: 'The big picture',
    title: 'What this pedal does',
    intro:
      'The pedal listens to the note you play and plays a [[synthesizer|synth]] at the same pitch. Your bass becomes the keyboard.',
    hear: 'A funky bass riff. Tap the footswitch to switch between your clean bass and the synth.',
    see: 'Three steps: your bass, a pitch detective that works out the note, and the synth.',
    do: 'Tap the footswitch a few times and compare. End with the synth on.',
    steps: ['Turn the synth off and on again with the footswitch', 'Leave the synth on'],
    analogy:
      'A singer who copies every note you hum, a split second later, but in a completely different voice.',
    more: {
      title: 'Tell me more: why low notes take longer',
      text: 'To know a note, the pedal has to see the string vibrate at least once. A low E (41 Hz) takes about 24 ms per vibration, so it needs a moment longer than high notes. That is what [[pitch-tracking|TRACKING]] tunes. The pedal follows one note at a time ([[monophonic]]), so play single notes, not chords.',
    },
    takeaway: 'It’s a synth that your bass plays, one note at a time.',
  },
  {
    topic: 'Sound',
    title: 'Sound is a wave',
    intro:
      'Every sound is air moving back and forth. How fast the wave repeats is the pitch ([[frequency]]); how tall it is, the loudness.',
    hear: 'The notes you play on the fretboard at the bottom of the page.',
    see: 'The [[oscilloscope]]: it draws the wave and holds it still so you can look at it.',
    do: 'Press Start sound, then play the open E string and the E at the 12th fret.',
    steps: ['Play the open E string (E1)', 'Play the 12th fret on the E string (E2)'],
    analogy: 'A jump rope: swing it faster and the loops get shorter. Same rope, higher note.',
    more: {
      title: 'Tell me more: Hz and octaves',
      text: 'Hertz (Hz) counts repeats per second. The open E repeats 41 times a second, the 12th fret 82 times. Doubling the speed is one [[octave]] up, which is why the 12th-fret wave looks half as wide.',
    },
    takeaway: 'One octave up means the wave repeats twice as fast.',
  },
  {
    topic: 'Wave shapes',
    title: 'Shape = character',
    intro:
      'Different [[waveform|wave shapes]] sound different because they contain different [[harmonic|harmonics]]: quieter tones at 2×, 3×, 4× the note.',
    hear: 'A held E. Press SHAPE to change the wave.',
    see: 'The [[spectrum]] shows each harmonic as a bar. Below it, build a wave from sine waves yourself.',
    do: 'Press SHAPE to hear and see all three waves, then come back to the sawtooth.',
    steps: ['Try the triangle △', 'Try the square ⊓', 'Come back to the sawtooth ◿'],
    analogy:
      'The same note on a flute, a trumpet and a clarinet: same pitch, different recipe of harmonics.',
    more: {
      title: 'Tell me more: the three shapes',
      text: '[[triangle|Triangle]]: few, quickly fading odd harmonics, so it sounds soft. [[sawtooth|Sawtooth]]: every harmonic, so it sounds bright and buzzy. [[square|Square]]: only the odd ones, so it sounds hollow and woody.',
    },
    takeaway: 'The wave shape is the raw material. Harmonics are what the filter will carve.',
  },
  {
    topic: 'Layers',
    title: 'Thicker: sub and voices',
    intro:
      'Playing extra waves at related pitches makes the sound bigger. A [[sub-oscillator|sub]] adds weight an octave below; voices add harmony above.',
    hear: 'A held E while you add layers.',
    see: 'The waveform split into its layers (main, sub, voices) and their sum.',
    do: 'Turn SUB MIX up. Press VOICE. Then hold VOICE and turn MIX (that is VOICE MIX).',
    steps: [
      'Turn SUB MIX past 1 o’clock',
      'Press VOICE to add the voices',
      'Hold VOICE and turn MIX to change VOICE MIX',
    ],
    analogy: 'One singer, then a choir: a bass singer underneath and two harmony singers on top.',
    honesty:
      'We don’t know exactly which notes VOICE adds on the real pedal. We use a fifth and an octave.',
    takeaway: 'Sub adds weight underneath. Voices add size and harmony on top.',
  },
  {
    topic: 'Noise',
    title: 'Noise',
    intro:
      '[[noise|Noise]] is random sound that contains every frequency at once, like wind or a hiss.',
    hear: 'A held E while you blend in noise.',
    see: 'The wave turns fuzzy and the spectrum fills up evenly between the harmonics.',
    do: 'Hold VOICE and turn SUB MIX (that is NOISE MIX) way up, then back down to just a little.',
    steps: [
      'Hold VOICE and turn NOISE MIX past 2 o’clock',
      'Bring it back down to 10 o’clock or less',
    ],
    analogy: 'Breath on a flute: a little makes it real, a lot makes it a sound effect.',
    takeaway: 'A little noise adds air and attack. Lots of it is a sound effect.',
  },
  {
    topic: 'Subtractive synthesis',
    title: 'The filter: carving the sound',
    intro:
      'A sawtooth is bright because it is full of harmonics. A [[low-pass]] filter lets the low ones through and blocks the high ones above the [[cutoff]].',
    hear: 'A held E on a sawtooth. The envelope is off so the filter stays put.',
    see: 'Harmonics outside the teal curve fade out. The wave’s sharp edge rounds off.',
    do: 'Drag the CUTOFF knob down slowly, then back up. Listen as you go.',
    steps: ['Turn CUTOFF below 9 o’clock', 'Bring it back above noon'],
    analogy:
      'A blanket over a speaker. The bass gets through, the fizz doesn’t. Turning CUTOFF down adds thicker blankets.',
    more: {
      title: 'Tell me more: why “4-pole”?',
      text: 'The filter has four stages, called [[pole|poles]]. Each turns the sound down a bit more above the cutoff. Together they make it 24 dB quieter one octave above the cutoff, about 16 times quieter. That steep slope is the classic Moog sound.',
    },
    takeaway:
      'Start with a bright wave and carve it down. That is [[subtractive]] synthesis, and CUTOFF is the carving knife.',
  },
  {
    topic: 'Resonance',
    title: 'Resonance',
    intro:
      '[[resonance|Resonance]] boosts the frequencies right at the cutoff, so one part of the sound sings out.',
    hear: 'A held E. With resonance up, sweeping the cutoff says “wow”.',
    see: 'The filter curve grows a peak, and the harmonic nearest to it jumps up.',
    do: 'Turn RESONANCE to 2 o’clock, then sweep CUTOFF down and up again.',
    steps: ['Turn RESONANCE to 2 o’clock or more', 'Sweep CUTOFF while the resonance is up'],
    analogy: 'Blowing across a bottle: one pitch sings out.',
    honesty: 'High resonance can get loud. The app has a safety limiter, so it never gets painful.',
    takeaway: 'Cutoff and resonance together give the vocal, funky character.',
  },
  {
    topic: 'Movement',
    title: 'The filter envelope',
    intro:
      'An [[envelope]] is an automatic knob-turner that starts with every note. Here it opens the filter and lets it close again.',
    hear: 'The funky riff: each note “blooms” brighter, then settles.',
    see: 'The envelope graph shows the cutoff over one note. The spectrum moves along with it.',
    do: 'Try ENVELOPE short (9 o’clock) and long (3 o’clock). Then hold VOICE and turn CUTOFF (FILTER ENV AMT) below noon.',
    steps: [
      'Make ENVELOPE short: 9 o’clock or lower (not off)',
      'Make it long: 3 o’clock or higher',
      'Hold VOICE and turn CUTOFF below noon so notes duck darker',
    ],
    analogy: 'Someone else quickly turning your CUTOFF knob up and back down on every note.',
    more: {
      title: 'Tell me more: speed and amount',
      text: 'ENVELOPE sets how fast it moves ([[attack-decay|attack and decay]]). [[env-amount|FILTER ENV AMT]] sets how far and which way. Above noon it opens the filter; below noon it closes it, so notes duck darker.',
    },
    takeaway: 'Envelope speed is ENVELOPE. Depth and direction are FILTER ENV AMT.',
  },
  {
    topic: 'Note shape',
    title: 'The amp envelope',
    intro:
      'The [[amp-envelope|amp envelope]] shapes the volume of each note. Here it sets how slowly a note fades in.',
    hear: 'Long notes that swell in when AMP ENV is up.',
    see: 'The volume lane of the envelope graph, and the wave growing taller in the waveform.',
    do: 'Hold VOICE and turn ENVELOPE (that is AMP ENV) up to hear swells, then back down for punch.',
    steps: ['Hold VOICE and turn AMP ENV past 2 o’clock', 'Bring it back to 9 o’clock or lower'],
    analogy: 'A violinist starting a note slowly with the bow, instead of plucking it.',
    takeaway: 'Fade-in time turns plucks into pads.',
  },
  {
    topic: 'Glide',
    title: 'Glide',
    intro: '[[glide|Glide]] slides the pitch from one note to the next instead of jumping.',
    hear: 'An octave riff. With glide on, the notes swoop.',
    see: 'The pitch graph: steps turn into ramps.',
    do: 'Hold VOICE and turn RESONANCE (that is GLIDE) up, then play the riff.',
    steps: ['Hold VOICE and turn GLIDE to 11 o’clock or more', 'Play the riff or a few notes'],
    analogy: 'Sliding your finger along a fretless neck instead of jumping between frets.',
    takeaway: 'Glide gives the slinky, fretless, P-Funk vibe.',
  },
  {
    topic: 'Modulation',
    title: 'Movement: LFO and chorus',
    intro:
      'An [[lfo|LFO]] is a slow, invisible oscillator that moves another control. [[chorus|Chorus]] adds wobbling copies to make the sound wider.',
    hear: 'Long notes that start to shimmer and pulse.',
    see: 'A dot riding a slow wave, pushing the cutoff up and down.',
    do: 'Turn MOD up. Then hold VOICE and turn MOD (that is MOD BLEND) from chorus toward the LFO.',
    steps: ['Turn MOD to 1 o’clock or more', 'Hold VOICE and turn MOD BLEND to 2 o’clock or more'],
    analogy: 'A friend slowly turning your CUTOFF knob back and forth while you play.',
    honesty:
      'The manual doesn’t say how fast the LFO goes. We assume MOD speeds it up as you turn it.',
    takeaway: 'Modulation keeps sounds alive, from shimmer to pulse.',
  },
  {
    topic: 'Dynamics',
    title: 'Compression, gate and output',
    intro:
      '[[compression|Compression]] evens out loud and soft notes. The [[gate]] keeps the synth quiet when you’re not playing. Output gain sets the volume.',
    hear: 'A riff full of soft ghost notes.',
    see: 'The level meter and the compressor’s gain reduction. The pitch graph shows which soft notes start the synth.',
    do: 'Hold SHAPE and turn MIX (COMP), CUTOFF (GATE SENS.) and SUB MIX (OUTPUT GAIN).',
    steps: [
      'Hold SHAPE and turn COMP to 2 o’clock or more',
      'Hold SHAPE and move GATE SENS.',
      'Hold SHAPE and move OUTPUT GAIN',
    ],
    analogy: 'A sound engineer riding the volume fader so every note comes out equally loud.',
    takeaway: 'Compression means consistency and punch. The SLEDGE preset leans on it.',
  },
  {
    topic: 'Blend and routing',
    title: 'Blend and routing',
    intro:
      'Blending your clean bass ([[dry-wet|dry]]) with the synth ([[dry-wet|wet]]) keeps the definition of your playing. Routing decides where each signal goes.',
    hear: 'The funky riff while you change the blend.',
    see: 'The signal chain and the left/right levels.',
    do: 'Set MIX to noon. Hold SHAPE and turn ENVELOPE (DRY THRU FX) on, then MOD to STEREO.',
    steps: [
      'Set MIX between 11 and 1 o’clock',
      'Hold SHAPE and turn DRY THRU FX on',
      'Hold SHAPE and set OUTPUT MODE to STEREO',
    ],
    analogy: 'Mixing two microphones: one on your amp, one on the synth.',
    more: {
      title: 'Tell me more: the output modes',
      text: 'MONO sends everything to OUT. WET/DRY puts the synth on OUT and your clean bass on CTR, for two amps. [[stereo|STEREO]] spreads the effects across OUT and CTR. Use headphones to hear it.',
    },
    takeaway: 'Most real-world synth-bass tones are a blend.',
  },
  {
    topic: 'Putting it together',
    title: 'Read the presets',
    intro:
      'Every [[preset]] is a recipe made from the ideas in these chapters: a wave, a filter setting, an envelope and a bit of movement.',
    hear: 'The funky riff on each factory preset.',
    see: 'The spectrum and envelope change as you switch presets. Which chapter does each one lean on?',
    do: 'Tap PRESETS to step through at least three presets and listen.',
    steps: ['Try three or more presets'],
    analogy: 'Recipes in a cookbook: same ingredients, different amounts.',
    takeaway: 'You can now read any patch as a recipe, and build your own.',
  },
]
