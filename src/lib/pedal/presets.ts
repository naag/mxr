/**
 * Factory presets. The manual describes them but doesn't publish knob positions, so these
 * are first-draft recipes from docs/pedal-reference.md §5, to be replaced with values
 * measured on a real MB301 (PLAN Phase 4b). Written as clock positions for readability.
 */
import {
  clock,
  GLOBAL_PARAM_IDS,
  PARAM,
  PRESET_PARAM_IDS,
  EXPRESSION_PARAM_IDS,
  type ExpressionParamId,
  type GlobalParamId,
  type PresetParamId,
} from './params'

export type Shape = 'triangle' | 'saw' | 'square'
export const SHAPES: readonly Shape[] = ['triangle', 'saw', 'square']

export interface Patch {
  shape: Shape
  voiceOn: boolean
  values: Record<PresetParamId, number>
  /**
   * Toe-down state for an expression pedal (reference §7): only the parameters that differ
   * from the heel state (`values`). Missing or empty means the pedal changes nothing.
   */
  toe?: Partial<Record<ExpressionParamId, number>>
}

export type Globals = Record<GlobalParamId, number>

export interface PresetInfo {
  /** "G1" … "G4" for the green bank, "R1" … "R4" for the red bank. */
  code: string
  name: string
}

export const PRESET_COUNT = 8

export const PRESET_INFO: readonly PresetInfo[] = [
  { code: 'G1', name: 'Thrillenganes' },
  { code: 'G2', name: 'Wonderful' },
  { code: 'G3', name: 'Lizard Synth' },
  { code: 'G4', name: 'Synthadelic' },
  { code: 'R1', name: 'Sledge' },
  { code: 'R2', name: 'Army of Synth' },
  { code: 'R3', name: 'Nine Inch Synth' },
  { code: 'R4', name: 'Synthmau5' },
]

/** Preset number 1–8 → info; 0 (live mode) has none. */
export const presetInfo = (preset: number): PresetInfo | null => PRESET_INFO[preset - 1] ?? null

export const bankOf = (preset: number): 'green' | 'red' | null =>
  preset === 0 ? null : preset <= 4 ? 'green' : 'red'

export function initialValues(): Record<PresetParamId, number> {
  return Object.fromEntries(PRESET_PARAM_IDS.map((id) => [id, PARAM[id].initial])) as Record<
    PresetParamId,
    number
  >
}

export function initialGlobals(): Globals {
  return Object.fromEntries(GLOBAL_PARAM_IDS.map((id) => [id, PARAM[id].initial])) as Globals
}

/** Live mode at first start. */
export function initialLivePatch(): Patch {
  return { shape: 'saw', voiceOn: false, values: initialValues() }
}

type ClockValues = Partial<Record<PresetParamId, number>>

/** Draft defaults for the parts of a preset the recipe doesn't mention. */
const RECIPE_BASE: ClockValues = {
  voiceMix: 12,
  noise: 7,
  envAmount: 14,
  ampEnv: 7,
  glide: 7,
  modBlend: 9,
  comp: 9,
  outGain: 12,
  dryThru: 7,
}

function recipe(
  shape: Shape,
  voiceOn: boolean,
  hours: ClockValues,
  toe?: Partial<Record<ExpressionParamId, number>>,
): Patch {
  const values = initialValues()
  for (const [id, hour] of Object.entries({ ...RECIPE_BASE, ...hours })) {
    values[id as PresetParamId] = clock(hour)
  }
  const patch: Patch = { shape, voiceOn, values }
  if (toe) {
    patch.toe = Object.fromEntries(Object.entries(toe).map(([id, hour]) => [id, clock(hour)]))
  }
  return patch
}

/** Factory presets 1–8 (index 0 is preset 1). */
export const FACTORY_PRESETS: readonly Patch[] = [
  recipe('saw', false, {
    mix: 15,
    sub: 13,
    cutoff: 11,
    envelope: 9,
    resonance: 10,
    mod: 7,
    comp: 10,
  }),
  recipe('square', false, {
    mix: 14,
    sub: 9,
    cutoff: 9,
    envelope: 9,
    resonance: 14,
    mod: 7,
    envAmount: 15,
    glide: 9,
  }),
  recipe('saw', false, { mix: 16, sub: 9, cutoff: 10, envelope: 11, resonance: 15, mod: 7 }),
  recipe('square', false, {
    mix: 16,
    sub: 14,
    cutoff: 15,
    envelope: 7,
    resonance: 10,
    mod: 8,
    glide: 10,
  }),
  recipe('triangle', false, {
    mix: 13,
    sub: 14,
    cutoff: 13,
    envelope: 7,
    resonance: 9,
    mod: 12,
    modBlend: 8,
    comp: 15,
  }),
  // Manual: "use expression for intensity". Draft toe: CUTOFF 3 o'clock, RESONANCE 2.
  recipe(
    'saw',
    true,
    {
      mix: 15,
      sub: 11,
      cutoff: 10,
      envelope: 10,
      resonance: 12,
      mod: 7,
      voiceMix: 13,
      comp: 14,
    },
    { cutoff: 15, resonance: 14 },
  ),
  recipe('square', true, {
    mix: 16,
    sub: 10,
    cutoff: 12,
    envelope: 10,
    resonance: 13,
    mod: 7,
    noise: 9,
  }),
  recipe('saw', false, {
    mix: 17,
    sub: 11,
    cutoff: 10,
    envelope: 13,
    resonance: 12,
    mod: 10,
    envAmount: 9,
    ampEnv: 11,
    modBlend: 15,
  }),
]

export function clonePatch(p: Patch): Patch {
  const copy: Patch = { shape: p.shape, voiceOn: p.voiceOn, values: { ...p.values } }
  if (p.toe && Object.keys(p.toe).length > 0) copy.toe = { ...p.toe }
  return copy
}

const same = (a: number, b: number) => Math.abs(a - b) < 1e-6

/** Toe value of a parameter: its own toe setting, or the heel value when it has none. */
export const toeValue = (p: Patch, id: ExpressionParamId): number => p.toe?.[id] ?? p.values[id]

/** The parameters whose toe state differs from the heel state, in parameter order. */
export function toeChanges(p: Patch): ExpressionParamId[] {
  return EXPRESSION_PARAM_IDS.filter((id) => !same(toeValue(p, id), p.values[id]))
}

export function patchesEqual(a: Patch, b: Patch): boolean {
  if (a.shape !== b.shape || a.voiceOn !== b.voiceOn) return false
  if (!PRESET_PARAM_IDS.every((id) => same(a.values[id], b.values[id]))) return false
  return EXPRESSION_PARAM_IDS.every((id) => same(toeValue(a, id), toeValue(b, id)))
}

/**
 * The sound at an expression-pedal position: 0 = heel (the saved values), 1 = toe. Morphs
 * every parameter with a toe state linearly; SHAPE, VOICE and the SHAPE layer stay put.
 * Stepped VOICE-layer params don't exist, so no snapping is needed.
 */
export function morphPatch(p: Patch, position: number): Patch {
  const t = Math.min(1, Math.max(0, position))
  const changes = toeChanges(p)
  if (t === 0 || changes.length === 0) return p
  const values = { ...p.values }
  for (const id of changes) values[id] = p.values[id] + (toeValue(p, id) - p.values[id]) * t
  return { shape: p.shape, voiceOn: p.voiceOn, values }
}
