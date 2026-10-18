/**
 * Original riffs for the built-in player (docs/learning-content.md §D). No transcriptions of
 * existing songs. Positions are in beats; one loop is `beats` long.
 */
export interface RiffNote {
  beat: number
  midi: number
  /** Length in beats. */
  length: number
  velocity?: number
}

export interface Riff {
  id: string
  name: string
  /** What it shows off, for the picker. */
  shows: string
  bpm: number
  beats: number
  notes: RiffNote[]
}

const E1 = 28
const G1 = 31
const A1 = 33
const C2 = 36
const D2 = 38
const E2 = 40
const G2 = 43
const A2 = 45

const s = 0.25 // a sixteenth note

export const RIFFS: readonly Riff[] = [
  {
    id: 'funk-drop',
    name: 'Funk Drop',
    shows: 'Resonance, envelope, glide',
    bpm: 96,
    beats: 4,
    notes: [
      { beat: 0, midi: A1, length: 2 * s },
      { beat: 3 * s, midi: A1, length: s, velocity: 0.45 },
      { beat: 4 * s, midi: C2, length: s },
      { beat: 6 * s, midi: A1, length: 2 * s },
      { beat: 8 * s, midi: D2, length: s },
      { beat: 9 * s, midi: E2, length: s },
      { beat: 10 * s, midi: D2, length: s },
      { beat: 11 * s, midi: C2, length: s },
      { beat: 12 * s, midi: A1, length: 2 * s },
      { beat: 14 * s, midi: G1, length: s },
      { beat: 15 * s, midi: A1, length: s, velocity: 0.6 },
    ],
  },
  {
    id: 'octave-pump',
    name: 'Octave Pump',
    shows: 'Sub octave, plucky envelope',
    bpm: 112,
    beats: 4,
    notes: [0, 1, 2, 3].flatMap((b) => [
      { beat: b, midi: b < 2 ? A1 : G1, length: 0.4 },
      { beat: b + 0.5, midi: b < 2 ? A2 : G2, length: 0.4, velocity: 0.7 },
    ]),
  },
  {
    id: 'ghost-notes',
    name: 'Ghost Notes',
    shows: 'Compression, gate sensitivity',
    bpm: 90,
    beats: 4,
    notes: [
      { beat: 0, midi: E1, length: 2 * s, velocity: 1 },
      { beat: 2 * s, midi: E1, length: s, velocity: 0.15 },
      { beat: 3 * s, midi: E1, length: s, velocity: 0.15 },
      { beat: 4 * s, midi: G1, length: 2 * s, velocity: 0.9 },
      { beat: 7 * s, midi: A1, length: s, velocity: 0.2 },
      { beat: 8 * s, midi: A1, length: 3 * s, velocity: 1 },
      { beat: 11 * s, midi: A1, length: s, velocity: 0.15 },
      { beat: 12 * s, midi: G1, length: s, velocity: 0.8 },
      { beat: 14 * s, midi: E1, length: 2 * s, velocity: 0.9 },
    ],
  },
  {
    id: 'long-tones',
    name: 'Long Tones',
    shows: 'Filter sweeps, modulation, swells',
    bpm: 80,
    beats: 8,
    notes: [
      { beat: 0, midi: A1, length: 3.8 },
      { beat: 4, midi: E1 + 5, length: 3.8 },
    ],
  },
  {
    id: 'industrial',
    name: 'Industrial',
    shows: 'Voices, noise, aggressive saw',
    bpm: 120,
    beats: 4,
    notes: [
      ...[0, 0.5, 1, 1.5, 2, 2.5].map((beat) => ({ beat, midi: E1, length: 0.35 })),
      { beat: 3, midi: G1, length: 0.35 },
      { beat: 3.5, midi: A1 + 1, length: 0.35 },
    ],
  },
  {
    id: 'four-on-the-floor',
    name: 'Four on the Floor',
    shows: 'Ducking (negative envelope amount)',
    bpm: 124,
    beats: 4,
    notes: [0, 1, 2, 3].map((beat) => ({ beat, midi: beat < 3 ? A1 : C2, length: 0.9 })),
  },
  {
    id: 'held-e',
    name: 'Held E',
    shows: 'One steady note for every lesson',
    bpm: 60,
    beats: 4,
    notes: [{ beat: 0, midi: E1 + 12, length: 3.9 }],
  },
]

export const riffById = (id: string) => RIFFS.find((r) => r.id === id) ?? RIFFS[0]
