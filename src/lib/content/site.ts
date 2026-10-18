import type { RouteName } from '../router'

export const appName = 'Bass Synth Explorer'
export const appTagline = 'for the MXR MB301 · unofficial'

export const navItems: { name: RouteName; label: string; href: string }[] = [
  { name: 'play', label: 'Play', href: '#/' },
  { name: 'flow', label: 'Under the hood', href: '#/flow' },
  { name: 'learn', label: 'Learn', href: '#/learn/0' },
  { name: 'presets', label: 'Presets', href: '#/presets' },
  { name: 'reference', label: 'Reference', href: '#/reference' },
]

export const disclaimer =
  'Unofficial educational project, not affiliated with Dunlop or MXR. The sound engine is a model, not the pedal’s firmware.'

export const views: Record<
  RouteName,
  { kicker: string; title: string; lede: string; phase: string }
> = {
  play: {
    kicker: 'Play',
    title: 'Turn a knob, hear and see what it does',
    lede: 'Press Start sound, then play a riff or the fretboard at the bottom and turn the knobs. The live waveform and spectrum come next.',
    phase: 'Visuals in Phase 5',
  },
  flow: {
    kicker: 'Under the hood',
    title: 'Follow the signal',
    lede: 'Every step inside the pedal, from your bass to the output, with the wave at each point.',
    phase: 'Coming in Phase 6',
  },
  learn: {
    kicker: 'Learn',
    title: 'How a synth makes sound',
    lede: 'Fourteen short chapters. Each one has something to hear, something to see and something to do.',
    phase: 'Coming in Phase 7',
  },
  presets: {
    kicker: 'Presets',
    title: 'The eight factory sounds',
    lede: 'Each preset as a recipe: which knobs matter and why it sounds the way it does.',
    phase: 'Coming in Phase 8',
  },
  reference: {
    kicker: 'Reference',
    title: 'Every control on the pedal',
    lede: 'Main controls, the hidden VOICE and SHAPE layers, presets, jacks and a glossary.',
    phase: 'Coming in Phase 7',
  },
}
