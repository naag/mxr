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

export const views: Record<RouteName, { kicker: string; title: string; lede: string }> = {
  play: {
    kicker: 'Play',
    title: 'Turn a knob, hear and see what it does',
    lede: 'Press Start sound, play a riff or the fretboard at the bottom, and turn the knobs. Point at a knob to see where it acts; point at a visual to see which knobs change it.',
  },
  flow: {
    kicker: 'Under the hood',
    title: 'Follow the signal',
    lede: 'Every step inside the pedal, from your bass to the output, with the wave at each point.',
  },
  learn: {
    kicker: 'Learn',
    title: 'How a synth makes sound',
    lede: 'Fourteen short chapters. Each one has something to hear, something to see and something to do.',
  },
  presets: {
    kicker: 'Presets',
    title: 'The eight factory sounds',
    lede: 'Each preset as a recipe: which knobs matter and why it sounds the way it does.',
  },
  reference: {
    kicker: 'Reference',
    title: 'Every control on the pedal',
    lede: 'Main controls, the hidden VOICE and SHAPE layers, the buttons and a glossary of synth words.',
  },
  about: {
    kicker: 'About',
    title: 'About this project',
    lede: 'What Bass Synth Explorer is, what it isn’t, and how much of it is a guess.',
  },
}

export const aboutLink = 'About & disclaimer'

/** The About page (PLAN Phase 9): purpose, honesty notes, disclaimer and credits. */
export const about = {
  sections: [
    {
      title: 'What this is',
      body: [
        'An unofficial, non-commercial learning tool built around the MXR Bass Synth (MB301) pedal. It puts a playable copy of the pedal on screen and uses it to explain how a synthesizer makes sound: oscillators, filters, envelopes, modulation and dynamics.',
        'Everything runs in your browser. There is no account, no tracking and no live audio input: the “bass” is synthesized too, so nothing you do leaves your computer.',
      ],
    },
    {
      title: 'How close is it to the real pedal?',
      body: [
        'The controls, layers, presets and footswitch behavior follow the official user guide. The sound engine is our own educational model, not the pedal’s firmware: it behaves the way the manual describes, but it won’t sound identical.',
        'Where the manual is silent we had to guess, for example which notes VOICE adds, the sub-oscillator’s wave, the MOD rate and the factory presets’ knob positions. Each guess is marked in the app and will be checked against a real MB301.',
      ],
    },
    {
      title: 'Disclaimer',
      body: [
        'This project is not affiliated with, endorsed by or sponsored by Dunlop Manufacturing, Inc. MXR® and related names are trademarks of their respective owners. The pedal drawing is original artwork; no product photos or manual pages are reproduced.',
        'The preset names refer to the factory presets of the real pedal. The artists and songs named on the preset cards are the manual’s inspirations, described in our own words; the built-in riffs are original.',
      ],
    },
  ],
  links: [
    { label: 'Official MXR Bass Synth page', href: 'https://www.jimdunlop.com/mxr-bass-synth/' },
    {
      label: 'Official user guide (PDF)',
      href: 'https://www.jimdunlop.com/content/manuals/MB301.pdf',
    },
  ],
  linksTitle: 'The real thing',
  credits: 'Fonts: Instrument Sans, JetBrains Mono and Comfortaa (SIL Open Font License).',
}
