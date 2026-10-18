/**
 * The signal-flow diagram's model (docs/pedal-reference.md §9): the stages from your bass to
 * the output, what each one shows going in and coming out, and which stages are doing
 * something with the current settings. Pure, so the Under-the-hood view and Learn chapter 12
 * share it and it's unit-tested in node.
 */
import { oscGains, type PedalSettings } from '../audio/dsp/pedal-dsp'
import { PARAM, stepIndex, type ParamId, type Stage } from '../pedal/params'
import type { ScopeTap, SnapshotTap } from './computed'
import type { BlockId } from './links'

export type FlowStageId =
  'input' | 'tracking' | 'osc' | 'filter' | 'amp' | 'chorus' | 'comp' | 'gate' | 'mix' | 'out'

/** A tap point, or `pitch`: a pure sine at the tracked note (what the tracker hands on). */
export type FlowTap = SnapshotTap | 'pitch'

export type ModId = 'glide' | 'filterEnv' | 'lfo' | 'ampEnv'

export interface FlowMod {
  id: ModId
  stage: Stage
  params: ParamId[]
}

export interface FlowStageDef {
  id: FlowStageId
  /** Stage letter from the reference diagram (ⓐ–ⓖ), or a short label. */
  letter: string
  stage: Stage
  /** Signal-chain block it belongs to (linked highlighting, links.ts). */
  block: BlockId
  inTap: FlowTap
  outTap: FlowTap
  /** The scope tap to focus when the stage is selected, if the scope has one. */
  scopeTap?: ScopeTap
  params: ParamId[]
  buttons?: ('shape' | 'voice')[]
  /** Side inputs that move this stage (envelopes, LFO, glide). */
  mods?: FlowMod[]
}

export const FLOW_STAGES: readonly FlowStageDef[] = [
  {
    id: 'input',
    letter: 'IN',
    stage: 'input',
    block: 'input',
    inTap: 'dry',
    outTap: 'dry',
    params: [],
  },
  {
    id: 'tracking',
    letter: 'a',
    stage: 'input',
    block: 'tracking',
    inTap: 'dry',
    outTap: 'pitch',
    params: ['tracking', 'gateSens'],
  },
  {
    id: 'osc',
    letter: 'b',
    stage: 'osc',
    block: 'osc',
    inTap: 'pitch',
    outTap: 'osc',
    scopeTap: 'osc',
    params: ['sub', 'voiceMix', 'noise'],
    buttons: ['shape', 'voice'],
    mods: [{ id: 'glide', stage: 'osc', params: ['glide'] }],
  },
  {
    id: 'filter',
    letter: 'c',
    stage: 'filter',
    block: 'filter',
    inTap: 'osc',
    outTap: 'filter',
    scopeTap: 'filter',
    params: ['cutoff', 'resonance'],
    mods: [
      { id: 'filterEnv', stage: 'env', params: ['envelope', 'envAmount'] },
      { id: 'lfo', stage: 'mod', params: ['mod', 'modBlend'] },
    ],
  },
  {
    id: 'amp',
    letter: 'd',
    stage: 'env',
    block: 'amp',
    inTap: 'filter',
    outTap: 'amp',
    scopeTap: 'amp',
    params: ['ampEnv'],
    mods: [{ id: 'ampEnv', stage: 'env', params: ['ampEnv'] }],
  },
  {
    id: 'chorus',
    letter: 'e',
    stage: 'mod',
    block: 'fx',
    inTap: 'amp',
    outTap: 'chorus',
    params: ['mod', 'modBlend'],
  },
  {
    id: 'comp',
    letter: 'f',
    stage: 'dyn',
    block: 'dyn',
    inTap: 'chorus',
    outTap: 'fx',
    params: ['comp'],
  },
  {
    id: 'gate',
    letter: 'g',
    stage: 'dyn',
    block: 'dyn',
    inTap: 'fx',
    outTap: 'fx',
    params: ['gateSens'],
  },
  {
    id: 'mix',
    letter: 'M',
    stage: 'dyn',
    block: 'mix',
    inTap: 'fx',
    outTap: 'out',
    scopeTap: 'out',
    params: ['mix', 'dryThru'],
  },
  {
    id: 'out',
    letter: 'OUT',
    stage: 'dyn',
    block: 'out',
    inTap: 'out',
    outTap: 'left',
    params: ['outGain', 'outMode'],
  },
]

