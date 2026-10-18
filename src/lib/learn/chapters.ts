/**
 * Learn chapters as data (docs/learning-content.md, Part B): which controls are in focus,
 * which visuals to show, the sound to start from and the live goal checks. The words live in
 * `content/learn.ts`, one entry per chapter with one step text per check.
 */
import type { ControlId } from '../pedal/pedal.svelte'
import { clock, PARAM, stepIndex, type ParamId, type PresetParamId } from '../pedal/params'
import { initialLivePatch, type Patch, type Shape } from '../pedal/presets'
import type { Check, Observation } from './goals'

export type Visual =
  | 'scope'
  | 'scope-osc'
  | 'scope-layers'
  | 'scope-amp'
  | 'scope-out'
  | 'spectrum'
  | 'envelope'
  | 'pitch'
  | 'meter'
  | 'additive'
  | 'lfo'
  | 'mini-flow'
  | 'flow'
  | 'recipes'

export interface ChapterDef {
  /** Controls to highlight on the pedal; the rest are dimmed but still work. */
  focus: ControlId[]
  visuals: Visual[]
  /** Starting sound (applied on request), as changes to a plain teaching patch. */
  setup?: { shape?: Shape; voiceOn?: boolean; values?: Partial<Record<PresetParamId, number>> }
  /** Riff that shows the idea off best. */
  riff: string
  checks: Check[]
  /** Steps needed to finish the chapter; later ones are optional extras. Default: all. */
  required?: number
}

const v = (o: Observation, id: ParamId) =>
  PARAM[id].global ? o.globals[id as keyof Observation['globals']] : o.values[id as PresetParamId]
const atMost =
  (id: ParamId, hour: number): Check =>
  (o) =>
    v(o, id) <= clock(hour) + 1e-6
const atLeast =
  (id: ParamId, hour: number): Check =>
  (o) =>
    v(o, id) >= clock(hour) - 1e-6
const step =
  (id: ParamId, index: number): Check =>
  (o) =>
    stepIndex(PARAM[id], v(o, id)) === index
const both =
  (...checks: Check[]): Check =>
  (o) =>
    checks.every((c) => c(o))

const E1 = 28
const E2 = 40
const A1 = 33
const A2 = 45

