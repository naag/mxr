/** Copy for the Reference view (controls by layer; the glossary has its own file). */
import type { Layer } from '../pedal/params'

export const referenceCopy = {
  onThisPage: 'On this page',
  layers: {
    main: {
      title: 'Main controls',
      text: 'The six knobs as printed on the pedal.',
    },
    voice: {
      title: 'VOICE layer',
      text: 'Hold VOICE while turning a knob (or pick “Voice layer” under the pedal). Sound settings, saved per preset; an expression pedal can morph them.',
    },
    shape: {
      title: 'SHAPE layer',
      text: 'Hold SHAPE while turning a knob (or pick “Shape layer”). Utility settings; the ones marked global are shared by all presets.',
    },
  } satisfies Record<Layer, { title: string; text: string }>,
  buttons: 'Buttons and footswitch',
  knob: (label: string) => `on ${label}`,
  global: 'global',
  learn: (n: number) => `Learn more in chapter ${n} →`,
}
