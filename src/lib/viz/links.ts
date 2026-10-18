/**
 * Linked highlighting (PLAN §2.1): which visuals and signal-chain blocks each control
 * affects, and back. Pointing at a knob lights its visuals; pointing at a visual lights the
 * knobs that change it.
 */
import type { KnobId } from '../pedal/layout'
import { KNOBS } from '../pedal/layout'
import { paramAt, type Layer, type ParamId } from '../pedal/params'
import type { ControlId } from '../pedal/pedal.svelte'

export type VizId = 'scope' | 'spectrum' | 'envelope' | 'pitch' | 'meter'
export const VIZ_IDS: readonly VizId[] = ['scope', 'spectrum', 'envelope', 'pitch', 'meter']

/** Blocks of the signal chain strip, in signal order (docs/pedal-reference.md §9). */
export type BlockId = 'input' | 'tracking' | 'osc' | 'filter' | 'amp' | 'fx' | 'dyn' | 'mix' | 'out'
export const BLOCKS: readonly BlockId[] = [
  'input',
  'tracking',
  'osc',
  'filter',
  'amp',
  'fx',
  'dyn',
  'mix',
  'out',
]

interface Link {
  viz: VizId[]
  blocks: BlockId[]
  /** Highlights the filter curve on the spectrum. */
  curve?: boolean
}

export const PARAM_LINKS: Record<ParamId, Link> = {
  mix: { viz: ['scope', 'meter'], blocks: ['mix'] },
  cutoff: { viz: ['spectrum', 'scope', 'envelope'], blocks: ['filter'], curve: true },
  envelope: { viz: ['envelope', 'spectrum'], blocks: ['filter'], curve: true },
  sub: { viz: ['scope', 'spectrum'], blocks: ['osc'] },
  resonance: { viz: ['spectrum', 'scope'], blocks: ['filter'], curve: true },
  mod: { viz: ['envelope', 'scope'], blocks: ['fx', 'filter'] },
  voiceMix: { viz: ['scope', 'spectrum'], blocks: ['osc'] },
  envAmount: { viz: ['envelope', 'spectrum'], blocks: ['filter'], curve: true },
  ampEnv: { viz: ['envelope', 'scope'], blocks: ['amp'] },
  noise: { viz: ['scope', 'spectrum'], blocks: ['osc'] },
  glide: { viz: ['pitch'], blocks: ['osc'] },
  modBlend: { viz: ['envelope', 'scope'], blocks: ['fx', 'filter'] },
  comp: { viz: ['meter'], blocks: ['dyn'] },
  gateSens: { viz: ['pitch'], blocks: ['tracking'] },
  dryThru: { viz: ['scope', 'spectrum'], blocks: ['input', 'filter'] },
  outGain: { viz: ['meter'], blocks: ['out'] },
  tracking: { viz: ['envelope', 'pitch'], blocks: ['tracking'] },
  outMode: { viz: ['meter'], blocks: ['out'] },
}

const BUTTON_LINKS: Record<Exclude<ControlId, KnobId>, Link> = {
  voice: { viz: ['scope', 'spectrum'], blocks: ['osc'] },
  shape: { viz: ['scope', 'spectrum'], blocks: ['osc'] },
  footswitch: { viz: ['meter'], blocks: ['mix', 'out'] },
  presets: { viz: [], blocks: [] },
}

const NONE: Link = { viz: [], blocks: [] }

/** What a control (in the active layer) is linked to. */
export function linksFor(control: ControlId | null, layer: Layer): Link {
  if (!control) return NONE
  if (control in BUTTON_LINKS) return BUTTON_LINKS[control as keyof typeof BUTTON_LINKS]
  return PARAM_LINKS[paramAt(control as KnobId, layer).id]
}

/** Knobs whose parameter in the active layer changes the visual. */
export function knobsForViz(viz: VizId | null, layer: Layer): KnobId[] {
  if (!viz) return []
  return KNOBS.filter((k) => PARAM_LINKS[paramAt(k.id, layer).id].viz.includes(viz)).map(
    (k) => k.id,
  )
}
