/**
 * "Computed" visuals (PLAN §5.5): short offline renders of the pedal DSP for the current
 * settings. They drive the visuals while the sound is off, give the envelope graph its shape
 * preview and the pitch graph its riff, and make visual tests deterministic.
 */
import {
  gateThreshold,
  oscGains,
  TRACKING_DELAY_MS,
  VOICE_INTERVALS,
  type PedalSettings,
} from '../audio/dsp/pedal-dsp'
import { midiToHz, rms } from '../audio/dsp/analysis'
import { Noise, Oscillator, subOctave } from '../audio/dsp/oscillator'
import { renderOffline, type NoteEvent } from '../audio/render'
import type { Riff } from '../audio/riffs'
import { ampAttackMs, cutoffHz, envelopeTimes, PARAM, stepIndex } from '../pedal/params'

/** Tap points the scope and spectrum can show. `out` is the pedal output (L+R)/2. */
export type ScopeTap = 'osc' | 'filter' | 'amp' | 'out'
export const SCOPE_TAPS: readonly ScopeTap[] = ['osc', 'filter', 'amp', 'out']

/** Every tap the snapshot keeps: the scope's, plus the rest of the chain for the flow view. */
export type SnapshotTap = ScopeTap | 'dry' | 'chorus' | 'fx' | 'left' | 'right'

/** The note the computed views play: A1, 55 Hz, as in the mockup. */
export const PREVIEW_MIDI = 33
export const PREVIEW_VELOCITY = 0.8
/** Note start in the preview render. */
export const NOTE_AT = 0.01
/** Where the computed scope and spectrum look: this long after the synth starts the note. */
export const SNAPSHOT_AFTER = 0.15
export const WINDOW = 8192
export const SAMPLE_RATE = 48000
/** Control curves (cutoff, level, pitch) are kept at this rate. */
export const CONTROL_RATE = 1000
const PITCH_RATE = 8000

export interface EnvelopeCurve {
  /** Seconds per point. */
  dt: number
  /** Graph length in seconds. */
  seconds: number
  cutoffHz: Float32Array
  /** Amp-stage gain, 0–1.5. */
  level: Float32Array
  noteOn: number
  noteOff: number
  /** When the synth starts the note (after the tracking delay). */
  synthOn: number
  /** Cutoff set by the knob alone. */
  knobHz: number
}

export interface PitchNote {
  start: number
  end: number
  midi: number
  velocity: number
  /** False when the note is too soft for GATE SENS to trigger the synth. */
  triggered: boolean
}

export interface PitchCurve {
  dt: number
  seconds: number
  pitch: Float32Array
  notes: PitchNote[]
  /** Seconds per beat. */
  beat: number
}

export interface Snapshot {
  sampleRate: number
  midi: number
  /** Time of the snapshot in the preview render. */
  at: number
  /** The newest WINDOW samples of each tap at the snapshot. */
  taps: Record<SnapshotTap, Float32Array>
  cutoffNow: number
  envelope: EnvelopeCurve
  pitch: PitchCurve
  meter: {
    peakLeft: number
    peakRight: number
    rmsLeft: number
    rmsRight: number
    gainReductionDb: number
  }
}

/** Length of the envelope graph: long enough to show the slowest part, in nice steps. */
export function envelopeSeconds(settings: PedalSettings): number {
  const v = settings.patch.values
  const env = envelopeTimes(v.envelope)
  const need = Math.max(env ? (env.attackMs + env.decayMs) / 1000 : 0, ampAttackMs(v.ampEnv) / 1000)
  const steps = [0.5, 0.8, 1.2, 2, 3]
  return steps.find((s) => s >= need * 1.4) ?? steps[steps.length - 1]
}

function decimate(
  x: Float32Array,
  factor: number,
  mode: 'mean' | 'peak' | 'pick' = 'mean',
): Float32Array {
  const n = Math.floor(x.length / factor)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    if (mode === 'pick') {
      out[i] = x[i * factor]
      continue
    }
    let acc = 0
    for (let j = 0; j < factor; j++) {
      const v = x[i * factor + j]
      acc = mode === 'peak' ? Math.max(acc, Math.abs(v)) : acc + v
    }
    out[i] = mode === 'peak' ? acc : acc / factor
  }
  return out
}

const peakOf = (x: Float32Array) => x.reduce((m, v) => Math.max(m, Math.abs(v)), 0)

/** One loop of the riff as note events in seconds. */
export function riffEvents(
  riff: Riff,
  bpm: number,
): { notes: NoteEvent[]; seconds: number; beat: number } {
  const beat = 60 / bpm
  return {
    beat,
    seconds: riff.beats * beat,
    notes: riff.notes.map((n) => ({
      at: n.beat * beat,
      midi: n.midi,
      length: n.length * beat,
      velocity: n.velocity ?? 0.8,
    })),
  }
}

/** The pitch the synth plays over one loop of the riff (glide, gate and tracking included). */
export function pitchCurve(settings: PedalSettings, riff: Riff, bpm: number): PitchCurve {
  const { notes, seconds, beat } = riffEvents(riff, bpm)
  const r = renderOffline(settings, notes, seconds, PITCH_RATE)
  const threshold = gateThreshold(settings.globals.gateSens)
  // Until the synth starts its first note the DSP reports pitch 0; show nothing there.
  const pitch = decimate(r.pitch, PITCH_RATE / CONTROL_RATE, 'pick')
  for (let i = 0; i < pitch.length && pitch[i] < 1; i++) pitch[i] = NaN
  return {
    dt: 1 / CONTROL_RATE,
    seconds,
    beat,
    pitch,
    notes: notes.map((n) => ({
      start: n.at,
      end: n.at + n.length,
      midi: n.midi,
      velocity: n.velocity ?? 0.8,
      triggered: (n.velocity ?? 0.8) >= threshold,
    })),
  }
}

