/**
 * Preset recipe cards (Presets view and Learn chapter 13). The inspirations paraphrase the
 * manual's preset descriptions (docs/pedal-reference.md §5); the knob values come from
 * `pedal/presets.ts` and are first-draft approximations until calibration (PLAN Phase 4b).
 */
import { clockLabel } from '../pedal/knob'
import { PARAM, type ParamId } from '../pedal/params'
import type { Patch } from '../pedal/presets'
import { shapeNames } from './controls'

const shapeGlyph = { triangle: '△', saw: '◿', square: '⊓' } as const

/** One ingredient: a control that matters in this preset, and the chapter that explains it. */
export interface RecipeKey {
  control: ParamId | 'shape' | 'voice'
  chapter: number
}

export interface PresetRecipe {
  /** Short era / style tag. */
  era: string
  /** Who and what inspired it (from the manual, in our words). */
  inspiration: string
  /** One line for the short card in Learn. */
  why: string
  /** "Why it sounds like this": the recipe explained, ingredient by ingredient. */
  explain: string
  keys: RecipeKey[]
  /** Riff that shows it off. */
  riff: string
  /** What the expression pedal does, when the preset has a toe sound. */
  expression?: string
}

export const presetRecipes: readonly PresetRecipe[] = [
  {
    era: '’80s pop',
    inspiration: 'Greg Phillinganes’ ARP 2600 synth bass on “Thriller”.',
    why: 'A bright sawtooth with a deep sub and a fast, plucky envelope.',
    explain:
      'The sawtooth has every harmonic, so there is plenty for the filter to work on. A short envelope flicks the filter open on each note and closes it again, which gives the quick “bow” at the start. SUB MIX past noon adds an octave underneath, so the line sounds big even when the filter is closed.',
    keys: [
      { control: 'shape', chapter: 2 },
      { control: 'sub', chapter: 3 },
      { control: 'envelope', chapter: 7 },
    ],
    riff: 'octave-pump',
  },
  {
    era: '’70s funk',
    inspiration: 'Stevie Wonder’s left-hand synth bass on the TONTO synthesizer.',
    why: 'A square wave, a resonant drop on every note and a touch of glide.',
    explain:
      'The square wave has only odd harmonics, so it sounds hollow and rubbery. A low cutoff plus resonance makes the filter sing at one spot, and the fast envelope sweeps that spot down after each note: the short, funky “drop”. A little glide smears the jumps between notes.',
    keys: [
      { control: 'shape', chapter: 2 },
      { control: 'resonance', chapter: 6 },
      { control: 'envelope', chapter: 7 },
      { control: 'glide', chapter: 9 },
    ],
    riff: 'funk-drop',
  },
  {
    era: '’70s jazz-funk',
    inspiration: 'Herbie Hancock’s ARP Odyssey on “Chameleon”.',
    why: 'A sawtooth through a strongly resonant filter that the envelope sweeps open.',
    explain:
      'Resonance near 3 o’clock gives the filter a sharp, vocal peak. The envelope moves the cutoff, and with it that peak, through the sawtooth’s harmonics on every note, so each note “talks” (a wah-like “yow”). The cutoff knob itself sits low, so between notes the sound stays dark.',
    keys: [
      { control: 'cutoff', chapter: 5 },
      { control: 'resonance', chapter: 6 },
      { control: 'envelope', chapter: 7 },
    ],
    riff: 'funk-drop',
  },
  {
    era: '’70s P-Funk',
    inspiration: 'Bernie Worrell’s Minimoog bass on “Flashlight”.',
    why: 'A wide-open square with a sub underneath and long, slinky glides.',
    explain:
      'With the cutoff far open and the envelope off, the filter barely changes the sound: you hear the whole, fat square wave. The sub doubles it an octave down. Long glide makes every note slide into the next, the slinky Moog-bass feel.',
    keys: [
      { control: 'cutoff', chapter: 5 },
      { control: 'sub', chapter: 3 },
      { control: 'glide', chapter: 9 },
    ],
    riff: 'funk-drop',
  },
  {
    era: '’80s art rock',
    inspiration: 'Tony Levin’s bass on “Sledgehammer”: analog octave, compression, chorus.',
    why: 'A soft triangle with a sub octave, chorus shimmer and compression.',
    explain:
      'The triangle has few, quiet harmonics, so it’s soft and round, close to an octave pedal. The sub adds the octave below. MOD with the blend toward chorus adds a gentle shimmer that widens it, and heavy compression keeps every note at the same, punchy level.',
    keys: [
      { control: 'shape', chapter: 2 },
      { control: 'sub', chapter: 3 },
      { control: 'mod', chapter: 10 },
      { control: 'comp', chapter: 11 },
    ],
    riff: 'octave-pump',
  },
  {
    era: '’90s industrial',
    inspiration: 'The distorted synth bass on Björk’s “Army of Me”.',
    why: 'A sawtooth with harmony voices and a high, squelchy resonance.',
    explain:
      'VOICE stacks a fifth and an octave on top of the sawtooth, so even one note sounds like a thick chord. Resonance at noon and a medium envelope add some squelch, and compression keeps it in your face. The manual suggests an expression pedal for intensity: the toe opens the filter and pushes the resonance for a brighter, angrier sound.',
    keys: [
      { control: 'voice', chapter: 3 },
      { control: 'cutoff', chapter: 5 },
      { control: 'comp', chapter: 11 },
    ],
    riff: 'industrial',
    expression: 'Toe down opens CUTOFF and raises RESONANCE: rock it for intensity.',
  },
  {
    era: '’90s rock',
    inspiration: 'Trent Reznor’s synth bass on “Head Like a Hole”.',
    why: 'A square with voices, an open filter and some noise for grit.',
    explain:
      'The square wave with harmony voices is already big; the cutoff near noon keeps much of its buzz. NOISE MIX adds a layer of hiss that makes the attack gritty and aggressive. It works for a rock band or a dance track.',
    keys: [
      { control: 'voice', chapter: 3 },
      { control: 'noise', chapter: 4 },
      { control: 'cutoff', chapter: 5 },
    ],
    riff: 'industrial',
  },
  {
    era: '2000s electronic',
    inspiration: 'The sidechain “pumping” of deadmau5-style dance music.',
    why: 'Notes that duck darker (negative envelope amount), slow swells and LFO movement.',
    explain:
      'FILTER ENV AMT below noon turns the envelope upside down: each note starts dark and then opens up, like the mix ducking under a kick drum. A slow amp envelope makes each note swell in. MOD, blended toward the filter LFO, keeps the sound moving.',
    keys: [
      { control: 'envAmount', chapter: 7 },
      { control: 'ampEnv', chapter: 8 },
      { control: 'mod', chapter: 10 },
      { control: 'modBlend', chapter: 10 },
    ],
    riff: 'four-on-the-floor',
  },
]

