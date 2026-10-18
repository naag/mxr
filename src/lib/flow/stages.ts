/**
 * The signal-flow diagram as data (docs/pedal-reference.md §9): the stages in signal order,
 * the taps that show each stage's wave, the knobs that act on it, and which stages and
 * modulators are doing anything with the current settings.
 */
import type { PedalSettings } from '../audio/dsp/pedal-dsp'
import { PARAM, stepIndex, type ParamId, type Stage } from '../pedal/params'
import type { TapId } from '../viz/computed'
import type { BlockId } from '../viz/links'

export type StageId =
  'input' | 'tracking' | 'osc' | 'filter' | 'amp' | 'chorus' | 'comp' | 'gate' | 'mix' | 'out'

export type ModId = 'glide' | 'filterEnv' | 'lfo' | 'ampEnv'

/** Where a stage's wave comes from: a DSP tap, or a sine at the tracked pitch. */
export type WaveSource = TapId | 'pitch'

export interface StageDef {
  id: StageId
  /** Letter from the reference diagram (ⓐ–ⓖ), or a short tag for the ends. */
  letter: string
  color: Stage
  waveIn: WaveSource
  waveOut: WaveSource
  /** 'cycles' shows a couple of periods; 'note' shows the level over the whole note. */
  view: 'cycles' | 'note'
  params: ParamId[]
  mods: ModId[]
  /** Block of the Play view's signal-chain strip. */
  block: BlockId
}

export const STAGES: readonly StageDef[] = [
  {
    id: 'input',
    letter: 'IN',
    color: 'input',
    waveIn: 'dry',
    waveOut: 'dry',
    view: 'cycles',
    params: [],
    mods: [],
    block: 'input',
  },
  {
    id: 'tracking',
    letter: 'a',
    color: 'input',
    waveIn: 'dry',
    waveOut: 'pitch',
    view: 'cycles',
    params: ['tracking', 'gateSens'],
    mods: [],
    block: 'tracking',
  },
  {
    id: 'osc',
    letter: 'b',
    color: 'osc',
    waveIn: 'pitch',
    waveOut: 'osc',
    view: 'cycles',
    params: ['sub', 'voiceMix', 'noise'],
    mods: ['glide'],
    block: 'osc',
  },
  {
    id: 'filter',
    letter: 'c',
    color: 'filter',
    waveIn: 'osc',
    waveOut: 'filter',
    view: 'cycles',
    params: ['cutoff', 'resonance'],
    mods: ['filterEnv', 'lfo'],
    block: 'filter',
  },
  {
    id: 'amp',
    letter: 'd',
    color: 'env',
    waveIn: 'filter',
    waveOut: 'amp',
    view: 'note',
    params: ['ampEnv'],
    mods: ['ampEnv'],
    block: 'amp',
  },
  {
    id: 'chorus',
    letter: 'e',
    color: 'mod',
    waveIn: 'amp',
    waveOut: 'chorus',
    view: 'cycles',
    params: ['mod', 'modBlend'],
    mods: [],
    block: 'fx',
  },
  {
    id: 'comp',
    letter: 'f',
    color: 'dyn',
    waveIn: 'chorus',
    waveOut: 'fx',
    view: 'note',
    params: ['comp'],
    mods: [],
    block: 'dyn',
  },
  {
    id: 'gate',
    letter: 'g',
    color: 'dyn',
    waveIn: 'fx',
    waveOut: 'fx',
    view: 'note',
    params: ['gateSens'],
    mods: [],
    block: 'dyn',
  },
  {
    id: 'mix',
    letter: 'M',
    color: 'dyn',
    waveIn: 'fx',
    waveOut: 'out',
    view: 'cycles',
    params: ['mix', 'dryThru'],
    mods: [],
    block: 'mix',
  },
  {
    id: 'out',
    letter: 'OUT',
    color: 'dyn',
    waveIn: 'out',
    waveOut: 'out',
    view: 'cycles',
    params: ['outGain', 'outMode'],
    mods: [],
    block: 'out',
  },
]

export const STAGE: Record<StageId, StageDef> = Object.fromEntries(
  STAGES.map((s) => [s.id, s]),
) as Record<StageId, StageDef>

export const MOD_PARAMS: Record<ModId, ParamId[]> = {
  glide: ['glide'],
  filterEnv: ['envelope', 'envAmount'],
  lfo: ['mod', 'modBlend'],
  ampEnv: ['ampEnv'],
}

export const MOD_COLOR: Record<ModId, Stage> = {
  glide: 'osc',
  filterEnv: 'env',
  lfo: 'mod',
  ampEnv: 'env',
}

export type Status = 'on' | 'off' | 'bypassed'

export type OutputMode = 'mono' | 'wetdry' | 'stereo'

export interface FlowState {
  stages: Record<StageId, Status>
  mods: Record<ModId, boolean>
  /** DRY THRU FX: the clean bass also feeds the filter. */
  dryThru: boolean
  outputMode: OutputMode
}

const ON = 0.005

/** What is active with these settings. Pure, so the diagram's states are unit-tested. */
export function flowState({ patch, globals, engaged }: PedalSettings): FlowState {
  const v = patch.values
  const synth: Status = engaged ? 'on' : 'bypassed'
  const unless = (on: boolean): Status => (!engaged ? 'bypassed' : on ? 'on' : 'off')
  return {
    stages: {
      input: 'on',
      tracking: synth,
      osc: synth,
      filter: synth,
      amp: synth,
      // MOD BLEND fully right sends all of MOD to the LFO, leaving the chorus idle.
      chorus: unless(v.mod > ON && v.modBlend < 1 - ON),
      comp: unless(v.comp > ON),
      gate: synth,
      mix: synth,
      out: 'on',
    },
    mods: {
      glide: engaged && v.glide > ON,
      filterEnv: engaged && v.envelope > ON && Math.abs(v.envAmount - 0.5) > 0.01,
      lfo: engaged && v.mod > ON && v.modBlend > ON,
      ampEnv: engaged && v.ampEnv > ON,
    },
    dryThru: engaged && stepIndex(PARAM.dryThru, v.dryThru) === 1,
    outputMode: (['mono', 'wetdry', 'stereo'] as const)[stepIndex(PARAM.outMode, globals.outMode)],
  }
}
