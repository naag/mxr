/** Copy for the Under-the-hood view (docs/mockup/Flow.dc.html). */
import type { ModId, OutputMode, StageId } from '../flow/stages'

export interface StageCopy {
  title: string
  kicker: string
  desc: string
  text: string
  tip: string
  inLabel: string
  outLabel: string
}

export const stageCopy: Record<StageId, StageCopy> = {
  input: {
    title: 'Your bass',
    kicker: 'Start',
    desc: 'The clean signal from your strings',
    text: 'This is your bass, straight from the strings. The wave looks irregular because a real string vibrates in many ways at once. The pedal keeps a clean copy of it for the MIX knob at the end.',
    tip: 'Tap the footswitch to hear only this clean signal (bypass).',
    inLabel: 'The bass wave',
    outLabel: 'The same wave, passed on',
  },
  tracking: {
    title: 'Pitch tracking',
    kicker: 'Step a',
    desc: 'Works out which note you play',
    text: 'Before it can play a synth note, the pedal measures how fast your string vibrates. A1 repeats 55 times a second, so one cycle takes 18 ms. Low notes take longer to measure, which is why TRACKING asks what instrument you play. It follows one note at a time, so play single notes rather than chords.',
    tip: 'Hold SHAPE and turn RESONANCE (that is TRACKING) to tell the pedal what you play.',
    inLabel: 'The bass wave',
    outLabel: 'The single pitch the pedal found',
  },
  osc: {
    title: 'Oscillators',
    kicker: 'Step b',
    desc: 'Builds a brand-new wave at that pitch',
    text: 'Now the synth takes over. It builds a fresh wave at exactly the note you played, in the SHAPE you picked, and can add a wave one octave lower (SUB MIX), harmony voices (VOICE) and hiss (NOISE MIX).',
    tip: 'Press SHAPE to switch between triangle, sawtooth and square and watch this wave change.',
    inLabel: 'The pitch from the tracker',
    outLabel: 'The oscillator mix',
  },
  filter: {
    title: 'Filter',
    kicker: 'Step c',
    desc: 'This is where the sound gets darker',
    text: 'The filter is where most of the character comes from. It lets the low harmonics through and turns down everything above the cutoff, so sharp edges get rounded off and the sound gets darker. RESONANCE boosts the harmonics right at the cutoff: that is the ringing you can see and the “quack” you hear.',
    tip: 'Turn CUTOFF down: the wave gets smoother and the sound darker. Turn RESONANCE up: the ringing grows.',
    inLabel: 'The oscillator mix',
    outLabel: 'The wave after the filter',
  },
  amp: {
    title: 'Amp',
    kicker: 'Step d',
    desc: 'Shapes the volume of each note',
    text: 'The amp decides how loud the synth is from moment to moment. It follows your bass: when your note fades, the synth fades with it. AMP ENV adds a fade-in at the start of each note, which turns plucks into swells.',
    tip: 'Hold VOICE and turn ENVELOPE (that is AMP ENV) to make each note swell in.',
    inLabel: 'Filtered wave over the whole note',
    outLabel: 'The same note with its volume shape',
  },
  chorus: {
    title: 'Chorus',
    kicker: 'Step e',
    desc: 'Adds shimmer with a wobbling copy',
    text: 'Chorus layers a slightly delayed, wobbling copy on top of the sound to make it wider. MOD sets how much movement there is. MOD BLEND splits it between this chorus and the LFO that wobbles the filter.',
    tip: 'Turn MOD up past 12 o’clock and this step lights up.',
    inLabel: 'Wave from the amp',
    outLabel: 'Wave mixed with a moving copy',
  },
  comp: {
    title: 'Compressor',
    kicker: 'Step f',
    desc: 'Evens out loud and soft notes',
    text: 'Compression turns loud notes down and leaves quiet ones alone, so every note comes out at a similar level. Turned all the way up it becomes a limiter: nothing gets past a set level.',
    tip: 'Hold SHAPE and turn MIX (that is COMP). Play the Ghost Notes riff to hear the soft notes come up.',
    inLabel: 'Note level before',
    outLabel: 'Note level after',
  },
  gate: {
    title: 'Gate',
    kicker: 'Step g',
    desc: 'Keeps it quiet between notes',
    text: 'When you stop playing, the gate keeps the synth from humming or chattering. GATE SENS. sets how quiet a note can be and still start the synth. In this model the gate decides at the input, so a note that is too soft never starts the synth.',
    tip: 'Higher sensitivity catches every ghost note. Lower ignores light touches.',
    inLabel: 'Synth level',
    outLabel: 'Synth level after the gate',
  },
  mix: {
    title: 'Mix',
    kicker: 'Blend',
    desc: 'Blends your clean bass back in',
    text: 'MIX blends the synth with the clean copy of your bass from the top of the chain. Mostly synth with a little of your real attack keeps the note connected to your fingers. With DRY THRU FX on, the clean bass also goes through the filter and effects.',
    tip: 'Set MIX to noon for an even blend, the classic way to keep a synth bass punchy.',
    inLabel: 'Synth only',
    outLabel: 'Synth and clean bass together',
  },
  out: {
    title: 'Output',
    kicker: 'End',
    desc: 'Final level and routing',
    text: 'OUTPUT GAIN sets the final volume, plus or minus 18 dB. OUTPUT MODE decides whether you get one mono signal, synth on one jack and clean bass on the other, or a full stereo spread.',
    tip: 'Put on headphones and try STEREO mode with some chorus: the sound spreads out left and right.',
    inLabel: 'Blended signal',
    outLabel: 'The finished sound',
  },
}

export const modCopy: Record<ModId, { title: string; desc: string }> = {
  glide: { title: 'Glide', desc: 'slides between notes' },
  filterEnv: { title: 'Filter envelope', desc: 'opens or closes it on every note' },
  lfo: { title: 'LFO', desc: 'wobbles the cutoff up and down' },
  ampEnv: { title: 'Amp envelope', desc: 'fades each note in' },
}

export const routingCopy: Record<OutputMode, { label: string; out: string; ctr: string }> = {
  mono: { label: 'MONO', out: 'Synth and clean bass, mixed', ctr: 'not used' },
  wetdry: { label: 'WET/DRY', out: 'Synth only', ctr: 'Clean bass' },
  stereo: { label: 'STEREO', out: 'Left', ctr: 'Right' },
}

export const flowCopy = {
  stagesLabel: 'Steps inside the pedal',
  dryLane: 'Grey line on the left: the clean copy of your bass, kept for the MIX knob',
  dryThru: 'DRY THRU FX is on: the clean bass also goes into the filter',
  goingIn: 'Going in',
  comingOut: 'Coming out',
  controls: 'Controls in this step',
  moves: 'Moved by',
  tryIt: 'Try it',
  off: 'off',
  bypassed: 'bypassed',
  offTag: {
    chorus: 'off: MOD is at minimum or fully on the LFO',
    comp: 'off: COMP is at minimum',
  } as Partial<Record<StageId, string>>,
  bypassedTag: 'bypassed: footswitch is off',
  modOff: 'not moving anything',
  jacks: 'Jacks',
  outJack: 'OUT',
  ctrJack: 'CTR',
  waveLabel: (title: string, label: string) => `${title}: ${label}`,
}
