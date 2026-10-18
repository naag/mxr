/** Copy for the Under-the-hood view (signal flow) and its inspector. */
import { clockLabel } from '../pedal/knob'
import { PARAM, stepIndex, type ParamId } from '../pedal/params'
import type { FlowStageId, Idle, ModId, OscSource, OutMode } from '../viz/flow'

export interface StageCopy {
  title: string
  kicker: string
  /** One line under the title in the diagram. */
  desc: string
  /** The inspector's explanation. */
  text: string
  tip: string
  inLabel: string
  outLabel: string
}

export const stageCopy: Record<FlowStageId, StageCopy> = {
  input: {
    title: 'Your bass',
    kicker: 'START',
    desc: 'The clean signal from your strings',
    text: 'This is your bass, straight from the strings. The wave looks irregular because a real string vibrates in many ways at once. The pedal keeps a clean copy of it for the MIX knob at the end.',
    tip: 'Tap the footswitch to hear only this clean signal (bypass).',
    inLabel: 'A real bass wave',
    outLabel: 'The same wave, passed on',
  },
  tracking: {
    title: 'Pitch tracking',
    kicker: 'STEP A',
    desc: 'Works out which note you play',
    text: 'Before it can play a synth note, the pedal measures how fast your string vibrates. A1 repeats 55 times a second, so one cycle takes 18 ms. Low notes take longer to measure, which is why TRACKING asks what instrument you play. It follows one note at a time, so play single notes rather than chords.',
    tip: 'Turn GATE SENS. down and play the Ghost Notes riff: the soft notes stop triggering the synth.',
    inLabel: 'The bass wave',
    outLabel: 'The single pitch the pedal found',
  },
  osc: {
    title: 'Oscillators',
    kicker: 'STEP B',
    desc: 'Builds a brand-new wave at that pitch',
    text: 'Now the synth takes over. It builds a new wave at exactly the note you played: the main oscillator in the SHAPE you picked, plus a wave one octave lower (SUB MIX), harmony voices (VOICE) and hiss (NOISE MIX) if you turn them up.',
    tip: 'Switch between triangle, sawtooth and square and watch this wave change.',
    inLabel: 'The pitch from the tracker',
    outLabel: 'The oscillator mix',
  },
  filter: {
    title: 'Filter',
    kicker: 'STEP C',
    desc: 'Removes the bright upper harmonics',
    text: 'The filter is where most of the character comes from, and where the sound gets darker. It lets the low harmonics through and turns down everything above the cutoff, so sharp edges get rounded off. RESONANCE boosts the harmonics right at the cutoff: that is the ringing you can see in the wave and the “quack” you hear.',
    tip: 'Turn CUTOFF down: the wave gets smoother and the sound darker. Turn RESONANCE up: the ringing grows.',
    inLabel: 'The oscillator mix',
    outLabel: 'The wave after the filter',
  },
  amp: {
    title: 'Amp',
    kicker: 'STEP D',
    desc: 'Shapes the volume of each note',
    text: 'The amp decides how loud the synth is from moment to moment. It follows your bass: when your note fades, the synth fades with it. AMP ENV adds a fade-in at the start of each note, which turns plucks into swells.',
    tip: 'Turn AMP ENV up (hold VOICE and turn ENVELOPE on the pedal) to make each note swell in.',
    inLabel: 'The filtered wave',
    outLabel: 'The wave at the note’s volume',
  },
  chorus: {
    title: 'Chorus · LFO',
    kicker: 'STEP E',
    desc: 'Adds shimmer or a slow wobble',
    text: 'Chorus layers slightly delayed, wobbling copies on top of the sound to make it wider. The LFO slowly moves the filter’s cutoff up and down instead. MOD sets how much, MOD BLEND chooses between the two.',
    tip: 'Turn MOD up past noon with MOD BLEND to the left to hear the chorus shimmer.',
    inLabel: 'The wave from the amp',
    outLabel: 'The wave mixed with delayed copies',
  },
  comp: {
    title: 'Compressor',
    kicker: 'STEP F',
    desc: 'Evens out loud and soft notes',
    text: 'Compression turns loud notes down and leaves quiet ones alone, so every note comes out at a similar level. Turned all the way up it becomes a limiter: nothing gets past a set level.',
    tip: 'Turn COMP up and play the Ghost Notes riff to hear the soft notes come up.',
    inLabel: 'The wave before compression',
    outLabel: 'The wave after compression',
  },
  gate: {
    title: 'Gate',
    kicker: 'STEP G',
    desc: 'Keeps it quiet between notes',
    text: 'When you stop playing, the gate closes so the synth does not hum or chatter. GATE SENS. sets how soft a note can be and still open it. In this model the gate decides at the start of each note, so the wave passes through unchanged.',
    tip: 'Higher sensitivity catches every ghost note. Lower ignores light touches.',
    inLabel: 'The compressed synth',
    outLabel: 'The finished synth sound',
  },
  mix: {
    title: 'Mix',
    kicker: 'BLEND',
    desc: 'Blends your clean bass back in',
    text: 'MIX blends the synth with the clean copy of your bass from the top of the chain. A little clean bass keeps your real attack in the sound, which helps the note feel connected to your fingers. With DRY THRU FX on, the clean bass also goes through the filter and effects.',
    tip: 'Set MIX to noon for an even blend, the classic way to keep a synth bass punchy.',
    inLabel: 'The synth only',
    outLabel: 'The synth blended with your clean bass',
  },
  out: {
    title: 'Output',
    kicker: 'END',
    desc: 'Final level and routing',
    text: 'OUTPUT GAIN sets the final volume, plus or minus 18 dB. OUTPUT MODE decides whether you get one mono signal, synth on the left and clean bass on the right, or a full stereo spread.',
    tip: 'Put on headphones and try STEREO: the chorus and voices spread out left and right.',
    inLabel: 'The blended signal',
    outLabel: 'Left output',
  },
}