export const presetsCopy = {
  galleryLabel: 'Factory presets',
  bank: { green: 'Green bank', red: 'Red bank' },
  inspiredBy: 'Inspired by',
  whyTitle: 'Why it sounds like this',
  ingredients: 'Key ingredients',
  knobs: 'Main knobs',
  shapeVoice: (shape: string, voice: boolean) => `${shape} · VOICE ${voice ? 'on' : 'off'}`,
  expression: 'Expression',
  load: (code: string, name: string) => `Load ${code} ${name}`,
  loaded: 'Loaded',
  listen: (riff: string) => `Load and play ${riff}`,
  stop: 'Stop',
  chapter: (n: number) => `ch. ${n}`,
  draft:
    'The knob positions are our first guesses from the manual’s descriptions. They’ll be checked against a real pedal.',
  edited: 'edited',
  voiceOn: 'VOICE on',
  voiceOff: 'VOICE off',
}

/** Chip text for an ingredient, read from the preset itself: "RESONANCE 3 o’clock". */
export function recipeKeyLabel(key: RecipeKey, patch: Patch): string {
  if (key.control === 'shape')
    return `${shapeGlyph[patch.shape]} ${shapeNames[patch.shape].toLowerCase()}`
  if (key.control === 'voice') return patch.voiceOn ? presetsCopy.voiceOn : presetsCopy.voiceOff
  const v = patch.values[key.control as keyof Patch['values']]
  const p = PARAM[key.control]
  return `${p.label} ${v <= 0.005 && p.id === 'envelope' ? 'off' : clockLabel(v)}`
}
