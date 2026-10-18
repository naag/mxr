import type { ControlId } from '../pedal/pedal.svelte'

export type Stage = 'osc' | 'filter' | 'env' | 'mod' | 'dyn' | 'input'

export interface ControlCopy {
  /** As printed on the pedal. */
  label: string
  /** Accessible name. */
  name: string
  stage: Stage
  oneLiner: string
  left?: string
  right?: string
}

/** Control cards for the main layer (docs/learning-content.md, Part A). */
export const controls: Record<ControlId, ControlCopy> = {
  mix: {
    label: 'MIX',
    name: 'Mix',
    stage: 'dyn',
    oneLiner: 'Blends your clean bass with the synth.',
    left: 'More of your real bass',
    right: 'More synth',
  },
  cutoff: {
    label: 'CUTOFF',
    name: 'Cutoff',
    stage: 'filter',
    oneLiner: 'How bright the synth is: it lets low sounds through and blocks high ones.',
    left: 'Darker, muffled',
    right: 'Brighter, buzzier',
  },
  envelope: {
    label: 'ENVELOPE',
    name: 'Envelope',
    stage: 'env',
    oneLiner: 'How fast the brightness blooms and fades after each note. Off at minimum.',
    left: 'Quick pluck',
    right: 'Slow sweep',
  },
  sub: {
    label: 'SUB MIX',
    name: 'Sub mix',
    stage: 'osc',
    oneLiner: 'Blends in a second synth voice one octave lower.',
    left: 'Main synth only',
    right: 'Deep sub only',
  },
  resonance: {
    label: 'RESONANCE',
    name: 'Resonance',
    stage: 'filter',
    oneLiner: 'Adds a sharp, singing peak right at the cutoff point.',
    left: 'Smooth',
    right: 'Squelchy, vocal, whistly',
  },
  mod: {
    label: 'MOD',
    name: 'Mod',
    stage: 'mod',
    oneLiner: 'Adds movement: shimmer (chorus) or a pulsing wobble (LFO).',
    left: 'Still',
    right: 'Moving, pulsing',
  },
  voice: {
    label: 'VOICE',
    name: 'Voice',
    stage: 'osc',
    oneLiner: 'Adds extra synth voices tuned in harmony for a bigger sound.',
  },
  shape: {
    label: 'SHAPE',
    name: 'Shape',
    stage: 'osc',
    oneLiner: 'Picks the basic wave the synth starts from: triangle, sawtooth or square.',
  },
  footswitch: {
    label: 'FOOTSWITCH',
    name: 'Footswitch',
    stage: 'dyn',
    oneLiner: 'Tap to switch the synth on or off and compare it with your clean bass.',
  },
  presets: {
    label: 'PRESETS',
    name: 'Presets',
    stage: 'dyn',
    oneLiner: 'Steps through the 8 built-in sounds and back to live mode.',
  },
}

export const shapeNames = {
  triangle: 'Triangle: smooth and subtle',
  saw: 'Sawtooth: rich and aggressive',
  square: 'Square: fat, rubbery punch',
} as const

export const stageColors: Record<Stage, string> = {
  osc: 'var(--color-stage-osc)',
  filter: 'var(--color-stage-filter)',
  env: 'var(--color-stage-env)',
  mod: 'var(--color-stage-mod)',
  dyn: 'var(--color-stage-dyn)',
  input: 'var(--color-stage-input)',
}

export const jackInfo = {
  out: 'OUT: stereo-capable output (TRS)',
  ctr: 'CTR: expression pedal or tap switch, or right-channel output',
  in: 'IN: your bass (mono)',
} as const