export const FLOW_STAGE: Record<FlowStageId, FlowStageDef> = Object.fromEntries(
  FLOW_STAGES.map((s) => [s.id, s]),
) as Record<FlowStageId, FlowStageDef>

/** Why a stage (or side input) leaves the sound unchanged right now. */
export type Idle =
  | 'bypassed'
  | 'modOff'
  | 'allLfo'
  | 'compOff'
  | 'wetDry'
  | 'glideOff'
  | 'envOff'
  | 'envZero'
  | 'allChorus'
  | 'instant'

export type OutMode = 'mono' | 'wetDry' | 'stereo'
export type OscSource = 'main' | 'voices' | 'sub' | 'noise'

export interface FlowState {
  engaged: boolean
  stages: Record<FlowStageId, Idle | null>
  mods: Record<ModId, Idle | null>
  /** Oscillators that are audible in the mix. */
  sources: OscSource[]
  /** Where the clean bass goes: blended by MIX, out of the right channel, or nowhere. */
  dry: 'mix' | 'right' | 'muted' | 'bypass'
  /** DRY THRU FX: the clean bass also runs through filter, amp, chorus and compressor. */
  dryThru: boolean
  outMode: OutMode
}

const OFF = 0.005
const OUT_MODES: readonly OutMode[] = ['mono', 'wetDry', 'stereo']

export function flowState(settings: PedalSettings): FlowState {
  const { patch, globals, engaged } = settings
  const v = patch.values
  const outMode = OUT_MODES[stepIndex(PARAM.outMode, globals.outMode)]
  const g = oscGains(v, patch.voiceOn)
  const sources: OscSource[] = []
  if (g.main > 1e-3) sources.push('main')
  if (g.voice > 1e-3) sources.push('voices')
  if (g.sub > 1e-3) sources.push('sub')
  if (g.noise > 1e-3) sources.push('noise')

  const modOff = v.mod <= OFF
  const chorus: Idle | null = modOff ? 'modOff' : v.modBlend >= 1 - OFF ? 'allLfo' : null
  const stages: Record<FlowStageId, Idle | null> = {
    input: null,
    tracking: null,
    osc: null,
    filter: null,
    amp: null,
    chorus,
    comp: v.comp <= OFF ? 'compOff' : null,
    gate: null,
    mix: outMode === 'wetDry' ? 'wetDry' : null,
    out: null,
  }
  const mods: Record<ModId, Idle | null> = {
    glide: v.glide <= OFF ? 'glideOff' : null,
    filterEnv: v.envelope <= OFF ? 'envOff' : Math.abs(v.envAmount - 0.5) < 0.01 ? 'envZero' : null,
    lfo: modOff ? 'modOff' : v.modBlend <= OFF ? 'allChorus' : null,
    ampEnv: v.ampEnv <= 0.02 ? 'instant' : null,
  }
  if (!engaged) {
    for (const id of Object.keys(stages) as FlowStageId[]) {
      if (id !== 'input' && id !== 'out') stages[id] = 'bypassed'
    }
    for (const id of Object.keys(mods) as ModId[]) mods[id] = 'bypassed'
  }

  const dry: FlowState['dry'] = !engaged
    ? 'bypass'
    : outMode === 'wetDry'
      ? 'right'
      : v.mix >= 1 - OFF
        ? 'muted'
        : 'mix'
  return {
    engaged,
    stages,
    mods,
    sources,
    dry,
    dryThru: engaged && stepIndex(PARAM.dryThru, v.dryThru) === 1,
    outMode,
  }
}

/** Stages that light up when a signal-chain block is highlighted (pointing at a knob). */
export function stagesForBlocks(blocks: readonly BlockId[]): FlowStageId[] {
  return FLOW_STAGES.filter((s) => blocks.includes(s.block)).map((s) => s.id)
}
