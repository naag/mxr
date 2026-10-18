import type { ParamId, Stage } from '../pedal/params'

export interface ControlCopy {
  oneLiner: string
  left?: string
  right?: string
}

/** Control cards (docs/learning-content.md, Part A). Labels and names live in params.ts. */
export const paramCopy: Record<ParamId, ControlCopy> = {
  mix: {
    oneLiner: 'Blends your clean bass with the synth.',
    left: 'More of your real bass',
    right: 'More synth',
  },
  cutoff: {
    oneLiner: 'How bright the synth is: it lets low sounds through and blocks high ones.',
    left: 'Darker, muffled',
    right: 'Brighter, buzzier',
  },
  envelope: {
    oneLiner: 'How fast the brightness blooms and fades after each note. Off at minimum.',
    left: 'Quick pluck',
    right: 'Slow sweep',
  },
  sub: {
    oneLiner: 'Blends in a second synth voice one octave lower.',
    left: 'Main synth only',
    right: 'Deep sub only',
  },
  resonance: {
    oneLiner: 'Adds a sharp, singing peak right at the cutoff point.',
    left: 'Smooth',
    right: 'Squelchy, vocal, whistly',
  },
  mod: {
    oneLiner: 'Adds movement: shimmer (chorus) or a pulsing wobble (LFO).',
    left: 'Still',
    right: 'Moving, pulsing',
  },
  voiceMix: {
    oneLiner: 'How loud the extra harmony voices are.',
    left: 'Voices gone',
    right: 'Voices loud',
  },
  envAmount: {
    oneLiner: 'How far, and which way, the envelope moves the cutoff. Noon is no movement.',
    left: 'Notes “duck” darker',
    right: 'Notes “bloom” brighter',
  },
  ampEnv: {
    oneLiner: 'How slowly each note fades in.',
    left: 'Instant',
    right: 'Slow swell',
  },
  noise: {
    oneLiner: 'Blends in hiss for breathy, gritty textures.',
    left: 'Pure tone',
    right: 'Mostly noise',
  },
  glide: {
    oneLiner: 'Slides smoothly from one note to the next.',
    left: 'Instant jumps',
    right: 'Slow slides',
  },
  modBlend: {
    oneLiner: 'Chooses what MOD moves.',
    left: 'Chorus shimmer',
    right: 'Filter wobble',
  },
  comp: {
    oneLiner: 'Evens out loud and soft notes.',
    left: 'Natural dynamics',
    right: 'Squashed, even, punchy',
  },
  gateSens: {
    oneLiner: 'How easily soft notes trigger the synth. Shared by all presets.',
    left: 'Ignores soft playing',
    right: 'Catches every ghost note',
  },
  dryThru: {
    oneLiner: 'Sends your clean bass through the filter and effects too.',
    left: 'Off',
    right: 'On',
  },
  outGain: {
    oneLiner: 'Overall volume, ±18 dB. Noon is no change.',
    left: 'Quieter',
    right: 'Louder',
  },
  tracking: {
    oneLiner: 'Tells the pedal what instrument range to listen for. Shared by all presets.',
    left: '5-string bass',
    right: 'Guitar',
  },
  outMode: {
    oneLiner: 'How the sound leaves the pedal. Shared by all presets.',
    left: 'Mono',
    right: 'Stereo',
  },
}

export type ButtonId = 'voice' | 'shape' | 'footswitch' | 'presets'

export const buttonCopy: Record<ButtonId, { label: string; stage: Stage; oneLiner: string }> = {
  voice: {
    label: 'VOICE',
    stage: 'osc',
    oneLiner:
      'Tap: add extra voices tuned in harmony. Hold while turning a knob: reach the VOICE layer.',
  },
  shape: {
    label: 'SHAPE',
    stage: 'osc',
    oneLiner:
      'Tap: pick the wave (triangle, sawtooth, square). Hold while turning a knob: reach the SHAPE layer.',
  },
  footswitch: {
    label: 'FOOTSWITCH',
    stage: 'dyn',
    oneLiner: 'Tap: synth on or off. Hold: browse presets with further taps. Hold again to stop.',
  },
  presets: {
    label: 'PRESETS',
    stage: 'dyn',
    oneLiner:
      'Tap: next preset. Hold 2 s: copy the current sound, then pick a preset and hold 2 s again to save it there.',
  },
}

export const shapeNames = {
  triangle: 'Triangle',
  saw: 'Sawtooth',
  square: 'Square',
} as const

export const layerCopy = {
  main: { label: 'Main', sub: 'as printed' },
  voice: { label: 'Voice layer', sub: 'hold VOICE' },
  shape: { label: 'Shape layer', sub: 'hold SHAPE' },
} as const

export const statusCopy = {
  idle: 'Drag a knob up or down, or use the arrow keys. Tap SHAPE, VOICE, the footswitch or PRESETS.',
  scroll: 'Preset scroll: tap the footswitch for the next preset. Hold it again to stop.',
  copy: 'Sound copied. Pick a preset, then hold PRESETS for 2 seconds to save it there.',
  copyLive: 'You can’t save into live mode. Pick a preset first.',
  saved: 'Saved.',
  reset: 'Preset reset to its factory sound.',
  factory: 'Everything is back to factory settings.',
  frozen: 'Note frozen while you hold the footswitch.',
  freezeMode:
    'Holding the footswitch now freezes the note. Hold it and turn RESONANCE to min to undo.',
  liveMode: 'Live mode (your knobs)',
  edited: 'edited',
  shareCopied: 'Link copied',
  shareLabel: 'Copy link to this sound',
}

export const stageColors: Record<Stage, string> = {
  osc: 'var(--color-stage-osc)',
  filter: 'var(--color-stage-filter)',
  env: 'var(--color-stage-env)',
  mod: 'var(--color-stage-mod)',
  dyn: 'var(--color-stage-dyn)',
  input: 'var(--color-stage-input)',
}

export const layerColors = {
  main: 'var(--color-silk)',
  voice: 'var(--color-layer-voice)',
  shape: 'var(--color-layer-shape)',
} as const

export const jackInfo = {
  out: 'OUT: stereo-capable output (TRS)',
  ctr: 'CTR: expression pedal or tap switch, or right-channel output',
  in: 'IN: your bass (mono)',
} as const
