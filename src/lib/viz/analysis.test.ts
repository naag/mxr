import { describe, expect, it } from 'vitest'
import { Oscillator } from '../audio/dsp/oscillator'
import {
  centroidOf,
  dB,
  findTrigger,
  freqPos,
  harmonicLevels,
  magnitudeSpectrum,
  PeakHold,
  posFreq,
  resample,
  scopeWindow,
} from './analysis'

const SR = 48000

function saw(hz: number, n: number, phase = 0) {
  const o = new Oscillator(SR)
  o.setFrequency(hz)
  o.phase = phase
  return Float32Array.from({ length: n }, () => o.next('saw'))
}

/** A wave with several rising zero crossings per cycle, like a resonant filter output. */
function ringing(hz: number, n: number, offset: number) {
  return Float32Array.from({ length: n }, (_, i) => {
    const t = ((i + offset) * hz) / SR
    return Math.sin(2 * Math.PI * t) + 0.6 * Math.sin(2 * Math.PI * 5 * t + 0.7)
  })
}

describe('findTrigger', () => {
  it('finds the same point of the cycle wherever the buffer starts (±0.05 samples)', () => {
    const hz = 55
    const period = SR / hz
    const phases = [0, 37, 211, 503, 777].map((offset) => {
      const x = ringing(hz, 4096, offset)
      const t = findTrigger(x, period, 100)
      return (t + offset) % period
    })
    for (const p of phases) expect(Math.abs(p - phases[0])).toBeLessThan(0.05)
  })

  it('lands on a rising zero crossing of a sawtooth', () => {
    const x = saw(110, 2048, 0.3)
    const t = findTrigger(x, SR / 110, 10)
    const i = Math.floor(t)
    expect(x[i]).toBeLessThan(0)
    expect(x[i + 1]).toBeGreaterThanOrEqual(0)
  })

  it('returns the search start for silence', () => {
    expect(findTrigger(new Float32Array(1000), 200, 50)).toBe(50)
  })
})

describe('scopeWindow', () => {
  it('shows whole cycles that start at the trigger', () => {
    const hz = 55
    const w = scopeWindow(ringing(hz, 8192, 123), SR / hz, 400, 2)
    expect(w.cycles).toBe(2)
    expect(w.length).toBeCloseTo((2 * SR) / hz, 6)
    // A stable trigger: both ends sit on the same rising crossing (±0.02 of full scale).
    expect(Math.abs(w.samples[0])).toBeLessThan(0.02)
    expect(Math.abs(w.samples[399])).toBeLessThan(0.05)
  })

  it('shows fewer cycles when the buffer is too short', () => {
    const w = scopeWindow(ringing(30, 4096, 0), SR / 30, 100, 3)
    expect(w.cycles).toBe(1)
  })

  it('resamples with linear interpolation', () => {
    expect(Array.from(resample([0, 1, 2, 3], 0.5, 2, 3))).toEqual([0.5, 1.5, 2.5])
  })
})

describe('spectrum', () => {
  it('reads a unit sine as about 0 dB at its bin (±0.5 dB)', () => {
    const n = 8192
    const k = 200
    const x = Float32Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * k * i) / n))
    const s = magnitudeSpectrum(x)
    expect(Math.abs(dB(s[k]))).toBeLessThan(0.5)
  })

  it('finds sawtooth harmonics falling as 1/n (±1.5 dB for the first 8)', () => {
    const hz = 110
    const x = saw(hz, 8192)
    const s = magnitudeSpectrum(x)
    const h = harmonicLevels(s, SR / 8192, hz, 12000)
    expect(h.length).toBe(Math.min(96, Math.floor(12000 / hz)))
    for (let n = 1; n <= 8; n++) expect(Math.abs(dB(h[n - 1] / h[0]) - dB(1 / n))).toBeLessThan(1.5)
  })

  it('caps the number of harmonics and handles no pitch', () => {
    const s = new Float32Array(4096)
    expect(harmonicLevels(s, 5.86, 20, 12000, 50).length).toBe(50)
    expect(harmonicLevels(s, 5.86, 0, 12000).length).toBe(0)
  })

  it('puts the centroid of a pure tone at its frequency (±2%)', () => {
    const n = 8192
    const x = Float32Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * 1000 * i) / SR))
    expect(centroidOf(magnitudeSpectrum(x), SR / n)).toBeGreaterThan(980)
    expect(centroidOf(magnitudeSpectrum(x), SR / n)).toBeLessThan(1020)
  })
})

describe('axes and helpers', () => {
  it('maps frequency to a log axis and back', () => {
    expect(freqPos(20)).toBeCloseTo(0)
    expect(freqPos(12000)).toBeCloseTo(1)
    expect(posFreq(freqPos(440))).toBeCloseTo(440, 6)
    expect(freqPos(200) - freqPos(100)).toBeCloseTo(freqPos(2000) - freqPos(1000), 9)
  })

  it('holds peaks and lets them decay', () => {
    const p = new PeakHold(0.5)
    expect(p.next(1)).toBe(1)
    expect(p.next(0)).toBe(0.5)
    expect(p.next(0.8)).toBe(0.8)
  })
})
