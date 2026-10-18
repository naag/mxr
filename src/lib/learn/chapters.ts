/**
 * Learn chapters as data (docs/learning-content.md Part B): what plays, what's shown, which
 * controls are in focus, how the pedal is set up, and the live goal checks. The words live in
 * `content/learn.ts`, one string per step here.
 */
import type { Source } from '../audio/audio.svelte'
import { valueOf, type MachineState } from '../pedal/machine'
import { clock, PARAM, stepIndex, type ParamId } from '../pedal/params'
import type { ControlId } from '../pedal/pedal.svelte'
import type { Patch, Shape } from '../pedal/presets'
import type { ScopeTap } from '../viz/computed'
import type { Observation } from './observe'

export type ChapterVisual =
  'pipeline' | 'chain' | 'scope' | 'spectrum' | 'envelope' | 'pitch' | 'meter' | 'additive' | 'lfo'

export interface CheckContext {
  state: MachineState
  obs: Observation
}

export type Check = (c: CheckContext) => boolean

export interface ChapterDef {
  n: number
  riff: string
  source?: Source
  /** Changes to the current sound when the learner presses "Set up this chapter". */
  setup?: { shape?: Shape; voiceOn?: boolean; values?: Partial<Patch['values']> }
  focus: ControlId[]
  visuals: ChapterVisual[]
  scopeTap?: ScopeTap
  scopeLayers?: boolean
  steps: Check[]
}

const v = (c: CheckContext, id: ParamId) => valueOf(c.state, PARAM[id])
const below =
  (id: ParamId, hour: number): Check =>
  (c) =>
    v(c, id) < clock(hour)
const atLeast =
  (id: ParamId, hour: number): Check =>
  (c) =>
    v(c, id) >= clock(hour)
const reached =
  (id: ParamId, hour: number): Check =>
  (c) =>
    c.obs.max[id] >= clock(hour)
const dipped =
  (id: ParamId, hour: number): Check =>
  (c) =>
    c.obs.min[id] < clock(hour)
const swept =
  (id: ParamId, range: number): Check =>
  (c) =>
    c.obs.max[id] - c.obs.min[id] >= range

const E1 = 28
const E2 = 40

