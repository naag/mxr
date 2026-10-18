/**
 * Every parameter on the pedal: the six printed knobs, plus the VOICE and SHAPE layers you
 * reach by holding a button while turning a knob (docs/pedal-reference.md §3–4).
 * Values are always 0–1 (knob fully left to fully right); the mapping functions below turn
 * them into physical units for the audio engine and the readouts.
 */
import { clockLabel } from './knob'
import type { KnobId } from './layout'

export type Layer = 'main' | 'voice' | 'shape'
export type Stage = 'osc' | 'filter' | 'env' | 'mod' | 'dyn' | 'input'

export type ParamId =
  | 'mix'
  | 'cutoff'
  | 'envelope'
  | 'sub'
  | 'resonance'
  | 'mod'
  | 'voiceMix'
  | 'envAmount'
  | 'ampEnv'
  | 'noise'
  | 'glide'
  | 'modBlend'
  | 'comp'
  | 'gateSens'
  | 'dryThru'
  | 'outGain'
  | 'tracking'
  | 'outMode'

export type GlobalParamId = 'gateSens' | 'tracking' | 'outMode'
export type PresetParamId = Exclude<ParamId, GlobalParamId>

export interface ParamDef {
  id: ParamId
  knob: KnobId
  layer: Layer
  /** As printed on the pedal or in the manual's secondary-parameter diagram. */
  label: string
  /** Accessible name. */
  name: string
  stage: Stage
  /** Value in live mode at first start. */
  initial: number
  /** Stepped controls snap to these positions (evenly spaced across the sweep). */
  steps?: readonly string[]
  /** End-of-sweep legends for continuous controls that the manual labels (COMP). */
  legends?: readonly [string, string]
  /** Shared by all presets (manual: "global"). */
  global: boolean
  /** Can be morphed by an expression pedal (VOICE layer and the printed knobs). */
  expressionable: boolean
}

/** Converts a clock position (7 = fully left, 12 = noon, 17 = 5 o’clock) to a 0–1 value. */
export const clock = (hour: number) => Math.round(((hour - 7) / 10) * 1000) / 1000

const def = (
  id: ParamId,
  knob: KnobId,
  layer: Layer,
  label: string,
  name: string,
  stage: Stage,
  initial: number,
  extra: Partial<Pick<ParamDef, 'steps' | 'legends' | 'global'>> = {},
): ParamDef => ({
  id,
  knob,
  layer,
  label,
  name,
  stage,
  initial,
  global: extra.global ?? false,
  steps: extra.steps,
  legends: extra.legends,
  expressionable: layer !== 'shape',
})

export const PARAMS: readonly ParamDef[] = [
  def('mix', 'mix', 'main', 'MIX', 'Mix', 'dyn', clock(14)),
  def('cutoff', 'cutoff', 'main', 'CUTOFF', 'Cutoff', 'filter', clock(11)),
  def('envelope', 'envelope', 'main', 'ENVELOPE', 'Envelope', 'env', clock(10)),
  def('sub', 'sub', 'main', 'SUB MIX', 'Sub mix', 'osc', clock(11)),
  def('resonance', 'resonance', 'main', 'RESONANCE', 'Resonance', 'filter', clock(12)),
  def('mod', 'mod', 'main', 'MOD', 'Mod', 'mod', clock(9)),
  def('voiceMix', 'mix', 'voice', 'VOICE MIX', 'Voice mix', 'osc', clock(12)),
  def('envAmount', 'cutoff', 'voice', 'FILTER ENV AMT', 'Filter envelope amount', 'env', clock(14)),
  def('ampEnv', 'envelope', 'voice', 'AMP ENV', 'Amp envelope', 'env', 0),
  def('noise', 'sub', 'voice', 'NOISE MIX', 'Noise mix', 'osc', 0),
  def('glide', 'resonance', 'voice', 'GLIDE', 'Glide', 'osc', 0),
  def('modBlend', 'mod', 'voice', 'MOD BLEND', 'Mod blend', 'mod', clock(9)),
  def('comp', 'mix', 'shape', 'COMP', 'Compression', 'dyn', clock(9), {
    legends: ['OFF', 'LIMIT'],
  }),
  def('gateSens', 'cutoff', 'shape', 'GATE SENS.', 'Gate sensitivity', 'input', 0.5, {
    global: true,
  }),
  def('dryThru', 'envelope', 'shape', 'DRY THRU FX', 'Dry through effects', 'dyn', 0, {
    steps: ['OFF', 'ON'],
  }),
  def('outGain', 'sub', 'shape', 'OUTPUT GAIN', 'Output gain', 'dyn', 0.5),
  def('tracking', 'resonance', 'shape', 'TRACKING', 'Tracking', 'input', 0, {
    steps: ['5S', '4S', 'GTR'],
    global: true,
  }),
  def('outMode', 'mod', 'shape', 'OUTPUT MODE', 'Output mode', 'dyn', 0, {
    steps: ['MONO', 'WET/DRY', 'STEREO'],
    global: true,
  }),
]

export const PARAM: Record<ParamId, ParamDef> = Object.fromEntries(
  PARAMS.map((p) => [p.id, p]),
) as Record<ParamId, ParamDef>