export const CHAPTERS: readonly ChapterDef[] = [
  // 0. What this pedal does
  {
    focus: ['footswitch'],
    visuals: ['mini-flow', 'scope-out'],
    riff: 'funk-drop',
    checks: [(o) => !o.engaged, (o) => o.engaged],
  },
  // 1. Sound is a wave
  {
    focus: [],
    visuals: ['scope'],
    setup: { values: { cutoff: clock(14) } },
    riff: 'held-e',
    checks: [(o) => o.note === E1, (o) => o.note === E2],
  },
  // 2. Shape = character
  {
    focus: ['shape'],
    visuals: ['additive', 'spectrum', 'scope-osc'],
    setup: { shape: 'triangle', values: { cutoff: 1 } },
    riff: 'held-e',
    checks: [(o) => o.shape === 'triangle', (o) => o.shape === 'saw', (o) => o.shape === 'square'],
  },
  // 3. Thicker: sub & voices
  {
    focus: ['sub', 'voice', 'mix'],
    visuals: ['scope-layers', 'spectrum'],
    setup: { values: { cutoff: clock(15) } },
    riff: 'octave-pump',
    checks: [atLeast('sub', 13), (o) => o.voiceOn, both((o) => o.voiceOn, atLeast('voiceMix', 15))],
  },
  // 4. Noise
  {
    focus: ['voice', 'sub', 'cutoff'],
    visuals: ['scope', 'spectrum'],
    setup: {},
    riff: 'held-e',
    checks: [
      atLeast('noise', 12),
      both(atLeast('noise', 11), atMost('cutoff', 9)),
      both(atLeast('noise', 11), atLeast('cutoff', 15)),
    ],
  },
  // 5. The filter
  {
    focus: ['shape', 'cutoff'],
    visuals: ['spectrum', 'scope'],
    setup: { values: { cutoff: clock(13) } },
    riff: 'held-e',
    checks: [(o) => o.shape === 'saw', atMost('cutoff', 9), atLeast('cutoff', 14)],
    required: 2,
  },
  // 6. Resonance
  {
    focus: ['resonance', 'cutoff'],
    visuals: ['spectrum', 'scope'],
    setup: { values: { cutoff: clock(11), resonance: clock(9) } },
    riff: 'long-tones',
    checks: [
      atLeast('resonance', 14),
      both(atLeast('resonance', 13), atMost('cutoff', 10)),
      both(atLeast('resonance', 13), atLeast('cutoff', 14)),
    ],
  },
  // 7. The filter envelope
  {
    focus: ['envelope', 'voice', 'cutoff'],
    visuals: ['envelope', 'spectrum'],
    setup: {
      values: {
        cutoff: clock(10),
        resonance: clock(13),
        envelope: clock(12),
        envAmount: clock(15),
      },
    },
    riff: 'funk-drop',
    checks: [
      both(atLeast('envelope', 8), atMost('envelope', 10)),
      atLeast('envelope', 15),
      both(atLeast('envelope', 8), atMost('envAmount', 11)),
    ],
  },
  // 8. The amp envelope
  {
    focus: ['voice', 'envelope'],
    visuals: ['envelope', 'scope-amp'],
    setup: { values: { cutoff: clock(14) } },
    riff: 'long-tones',
    checks: [atLeast('ampEnv', 14), atMost('ampEnv', 9)],
  },
  // 9. Glide
  {
    focus: ['voice', 'resonance'],
    visuals: ['pitch'],
    setup: { shape: 'square', values: { cutoff: clock(12), resonance: clock(12) } },
    riff: 'funk-drop',
    checks: [
      atLeast('glide', 13),
      both(atLeast('glide', 12), (o) => o.note === A1),
      both(atLeast('glide', 12), (o) => o.note === A2),
    ],
  },
  // 10. Modulation
  {
    focus: ['mod', 'voice'],
    visuals: ['lfo', 'spectrum'],
    setup: { values: { cutoff: clock(11), resonance: clock(13) } },
    riff: 'long-tones',
    checks: [
      atLeast('mod', 13),
      both(atLeast('mod', 12), atMost('modBlend', 8)),
      both(atLeast('mod', 12), atLeast('modBlend', 16)),
    ],
  },
  // 11. Dynamics & output
  {
    focus: ['shape', 'mix', 'cutoff', 'sub'],
    visuals: ['meter', 'scope-out'],
    setup: { values: { mix: clock(14) } },
    riff: 'ghost-notes',
    checks: [atLeast('comp', 14), (o) => o.riff === 'ghost-notes', atMost('gateSens', 9)],
  },
  // 12. Blend & routing
  {
    focus: ['mix', 'shape', 'envelope', 'mod'],
    visuals: ['flow', 'meter'],
    setup: { values: { sub: clock(10) } },
    riff: 'octave-pump',
    checks: [both(atLeast('mix', 11), atMost('mix', 13)), step('dryThru', 1), step('outMode', 2)],
  },
  // 13. Put it together
  {
    focus: ['presets', 'footswitch'],
    visuals: ['recipes'],
    riff: 'funk-drop',
    checks: [(o) => o.preset >= 1 && o.preset <= 4, (o) => o.preset >= 5, (o) => o.preset === 0],
  },
]

/** Steps a chapter needs before Next lights up. */
export const requiredSteps = (c: ChapterDef) => c.required ?? c.checks.length

/** A plain patch to teach from: sawtooth straight out, filter half open, nothing moving. */
export function teachingPatch(): Patch {
  const p = initialLivePatch()
  return {
    shape: 'saw',
    voiceOn: false,
    values: {
      ...p.values,
      mix: 1,
      sub: 0,
      noise: 0,
      cutoff: clock(13),
      resonance: clock(9),
      envelope: 0,
      envAmount: clock(14),
      mod: 0,
      modBlend: clock(9),
      ampEnv: 0,
      glide: 0,
      comp: 0,
      dryThru: 0,
      outGain: 0.5,
    },
  }
}

/** The chapter's starting sound, or null when it starts from whatever you have. */
export function setupPatch(c: ChapterDef): Patch | null {
  if (!c.setup) return null
  const base = teachingPatch()
  return {
    shape: c.setup.shape ?? base.shape,
    voiceOn: c.setup.voiceOn ?? base.voiceOn,
    values: { ...base.values, ...c.setup.values },
  }
}

/** The chapter that explains each parameter (Reference and glossary cross-links). */
export const CHAPTER_FOR_PARAM: Record<ParamId, number> = {
  mix: 12,
  cutoff: 5,
  envelope: 7,
  sub: 3,
  resonance: 6,
  mod: 10,
  voiceMix: 3,
  envAmount: 7,
  ampEnv: 8,
  noise: 4,
  glide: 9,
  modBlend: 10,
  comp: 11,
  gateSens: 11,
  dryThru: 12,
  outGain: 11,
  tracking: 0,
  outMode: 12,
}
