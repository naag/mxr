/** Copy for the visuals: titles, legends and the live text readouts (PLAN §3). */
import { noteName } from '../audio/notes'
import type { ScopeTap } from '../viz/computed'
import type { BlockId } from '../viz/links'

const hz = (f: number) =>
  f >= 1000 ? `${(f / 1000).toFixed(f >= 10000 ? 0 : 1)} kHz` : `${Math.round(f)} Hz`
const ms = (t: number) => (t >= 1 ? `${t.toFixed(2)} s` : `${Math.round(t * 1000)} ms`)
const db = (v: number) => `${v < 0 ? '−' : v > 0 ? '+' : ''}${Math.abs(v).toFixed(0)} dB`

export const vizCopy = {
  live: 'Live',
  computed: 'Computed',
  computedHint: 'Sound is off: these show a computed A1 note and one loop of the riff.',
  detailLabel: 'Detail level',
  simple: 'Simple',
  detailed: 'Detailed',
  chain: 'Signal',
  chainLabel: 'Signal chain',
  scope: {
    title: 'Waveform',
    sub: 'What the speaker does, cycle by cycle',
    tapLabel: 'Where to look',
    layers: 'Layers',
    layersHint: 'Draw each oscillator on its own',
    cycle: (n: number) => (n === 1 ? '1 cycle' : `${n} cycles`),
    canvas: 'Oscilloscope',
  },
  taps: {
    osc: 'Oscillator',
    filter: 'After filter',
    amp: 'Amp',
    out: 'Output',
  } satisfies Record<ScopeTap, string>,
  tapLegend: {
    osc: 'Oscillator mix (before the filter)',
    filter: 'After the filter',
    amp: 'After the amp (volume shape)',
    out: 'Pedal output (dry and synth mixed)',
  } satisfies Record<ScopeTap, string>,
  ghost: 'Oscillator (before the filter)',
  layerNames: {
    main: 'Main oscillator',
    voice1: 'Voice (+5th)',
    voice2: 'Voice (+octave)',
    sub: 'Sub (−1 octave)',
    noise: 'Noise',
    sum: 'Sum',
  },
  spectrum: {
    title: 'Spectrum',
    sub: 'Which harmonics are in the sound, and how loud each one is',
    canvas: 'Spectrum',
    low: 'low · warm',
    high: 'high · fizzy',
    harmonics: (f: number) => `Harmonics: ${hz(f)} and its multiples`,
    before: 'Before the filter',
    curve: 'Filter shape (moves with the envelope)',
    fft: 'Full spectrum',
    cutoff: (f: number, detailed: boolean) => (detailed ? `cutoff right now · ${hz(f)}` : 'cutoff'),
    harmonic: (n: number) => `${n}×`,
    hzTick: (f: number) => (f >= 1000 ? `${f / 1000}k` : `${f}`),
  },
  envelope: {
    title: 'Envelope',
    sub: 'How brightness and volume move during one note',
    brightness: 'Brightness (cutoff)',
    volume: 'Volume',
    knob: (f: number) => `CUTOFF knob · ${hz(f)}`,
    peak: (f: number) => (f >= 20000 ? 'peak past 20 kHz' : `peak ${hz(f)}`),
    dip: (f: number) => `dips to ${hz(f)}`,
    now: (f: number) => `now ${hz(f)}`,
    noteEnds: 'note ends',
    ms: (t: number) => (t === 0 ? '0' : ms(t / 1000)),
  },
  pitch: {
    title: 'Pitch',
    sub: 'Which note the synth plays over time',
    subComputed: 'Which note the synth plays over one loop of the riff',
    now: (midi: number) => `now ${noteName(Math.round(midi))}`,
    frozen: 'frozen',
    beat: (n: number) => (n === 1 ? 'beat 1' : `${n}`),
    ago: (s: number) => (s === 0 ? 'now' : `−${s} s`),
    ignored: 'Soft note ignored (GATE SENS)',
    notes: 'Notes you play',
    line: 'Pitch the synth plays',
  },
  meter: {
    title: 'Levels',
    sub: 'Output level and how hard the compressor works',
    left: 'Left',
    right: 'Right',
    gr: 'Compressor',
    leftName: 'Output level, left',
    rightName: 'Output level, right',
    grName: 'Compressor gain reduction',
  },
  blocks: {
    input: 'Your bass',
    tracking: 'Pitch tracking',
    osc: 'Oscillators',
    filter: 'Filter',
    amp: 'Amp',
    fx: 'Chorus · LFO',
    dyn: 'Comp · Gate',
    mix: 'Mix',
    out: 'Out',
  } satisfies Record<BlockId, string>,
  openFlow: 'Open signal flow',
  showInScope: (block: string) => `Show ${block} in the waveform`,
  highlightedSuffix: 'linked to the control you’re pointing at',
}

