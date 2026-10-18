import { describe, expect, it } from 'vitest'
import { cents, magnitudeAt, peak, rms, toDb, zeroCrossingPitch } from './analysis'
import { Noise, Oscillator, subOctave } from './oscillator'

const SR = 48000

function render(shape: 'triangle' | 'saw' | 'square', hz: number, seconds = 0.5) {
  const osc = new Oscillator(SR)
  osc.setFrequency(hz)
  return Float64Array.from({ length: Math.round(SR * seconds) }, () => osc.next(shape))
}

describe('Oscillator', () => {
  it.each(['triangle', 'saw', 'square'] as const)('%s plays in tune (±0.5 cent)', (shape) => {
    for (const hz of [41.2, 110, 440]) {
      expect(Math.abs(cents(zeroCrossingPitch(render(shape, hz), SR), hz))).toBeLessThan(0.5)
    }
  })

  it('stays inside −1…1 (with a little PolyBLEP overshoot)', () => {
    for (const shape of ['triangle', 'saw', 'square'] as const) {
      expect(peak(render(shape, 1000))).toBeLessThan(1.1)
    }
  })

  it('sawtooth has every harmonic at about 1/n', () => {
    const x = render('saw', 200)
    const h1 = magnitudeAt(x, 200, SR)
    for (const n of [2, 3, 4, 5]) {
      expect(toDb(magnitudeAt(x, 200 * n, SR) / h1)).toBeCloseTo(toDb(1 / n), 0)
    }
  })

  it('square has only odd harmonics, at about 1/n', () => {
    const x = render('square', 200)
    const h1 = magnitudeAt(x, 200, SR)
    expect(toDb(magnitudeAt(x, 600, SR) / h1)).toBeCloseTo(toDb(1 / 3), 0)
    expect(toDb(magnitudeAt(x, 1000, SR) / h1)).toBeCloseTo(toDb(1 / 5), 0)
    expect(toDb(magnitudeAt(x, 400, SR) / h1)).toBeLessThan(-40)
    expect(toDb(magnitudeAt(x, 800, SR) / h1)).toBeLessThan(-40)
  })

  it('triangle has quickly fading odd harmonics (about 1/n²)', () => {
    const x = render('triangle', 200)
    const h1 = magnitudeAt(x, 200, SR)
    expect(toDb(magnitudeAt(x, 600, SR) / h1)).toBeCloseTo(toDb(1 / 9), 0)
    expect(toDb(magnitudeAt(x, 400, SR) / h1)).toBeLessThan(-40)
  })

  it('keeps aliasing low on a bright note', () => {
    // 3 kHz saw at 48 kHz: the 9th harmonic (27 kHz) would fold back to 21 kHz,
    // the 17th to 3 kHz below… Measure a frequency that only aliasing could produce.
    const x = render('saw', 3000)
    const fundamental = magnitudeAt(x, 3000, SR)
    const alias = magnitudeAt(x, 48000 - 9 * 3000 - 1000, SR) // between harmonics
    expect(toDb(alias / fundamental)).toBeLessThan(-40)
  })

  it('has no DC offset', () => {
    for (const shape of ['triangle', 'saw', 'square'] as const) {
      const x = render(shape, 100, 1)
      const mean = x.reduce((a, b) => a + b, 0) / x.length
      expect(Math.abs(mean)).toBeLessThan(0.01)
    }
  })
})

describe('subOctave', () => {
  it('is one octave down and phase-locked to the main oscillator', () => {
    const osc = new Oscillator(SR)
    osc.setFrequency(110)
    const sub = Float64Array.from({ length: SR / 2 }, () => {
      const s = subOctave(osc)
      osc.next('saw')
      return s
    })
    expect(Math.abs(cents(zeroCrossingPitch(sub, SR), 55))).toBeLessThan(0.5)
    // It flips exactly when the main oscillator wraps every second cycle.
    let flips = 0
    for (let i = 1; i < sub.length; i++) if (Math.sign(sub[i]) !== Math.sign(sub[i - 1])) flips++
    expect(Math.abs(flips - 55)).toBeLessThanOrEqual(1)
  })
})

describe('Noise', () => {
  it('is deterministic for a seed and roughly uniform', () => {
    const a = new Noise(42)
    const b = new Noise(42)
    const xs = Array.from({ length: 10000 }, () => a.next())
    expect(xs.slice(0, 5)).toEqual(Array.from({ length: 5 }, () => b.next()))
    expect(peak(xs)).toBeLessThanOrEqual(1)
    expect(rms(xs)).toBeCloseTo(1 / Math.sqrt(3), 1)
  })
})