export const CHAPTERS: readonly ChapterDef[] = [
  {
    n: 0,
    riff: 'funk-drop',
    focus: ['footswitch'],
    visuals: ['pipeline', 'scope'],
    scopeTap: 'out',
    steps: [(c) => c.obs.engagedToggles >= 2, (c) => c.obs.engagedToggles >= 2 && c.state.engaged],
  },
  {
    n: 1,
    riff: 'held-e',
    source: 'fretboard',
    setup: { shape: 'saw', values: { sub: 0, noise: 0, mod: 0, envelope: 0 } },
    focus: [],
    visuals: ['scope'],
    scopeTap: 'osc',
    steps: [(c) => c.obs.notes.includes(E1), (c) => c.obs.notes.includes(E2)],
  },
  {
    n: 2,
    riff: 'held-e',
    setup: { shape: 'saw', voiceOn: false, values: { sub: 0, noise: 0, cutoff: 1, envelope: 0 } },
    focus: ['shape'],
    visuals: ['spectrum', 'scope', 'additive'],
    scopeTap: 'osc',
    steps: [
      (c) => c.obs.shapes.includes('triangle'),
      (c) => c.obs.shapes.includes('square'),
      (c) => c.obs.shapes.length === 3 && c.state.current.shape === 'saw',
    ],
  },
  {
    n: 3,
    riff: 'held-e',
    setup: { shape: 'saw', voiceOn: false, values: { sub: 0, noise: 0, voiceMix: clock(12) } },
    focus: ['sub', 'voice', 'mix'],
    visuals: ['scope', 'spectrum'],
    scopeTap: 'osc',
    scopeLayers: true,
    steps: [atLeast('sub', 13), (c) => c.state.current.voiceOn, swept('voiceMix', 0.2)],
  },
  {
    n: 4,
    riff: 'held-e',
    setup: { values: { noise: 0 } },
    focus: ['voice', 'sub'],
    visuals: ['scope', 'spectrum'],
    scopeTap: 'osc',
    steps: [reached('noise', 14), (c) => reached('noise', 14)(c) && v(c, 'noise') <= clock(10)],
  },
  {
    n: 5,
    riff: 'held-e',
    setup: {
      shape: 'saw',
      values: { cutoff: clock(14), resonance: clock(8), envelope: 0, mod: 0, sub: 0 },
    },
    focus: ['cutoff'],
    visuals: ['spectrum', 'scope'],
    scopeTap: 'filter',
    steps: [dipped('cutoff', 9), (c) => dipped('cutoff', 9)(c) && v(c, 'cutoff') > clock(12)],
  },
  {
    n: 6,
    riff: 'held-e',
    setup: { shape: 'saw', values: { resonance: 0, envelope: 0, mod: 0 } },
    focus: ['resonance', 'cutoff'],
    visuals: ['spectrum', 'scope'],
    scopeTap: 'filter',
    steps: [
      atLeast('resonance', 14),
      (c) => atLeast('resonance', 14)(c) && swept('cutoff', 0.3)(c),
    ],
  },
  {
    n: 7,
    riff: 'funk-drop',
    setup: { values: { envelope: clock(11), envAmount: clock(15), mod: 0 } },
    focus: ['envelope', 'cutoff', 'voice'],
    visuals: ['envelope', 'spectrum'],
    steps: [
      (c) => c.obs.min.envelope > 0.005 && c.obs.min.envelope <= clock(9),
      reached('envelope', 15),
      below('envAmount', 12),
    ],
  },
  {
    n: 8,
    riff: 'long-tones',
    setup: { values: { ampEnv: 0 } },
    focus: ['voice', 'envelope'],
    visuals: ['envelope', 'scope'],
    scopeTap: 'amp',
    steps: [reached('ampEnv', 14), (c) => reached('ampEnv', 14)(c) && v(c, 'ampEnv') <= clock(9)],
  },
  {
    n: 9,
    riff: 'octave-pump',
    setup: { values: { glide: 0 } },
    focus: ['voice', 'resonance'],
    visuals: ['pitch'],
    steps: [atLeast('glide', 11), (c) => c.obs.notes.length >= 2],
  },
  {
    n: 10,
    riff: 'long-tones',
    setup: { values: { mod: 0, modBlend: clock(8) } },
    focus: ['mod', 'voice'],
    visuals: ['lfo', 'spectrum', 'scope'],
    scopeTap: 'out',
    steps: [atLeast('mod', 13), (c) => atLeast('mod', 13)(c) && v(c, 'modBlend') >= clock(14)],
  },
  {
    n: 11,
    riff: 'ghost-notes',
    setup: { values: { comp: 0 } },
    focus: ['shape', 'mix', 'cutoff', 'sub'],
    visuals: ['meter', 'pitch'],
    steps: [atLeast('comp', 14), swept('gateSens', 0.2), swept('outGain', 0.15)],
  },
  {
    n: 12,
    riff: 'funk-drop',
    setup: { values: { mix: clock(16), dryThru: 0 } },
    focus: ['mix', 'shape', 'envelope', 'mod'],
    visuals: ['chain', 'meter'],
    steps: [
      (c) => v(c, 'mix') >= clock(11) && v(c, 'mix') <= clock(13),
      (c) => stepIndex(PARAM.dryThru, v(c, 'dryThru')) === 1,
      (c) => stepIndex(PARAM.outMode, v(c, 'outMode')) === 2,
    ],
  },
  {
    n: 13,
    riff: 'funk-drop',
    focus: ['presets', 'footswitch'],
    visuals: ['spectrum', 'envelope'],
    steps: [(c) => c.obs.presets.filter((p) => p > 0).length >= 3],
  },
]

/** The patch a chapter's setup turns the current sound into. */
export function setupPatch(chapter: ChapterDef, current: Patch): Patch {
  const s = chapter.setup ?? {}
  return {
    ...current,
    shape: s.shape ?? current.shape,
    voiceOn: s.voiceOn ?? current.voiceOn,
    values: { ...current.values, ...s.values },
  }
}

export const isDone = (chapter: ChapterDef, c: CheckContext) => chapter.steps.every((s) => s(c))