/** Renders the preview note and the riff, and packs everything the visuals need. */
export function computeSnapshot(settings: PedalSettings, riff: Riff, bpm: number): Snapshot {
  const sr = SAMPLE_RATE
  const seconds = envelopeSeconds(settings)
  const length = Math.round(seconds * 0.65 * 100) / 100
  const delay = TRACKING_DELAY_MS[stepIndex(PARAM.tracking, settings.globals.tracking)] / 1000
  const r = renderOffline(
    settings,
    [{ at: NOTE_AT, midi: PREVIEW_MIDI, length, velocity: PREVIEW_VELOCITY }],
    Math.max(seconds, NOTE_AT + delay + SNAPSHOT_AFTER + 0.01),
    sr,
  )
  const at = NOTE_AT + delay + SNAPSHOT_AFTER
  const end = Math.round(at * sr)
  const window = (x: Float32Array) => x.slice(Math.max(0, end - WINDOW), end)
  const out = new Float32Array(r.left.length)
  for (let i = 0; i < out.length; i++) out[i] = 0.5 * (r.left[i] + r.right[i])
  const graph = Math.round(seconds * sr)
  const factor = sr / CONTROL_RATE
  return {
    sampleRate: sr,
    midi: PREVIEW_MIDI,
    at,
    taps: {
      dry: window(r.dry),
      osc: window(r.osc),
      filter: window(r.filter),
      amp: window(r.amp),
      chorus: window(r.chorus),
      fx: window(r.fx),
      out: window(out),
      left: window(r.left),
      right: window(r.right),
    },
    cutoffNow: r.cutoffHz[end - 1],
    envelope: {
      dt: 1 / CONTROL_RATE,
      seconds,
      cutoffHz: decimate(r.cutoffHz.subarray(0, graph), factor),
      level: decimate(r.level.subarray(0, graph), factor),
      noteOn: NOTE_AT,
      noteOff: NOTE_AT + length,
      synthOn: NOTE_AT + delay,
      knobHz: cutoffHz(settings.patch.values.cutoff),
    },
    pitch: pitchCurve(settings, riff, bpm),
    meter: {
      peakLeft: peakOf(r.left),
      peakRight: peakOf(r.right),
      rmsLeft: rms(r.left),
      rmsRight: rms(r.right),
      gainReductionDb: r.gainReductionDb.reduce((m, v) => Math.max(m, v), 0),
    },
  }
}

export interface OscLayer {
  id: 'main' | 'voice1' | 'voice2' | 'sub' | 'noise'
  samples: Float32Array
}

/**
 * The oscillator mix taken apart ("layers" mode of the scope): each source at its level in
 * the mix, plus their sum. Computed directly from the oscillators, phase-aligned at 0.
 */
export function oscLayers(
  settings: PedalSettings,
  midi: number,
  length: number,
  sampleRate = SAMPLE_RATE,
): { layers: OscLayer[]; sum: Float32Array } {
  const { patch } = settings
  const g = oscGains(patch.values, patch.voiceOn)
  const hz = midiToHz(midi)
  const main = new Oscillator(sampleRate)
  main.setFrequency(hz)
  const voices = VOICE_INTERVALS.map((iv) => {
    const o = new Oscillator(sampleRate)
    o.setFrequency(hz * 2 ** (iv / 12))
    return o
  })
  const noise = new Noise(1)
  const n = Math.ceil(length)
  const buf = {
    main: new Float32Array(n),
    voice1: new Float32Array(n),
    voice2: new Float32Array(n),
    sub: new Float32Array(n),
    noise: new Float32Array(n),
  }
  const sum = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    buf.sub[i] = g.sub * subOctave(main)
    buf.main[i] = g.main * main.next(patch.shape)
    buf.voice1[i] = g.voice * voices[0].next(patch.shape)
    buf.voice2[i] = g.voice * voices[1].next(patch.shape)
    buf.noise[i] = g.noise * noise.next()
    sum[i] = buf.main[i] + buf.voice1[i] + buf.voice2[i] + buf.sub[i] + buf.noise[i]
  }
  const layers: OscLayer[] = []
  if (g.main > 1e-3) layers.push({ id: 'main', samples: buf.main })
  if (g.voice > 1e-3)
    layers.push({ id: 'voice1', samples: buf.voice1 }, { id: 'voice2', samples: buf.voice2 })
  if (g.sub > 1e-3) layers.push({ id: 'sub', samples: buf.sub })
  if (g.noise > 1e-3) layers.push({ id: 'noise', samples: buf.noise })
  return { layers, sum }
}

/**
 * Lowest frequency the oscillator mix repeats at: the sub halves it, and the fifth voice
 * (ratio ≈ 3:2) makes the pattern repeat every two cycles of the main oscillator.
 */
export function repeatHz(settings: PedalSettings, pitchHz: number): number {
  const { values, voiceOn } = settings.patch
  const g = oscGains(values, voiceOn)
  return g.sub > 1e-3 || g.voice > 1e-3 ? pitchHz / 2 : pitchHz
}
