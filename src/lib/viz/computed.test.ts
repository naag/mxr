import { describe, expect, it } from 'vitest'
import { midiToHz, zeroCrossingPitch } from '../audio/dsp/analysis'
import type { PedalSettings } from '../audio/dsp/pedal-dsp'
import { riffById } from '../audio/riffs'
import { clock, PARAMS, type ParamId } from '../pedal/params'
import { initialGlobals, initialLivePatch } from '../pedal/presets'
import { harmonicLevels, magnitudeSpectrum } from './analysis'
import {
  computeSnapshot,
  envelopeSeconds,
  peakEnvelope,
  oscLayers,
  PREVIEW_MIDI,
  repeatHz,
  WINDOW,
  type Snapshot,
} from './computed'
import { PARAM_LINKS, type VizId } from './links'

// Ghost Notes has soft notes (for GATE SENS) and several pitches (for GLIDE).
const riff = riffById('ghost-notes')

function settings(values: Partial<Record<ParamId, number>> = {}): PedalSettings {
  const patch = initialLivePatch()
  const globals = initialGlobals()
  const v = { ...patch.values }
  const g = { ...globals }
  for (const [id, value] of Object.entries(values)) {
    if (id in g) g[id as keyof typeof g] = value
    else v[id as keyof typeof v] = value
  }
  return { patch: { ...patch, voiceOn: true, values: v }, globals: g, engaged: true, frozen: false }
}

/** The numbers each visual is drawn from, in groups. */
function features(s: Snapshot): Record<VizId, number[][]> {
  const spec = (x: Float32Array) =>
    Array.from(harmonicLevels(magnitudeSpectrum(x), s.sampleRate / WINDOW, 27.5, 12000, 64))
  return {
    scope: [s.taps.osc, s.taps.filter, s.taps.amp, s.taps.out].map((t) => Array.from(t)),
    spectrum: [spec(s.taps.osc), spec(s.taps.filter), [s.cutoffNow]],
    envelope: [[s.envelope.seconds], Array.from(s.envelope.cutoffHz), Array.from(s.envelope.level)],
    pitch: [
      Array.from(s.pitch.pitch, (p) => (Number.isNaN(p) ? -1 : p)),
      s.pitch.notes.map((n) => Number(n.triggered)),
    ],
    meter: [
      [s.meter.peakLeft],
      [s.meter.peakRight],
      [s.meter.rmsLeft],
      [s.meter.rmsRight],
      [s.meter.gainReductionDb],
    ],
  }
}

/** Relative change between two feature vectors (1 when their lengths differ). */
function change(a: number[], b: number[]) {
  if (a.length !== b.length) return 1
  let diff = 0
  let size = 0
  for (let i = 0; i < a.length; i++) {
    diff += Math.abs(a[i] - b[i])
    size += Math.abs(a[i]) + Math.abs(b[i])
  }
  return size > 0 ? (2 * diff) / size : 0
}

describe('computed snapshot', () => {
  const s = computeSnapshot(settings(), riff, riff.bpm)

  it('packs full windows of every tap at the snapshot', () => {
    for (const tap of Object.values(s.taps)) expect(tap.length).toBe(WINDOW)
    expect(s.cutoffNow).toBeGreaterThan(20)
  })

  it('shows the preview note on the oscillator tap (±2%, voices off)', () => {
    const plain = settings({ sub: 0 })
    plain.patch.voiceOn = false
    const osc = computeSnapshot(plain, riff, riff.bpm).taps.osc
    expect(zeroCrossingPitch(osc, 48000) / midiToHz(PREVIEW_MIDI)).toBeCloseTo(1, 1)
  })

  it('gives the envelope graph one point per millisecond', () => {
    expect(s.envelope.cutoffHz.length).toBe(Math.round(s.envelope.seconds * 1000))
    expect(s.envelope.noteOff).toBeGreaterThan(s.envelope.noteOn)
    expect(s.envelope.synthOn).toBeGreaterThan(s.envelope.noteOn)
  })

  it('makes the envelope graph longer for slow envelopes', () => {
    expect(envelopeSeconds(settings({ envelope: 1 }))).toBeGreaterThan(
      envelopeSeconds(settings({ envelope: clock(9) })),
    )
  })

  it('covers one loop of the riff in the pitch graph', () => {
    expect(s.pitch.seconds).toBeCloseTo((riff.beats * 60) / riff.bpm, 6)
    expect(s.pitch.notes.length).toBe(riff.notes.length)
  })

  it('marks soft notes that GATE SENS ignores', () => {
    const strict = computeSnapshot(settings({ gateSens: 0 }), riff, riff.bpm)
    expect(strict.pitch.notes.some((n) => !n.triggered)).toBe(true)
    const open = computeSnapshot(settings({ gateSens: 1 }), riff, riff.bpm)
    expect(open.pitch.notes.every((n) => n.triggered)).toBe(true)
  })
})

describe('oscillator layers', () => {
  it('sums to the separate layers and drops silent ones', () => {
    const s = settings({ sub: 0.5, noise: 0 })
    const { layers, sum } = oscLayers(s, 33, 2000)
    expect(layers.map((l) => l.id)).toEqual(['main', 'voice1', 'voice2', 'sub'])
    for (let i = 0; i < sum.length; i += 97) {
      expect(layers.reduce((acc, l) => acc + l.samples[i], 0)).toBeCloseTo(sum[i], 6)
    }
  })

  it('repeats at half the pitch with the sub or voices on', () => {
    const none = settings({ sub: 0 })
    none.patch.voiceOn = false
    expect(repeatHz(none, 110)).toBe(110)
    expect(repeatHz(settings({ sub: 0.5 }), 110)).toBe(55)
  })
})

// PLAN §8 Phase 5, "done when": every parameter has a visible effect in at least one visual.
describe('every parameter shows up in its linked visuals', () => {
  for (const p of PARAMS) {
    it(`${p.label} changes ${PARAM_LINKS[p.id].viz.join(' or ')}`, () => {
      // Stepped controls: their first two positions (e.g. MONO → WET/DRY).
      const [lo, hi] = p.steps ? [0, 1 / (p.steps.length - 1)] : [0.1, 0.9]
      const a = features(computeSnapshot(settings({ [p.id]: lo }), riff, riff.bpm))
      const b = features(computeSnapshot(settings({ [p.id]: hi }), riff, riff.bpm))
      const linked = PARAM_LINKS[p.id].viz
      expect(linked.length).toBeGreaterThan(0)
      // At least a 1% change in the numbers one of its linked visuals draws.
      const biggest = Math.max(
        ...linked.flatMap((v) => a[v].map((group, i) => change(group, b[v][i]))),
      )
      expect(biggest).toBeGreaterThan(0.01)
    })
  }
})

describe('peakEnvelope', () => {
  it('follows the level, not the cycles of the wave', () => {
    const sr = 48000
    // A 55 Hz sine that fades out linearly over one second.
    const x = Float32Array.from(
      { length: sr },
      (_, i) => (1 - i / sr) * Math.sin((2 * Math.PI * 55 * i) / sr),
    )
    const env = peakEnvelope(x, 100, Math.round(0.02 * sr))
    for (let i = 1; i < env.length; i++) expect(env[i]).toBeLessThanOrEqual(env[i - 1] + 1e-6)
    expect(env[0]).toBeGreaterThan(0.95)
    expect(env[99]).toBeLessThan(0.05)
  })
})
