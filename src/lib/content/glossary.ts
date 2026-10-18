/**
 * Glossary (docs/learning-content.md, Part C). Each entry: a definition of one or two
 * sentences, an optional tiny illustration, related terms, and where to see it (a chapter).
 * Definitions may use `[[term]]` links like the chapter copy.
 */
import type { IllustrationId } from '../learn/illustrations'

export interface GlossaryEntry {
  id: string
  term: string
  definition: string
  illustration?: IllustrationId
  /** Learn chapter that shows it. */
  chapter?: number
  related?: string[]
}

export const glossary: readonly GlossaryEntry[] = [
  {
    id: 'oscillator',
    term: 'Oscillator',
    definition:
      'The part of a synth that makes a repeating wave at a chosen pitch. Everything else in the synth shapes what the oscillator makes.',
    illustration: 'saw',
    chapter: 2,
    related: ['waveform', 'sub-oscillator'],
  },
  {
    id: 'waveform',
    term: 'Waveform',
    definition:
      'The shape one cycle of a sound draws over time. The shape decides which [[harmonic|harmonics]] the sound has, and so its character.',
    illustration: 'square',
    chapter: 2,
    related: ['sine', 'triangle', 'sawtooth', 'square'],
  },
  {
    id: 'sine',
    term: 'Sine wave',
    definition:
      'The purest wave: one frequency and no harmonics at all. It sounds soft and round, like a flute or a whistle.',
    illustration: 'sine',
    chapter: 2,
    related: ['harmonic'],
  },
  {
    id: 'triangle',
    term: 'Triangle wave',
    definition:
      'A wave with straight up-and-down slopes. It has only odd harmonics that fade quickly, so it sounds soft and smooth.',
    illustration: 'triangle',
    chapter: 2,
  },
  {
    id: 'sawtooth',
    term: 'Sawtooth wave',
    definition:
      'A wave that ramps up and drops sharply. It has every harmonic, so it sounds bright, buzzy and brassy: perfect raw material for a filter.',
    illustration: 'saw',
    chapter: 2,
  },
  {
    id: 'square',
    term: 'Square wave',
    definition:
      'A wave that jumps between two levels. It has only odd harmonics, which makes it sound hollow, woody and punchy.',
    illustration: 'square',
    chapter: 2,
  },
  {
    id: 'harmonic',
    term: 'Harmonic (overtone)',
    definition:
      'A quieter tone at a whole-number multiple of the note: 2×, 3×, 4× its frequency. Which harmonics are there, and how loud, is what makes a sound bright or dark.',
    illustration: 'harmonics',
    chapter: 2,
    related: ['fundamental', 'spectrum'],
  },
  {
    id: 'fundamental',
    term: 'Fundamental',
    definition: 'The lowest harmonic of a sound: the one that sets the pitch you hear.',
    illustration: 'harmonics',
    chapter: 2,
    related: ['harmonic'],
  },
  {
    id: 'frequency',
    term: 'Frequency (Hz)',
    definition:
      'How many times a wave repeats per second, counted in hertz (Hz). The open E string of a bass is about 41 Hz.',
    illustration: 'sine',
    chapter: 1,
    related: ['octave'],
  },
  {
    id: 'octave',
    term: 'Octave',
    definition:
      'The distance between a note and the note at twice (or half) its frequency. They sound like the same note, higher or lower.',
    illustration: 'octave',
    chapter: 1,
  },
  {
    id: 'sub-oscillator',
    term: 'Sub-oscillator',
    definition:
      'A second oscillator one octave below the main one. It adds weight under the note; SUB MIX blends it in.',
    illustration: 'octave',
    chapter: 3,
  },
  {
    id: 'noise',
    term: 'Noise',
    definition:
      'Random movement with no pitch, containing all frequencies at once. It sounds like hiss, breath or wind; NOISE MIX blends it in.',
    illustration: 'noise',
    chapter: 4,
  },
  {
    id: 'subtractive-synthesis',
    term: 'Subtractive synthesis',
    definition:
      'Making a sound by starting with a bright, harmonic-rich wave and taking away (filtering out) what you don’t want. The method behind classic Moog and ARP synths.',
    illustration: 'lowpass',
    chapter: 5,
    related: ['low-pass-filter'],
  },
  {
    id: 'low-pass-filter',
    term: 'Low-pass filter',
    definition:
      'A filter that lets low frequencies through and turns high ones down. Closing it makes the sound darker.',
    illustration: 'lowpass',
    chapter: 5,
    related: ['cutoff', 'resonance', 'pole'],
  },
  {
    id: 'cutoff',
    term: 'Cutoff',
    definition:
      'The frequency where a filter starts turning the sound down. On the pedal, the CUTOFF knob: lower is darker, higher is brighter.',
    illustration: 'lowpass',
    chapter: 5,
  },
  {
    id: 'resonance',
    term: 'Resonance',
    definition:
      'A boost right at the cutoff frequency, which makes the filter “sing”. High resonance gives the squelchy, vocal synth sound.',
    illustration: 'resonance',
    chapter: 6,
  },
  {
    id: 'pole',
    term: 'Pole · dB per octave',
    definition:
      'One stage of a filter. Each pole adds 6 dB per octave of slope; the pedal’s 4-pole filter is 24 dB per octave, steep and dramatic.',
    illustration: 'lowpass',
    chapter: 5,
  },
  {
    id: 'envelope',
    term: 'Envelope',
    definition:
      'An automatic movement that starts with every note, like a hand that turns a knob and lets go. The filter envelope moves the cutoff.',
    illustration: 'envelope',
    chapter: 7,
    related: ['attack-decay', 'envelope-amount', 'amp-envelope'],
  },
  {
    id: 'attack-decay',
    term: 'Attack · decay',
    definition:
      'The two halves of an envelope: attack is how long it takes to rise, decay how long it takes to fall back. The ENVELOPE knob sets both.',
    illustration: 'envelope',
    chapter: 7,
  },
  {
    id: 'envelope-amount',
    term: 'Envelope amount',
    definition:
      'How far, and in which direction, the envelope moves the cutoff. Above noon notes open brighter; below noon they duck darker.',
    illustration: 'envelope',
    chapter: 7,
  },
  {
    id: 'amp-envelope',
    term: 'Amp envelope (VCA)',
    definition:
      'An envelope that shapes the volume of each note instead of the brightness. On this pedal it sets the fade-in (AMP ENV).',
    illustration: 'swell',
    chapter: 8,
  },
  {
    id: 'lfo',
    term: 'LFO',
    definition:
      'Low-frequency oscillator: a wave too slow to hear that moves another control, such as the cutoff, back and forth.',
    illustration: 'lfo',
    chapter: 10,
    related: ['chorus'],
  },
  {
    id: 'chorus',
    term: 'Chorus',
    definition:
      'An effect that layers slightly delayed, wobbling copies of the sound, making it wider and shimmering.',
    illustration: 'chorus',
    chapter: 10,
  },
  {
    id: 'glide',
    term: 'Glide · portamento',
    definition: 'Sliding smoothly from one note’s pitch to the next instead of jumping.',
    illustration: 'glide',
    chapter: 9,
  },
  {
    id: 'monophonic',
    term: 'Monophonic',
    definition:
      'Plays one note at a time. The pedal (like classic synth basses) is monophonic, so it tracks single notes, not chords.',
    chapter: 0,
  },
  {
    id: 'pitch-tracking',
    term: 'Pitch tracking',
    definition:
      'Working out which note you play by measuring how fast your string vibrates. Low notes take longer, because one cycle of a low note lasts longer.',
    illustration: 'sine',
    chapter: 0,
  },
  {
    id: 'gate',
    term: 'Gate',
    definition:
      'Keeps the synth silent while you aren’t playing. GATE SENS. sets how soft a note can be and still open it.',
    illustration: 'gate',
    chapter: 11,
  },
  {
    id: 'compression',
    term: 'Compression · limiting',
    definition:
      'Turning loud parts down so loud and soft notes come out at a more even level. Pushed all the way, it becomes a limiter: nothing gets past a set level.',
    illustration: 'compression',
    chapter: 11,
  },
  {
    id: 'dry-wet',
    term: 'Dry · wet',
    definition:
      'Dry is your clean, unprocessed bass; wet is the processed (synth) sound. MIX blends the two.',
    chapter: 12,
    related: ['mix'],
  },
  {
    id: 'mix',
    term: 'Mix',
    definition:
      'The balance between dry and wet. Keeping some dry bass in the mix keeps the attack and definition of your playing.',
    chapter: 12,
  },
  {
    id: 'expression-pedal',
    term: 'Expression pedal',
    definition:
      'A rocking foot pedal plugged into the CTR jack. It morphs between two versions of a preset (heel and toe) as you rock it.',
  },
  {
    id: 'preset',
    term: 'Preset',
    definition:
      'A saved set of knob and button settings you can recall in one step. The pedal has eight, plus live mode.',
    chapter: 13,
  },
  {
    id: 'stereo',
    term: 'Stereo',
    definition:
      'Two channels, left and right, that can carry different sounds. In STEREO mode the pedal spreads the chorus and voices across both.',
    chapter: 12,
  },
  {
    id: 'aliasing',
    term: 'Aliasing (advanced)',
    definition:
      'Harsh, out-of-tune tones a digital synth makes when it tries to produce frequencies too high for its sample rate. Good oscillators are built to avoid it.',
  },
  {
    id: 'spectrum',
    term: 'Spectrum',
    definition:
      'A picture of which frequencies are in a sound and how loud each one is. Bars show the harmonics; the teal curve shows the filter.',
    illustration: 'harmonics',
    chapter: 5,
  },
  {
    id: 'spectrogram',
    term: 'Spectrogram',
    definition:
      'A spectrum over time, drawn as a heat map: time runs left to right, frequency bottom to top, and brightness shows loudness.',
  },
  {
    id: 'oscilloscope',
    term: 'Oscilloscope',
    definition:
      'A picture of the wave itself: how the speaker moves over time. A triggered scope waits for the same point of each cycle, so the wave stands still.',
    illustration: 'saw',
    chapter: 1,
  },
]

export const glossaryById: Record<string, GlossaryEntry> = Object.fromEntries(
  glossary.map((e) => [e.id, e]),
)

export const glossaryCopy = {
  title: 'Glossary',
  lede: 'Every synth word used in the app, in plain language.',
  see: (chapter: number) => `See it in chapter ${chapter}`,
  related: 'Related:',
}