// --- Live readouts (also the stable hooks for tests) ---

export function scopeReadout(o: {
  tap: ScopeTap
  midi: number | null
  pitchHz: number
  repeatHz: number
  silent: boolean
  detailed: boolean
}): string {
  const where = vizCopy.tapLegend[o.tap]
  if (o.silent || o.midi === null) return `${where}: silent.`
  const note = noteName(Math.round(o.midi))
  const cycle = ms(1 / o.repeatHz)
  if (!o.detailed) return `${where}: ${note}, one cycle lasts ${cycle}.`
  const sub = o.repeatHz < o.pitchHz * 0.75 ? ` · repeats at ${o.repeatHz.toFixed(1)} Hz` : ''
  return `${where}: ${note} · ${o.pitchHz.toFixed(1)} Hz · 1 cycle = ${cycle}${sub}`
}

export function spectrumReadout(o: {
  midi: number | null
  pitchHz: number
  centroidHz: number
  cutoffHz: number
  peakHz: number | null
  audible: number
  detailed: boolean
}): string {
  if (o.midi === null) return 'Spectrum: silent.'
  const note = noteName(Math.round(o.midi))
  const filter = o.peakHz ? `filter peak at ${hz(o.peakHz)}` : `cutoff at ${hz(o.cutoffHz)}`
  if (!o.detailed) {
    return `${note}: ${o.audible} harmonics come through the filter · brightness about ${hz(o.centroidHz)}.`
  }
  return `Fundamental ${note} ${hz(o.pitchHz)} · brightness ~${hz(o.centroidHz)} · ${filter} · ${o.audible} harmonics above −24 dB`
}

export function envelopeReadout(o: {
  knobHz: number
  peakHz: number
  lowHz: number
  envOn: boolean
  fadeInMs: number
}): string {
  const vol =
    o.fadeInMs < 5 ? 'Volume starts at once.' : `Volume fades in over ${ms(o.fadeInMs / 1000)}.`
  if (!o.envOn) return `Envelope off: the cutoff stays near ${hz(o.knobHz)}. ${vol}`
  const moves =
    o.peakHz > o.knobHz * 1.08
      ? o.peakHz >= 20000
        ? 'opens past 20 kHz'
        : `rises to ${hz(o.peakHz)}`
      : o.lowHz < o.knobHz / 1.08
        ? `dips to ${hz(o.lowHz)}`
        : 'barely moves'
  return `Cutoff starts at ${hz(o.knobHz)}, ${moves} and settles back. ${vol}`
}

export function pitchReadout(o: {
  glideMs: number
  nowMidi: number | null
  frozen: boolean
  ignored: number
}): string {
  const glide =
    o.glideMs > 0
      ? `GLIDE ${ms(o.glideMs / 1000)}: the pitch slides from note to note.`
      : 'GLIDE is off, so the pitch jumps from note to note.'
  const now =
    o.nowMidi !== null
      ? ` Now ${noteName(Math.round(o.nowMidi))}${o.frozen ? ' (frozen)' : ''}.`
      : ''
  const gate =
    o.ignored > 0
      ? ` ${o.ignored} soft ${o.ignored === 1 ? 'note is' : 'notes are'} too quiet to trigger the synth.`
      : ''
  return glide + now + gate
}

export function meterReadout(o: { left: number; right: number; grDb: number }): string {
  const level = (v: number) => (v <= -59 ? 'silent' : db(v))
  const gr = o.grDb >= 0.5 ? `compressor −${o.grDb.toFixed(0)} dB` : 'compressor idle'
  return `Output left ${level(o.left)}, right ${level(o.right)} · ${gr}`
}

export const formatHz = hz
export const formatDb = db