export const modCopy: Record<ModId, { title: string; desc: string }> = {
  glide: { title: 'Glide', desc: 'slides between notes' },
  filterEnv: { title: 'Filter envelope', desc: 'moves the cutoff on every note' },
  lfo: { title: 'LFO', desc: 'wobbles the cutoff up and down' },
  ampEnv: { title: 'Amp envelope', desc: 'fades each note in' },
}

/** Tags shown on a stage that leaves the sound unchanged right now. */
export const idleCopy: Record<Idle, string> = {
  bypassed: 'bypassed: the footswitch is off',
  modOff: 'off: MOD is at minimum',
  allLfo: 'off: MOD BLEND sends it all to the LFO',
  compOff: 'off: COMP is at minimum',
  wetDry: 'skipped in WET/DRY mode',
  glideOff: 'off',
  envOff: 'off: ENVELOPE is at minimum',
  envZero: 'off: FILTER ENV AMT is at noon',
  allChorus: 'off: MOD BLEND sends it all to the chorus',
  instant: 'off: notes start at once',
}

export const sourceCopy: Record<OscSource, string> = {
  main: 'main',
  voices: 'voices',
  sub: 'sub',
  noise: 'noise',
}

export const routingCopy: Record<OutMode, { label: string; left: string; right: string }> = {
  mono: { label: 'MONO', left: 'Left and right: the same mono mix', right: '' },
  wetDry: {
    label: 'WET/DRY',
    left: 'Left (tip): synth only',
    right: 'Right (ring): your clean bass',
  },
  stereo: {
    label: 'STEREO',
    left: 'Left: synth and bass',
    right: 'Right: chorus spread the other way',
  },
}

export const flowCopy = {
  kicker: 'Under the hood',
  title: 'Follow the signal',
  lede: 'Your bass goes in at the top and the finished sound comes out at the bottom. Each block is one step inside the pedal, and the small screen on each block shows the wave at that point. Select a block to look closer.',
  diagramLabel: 'Signal flow, from your bass to the output',
  dryLane: 'Grey line on the left: the clean copy of your bass, kept for the MIX knob',
  dryThru: 'DRY THRU FX: the clean bass also enters the filter',
  dryState: {
    mix: 'Clean bass: blended in by MIX',
    right: 'Clean bass: straight to the right output',
    muted: 'Clean bass: MIX is fully synth, so it is not heard',
    bypass: 'Bypassed: only the clean bass comes out',
  },
  sources: 'Playing',
  goingIn: 'GOING IN',
  comingOut: 'COMING OUT',
  rightOut: 'RIGHT OUTPUT',
  controls: 'CONTROLS IN THIS STEP',
  sideInputs: 'MOVED BY',
  tryIt: 'Try it',
  shape: 'SHAPE',
  voice: 'VOICE',
  voiceOn: 'on',
  voiceOff: 'off',
  idle: 'This step leaves the sound unchanged right now.',
  selectHint: 'Select to inspect',
  bypass: { on: 'Synth on', off: 'Synth off (bypass)', label: 'Footswitch' },
  computedHint: 'Sound is off: the waves are computed from a held A1.',
}

/** "CUTOFF 10 o’clock · RESONANCE noon", the knob line under each stage. */
export function knobLine(params: readonly ParamId[], valueOf: (p: ParamId) => number): string {
  return params
    .map((id) => {
      const p = PARAM[id]
      const v = valueOf(id)
      return `${p.label} ${p.steps ? p.steps[stepIndex(p, v)] : clockLabel(v)}`
    })
    .join(' · ')
}