export const PRESET_PARAM_IDS = PARAMS.filter((p) => !p.global).map((p) => p.id) as PresetParamId[]
export const GLOBAL_PARAM_IDS = PARAMS.filter((p) => p.global).map((p) => p.id) as GlobalParamId[]

const byKnobAndLayer = new Map(PARAMS.map((p) => [`${p.knob}/${p.layer}`, p]))

/** The parameter a knob controls in the given layer. */
export function paramAt(knob: KnobId, layer: Layer): ParamDef {
  const p = byKnobAndLayer.get(`${knob}/${layer}`)
  if (!p) throw new Error(`no parameter on ${knob} in the ${layer} layer`)
  return p
}

/** Index of the current position of a stepped control. */
export function stepIndex(p: ParamDef, value: number): number {
  if (!p.steps) return 0
  return Math.round(Math.min(1, Math.max(0, value)) * (p.steps.length - 1))
}

/** Clamps to 0–1 and snaps stepped controls to their detents. */
export function normalize(p: ParamDef, value: number): number {
  const v = Math.min(1, Math.max(0, value))
  if (!p.steps) return v
  return stepIndex(p, v) / (p.steps.length - 1)
}

// --- Physical mappings (ASSUMPTIONS documented in docs/pedal-reference.md §3–4) ---

/** CUTOFF: 40 Hz … 10.2 kHz, exponential over 8 octaves. */
export const cutoffHz = (v: number) => 40 * 2 ** (8 * v)

/** RESONANCE: ladder feedback 0 … 3.9 (4 would self-oscillate). */
export const resonanceFeedback = (v: number) => 3.9 * v

/** ENVELOPE: off at minimum; one knob scales attack and decay together. */
export function envelopeTimes(v: number): { attackMs: number; decayMs: number } | null {
  if (v <= 0.005) return null
  return { attackMs: 300 ** v, decayMs: 60 * 50 ** v }
}

/** MOD: depth 0–1 and LFO rate 0.3 … 6 Hz (ASSUMPTION: rate rises with the knob). */
export const modDepthRate = (v: number) => ({ depth: v, rateHz: 0.3 * 20 ** v })

/** FILTER ENV AMT: −5 … +5 octaves, 0 at noon. */
export const envAmountOctaves = (v: number) => (v - 0.5) * 10

/** AMP ENV: fade-in 1 ms … 1.5 s. */
export const ampAttackMs = (v: number) => 1500 ** v

/** GLIDE: off at minimum, then 5 ms … 1 s in the pitch domain. */
export const glideMs = (v: number) => (v <= 0.005 ? 0 : 5 * 200 ** v)

/** OUTPUT GAIN: ±18 dB, 0 dB at noon. */
export const outGainDb = (v: number) => (v - 0.5) * 36

// --- Readouts ---

const ms = (t: number) => (t >= 1000 ? `${(t / 1000).toFixed(2)} s` : `${Math.round(t)} ms`)
const hz = (f: number) => (f >= 1000 ? `${(f / 1000).toFixed(1)} kHz` : `${Math.round(f)} Hz`)
const pct = (v: number) => `${Math.round(v * 100)}%`
const signed = (n: number, digits: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(digits)}`

/** Short physical readout, e.g. "211 Hz", "attack 10 ms, decay 290 ms", "STEREO". */
export function formatValue(id: ParamId, v: number): string {
  const p = PARAM[id]
  if (p.steps) return p.steps[stepIndex(p, v)]
  switch (id) {
    case 'mix':
      return `${pct(v)} synth`
    case 'cutoff':
      return hz(cutoffHz(v))
    case 'envelope': {
      const t = envelopeTimes(v)
      return t ? `attack ${ms(t.attackMs)}, decay ${ms(t.decayMs)}` : 'off'
    }
    case 'sub':
      return `${pct(v)} sub`
    case 'resonance':
      return `${pct(v)}${v > 0.7 ? ', strong peak' : v > 0.35 ? ', clear peak' : ', smooth'}`
    case 'mod': {
      if (v <= 0.005) return 'off'
      return `${pct(v)} depth, ${modDepthRate(v).rateHz.toFixed(1)} Hz`
    }
    case 'voiceMix':
      return `${pct(v)} voices`
    case 'envAmount': {
      const o = envAmountOctaves(v)
      return `${signed(o, 1)} oct, ${o >= 0 ? 'opens' : 'closes'}`
    }
    case 'ampEnv':
      return `fade-in ${ms(ampAttackMs(v))}`
    case 'noise':
      return `${pct(v)} noise`
    case 'glide':
      return v <= 0.005 ? 'off' : ms(glideMs(v))
    case 'modBlend':
      return `${pct(1 - v)} chorus, ${pct(v)} LFO`
    case 'comp':
      return v <= 0.005 ? 'off' : `${pct(v)}${v >= 0.95 ? ', limiting' : ''}`
    case 'gateSens':
      return `${pct(v)} sensitivity`
    case 'outGain':
      return `${signed(outGainDb(v), 1)} dB`
    default:
      return pct(v)
  }
}

/** Clock position plus physical value, for captions and screen readers. */
export function describe(id: ParamId, v: number): string {
  const p = PARAM[id]
  return p.steps ? formatValue(id, v) : `${clockLabel(v)}, ${formatValue(id, v)}`
}
