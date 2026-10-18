import { describe, expect, it } from 'vitest'
import { magnitudeAt, peak, toDb } from './analysis'
import { LadderFilter, ladderMagnitude, softClip } from './ladder'

const SR = 48000

/** Steady-state gain of the filter for a quiet sine (quiet keeps the saturation linear). */
function gainAt(freq: number, cutoff: number, k: number) {
  const f = new LadderFilter(SR)
  const n = SR / 2
  const amp = 0.01
  const out = new Float64Array(n)
  for (let i = 0; i < n; i++)
    out[i] = f.process(amp * Math.sin((2 * Math.PI * freq * i) / SR), cutoff, k)
  return magnitudeAt(out.subarray(n / 2), freq, SR) / amp
}

describe('LadderFilter', () => {
  it('passes the bass with unity gain when resonance is off', () => {
    expect(toDb(gainAt(50, 2000, 0))).toBeCloseTo(0, 0)
  })

  it('rolls off at 24 dB per octave well above the cutoff', () => {
    const cutoff = 200
    const slope = toDb(gainAt(3200, cutoff, 0)) - toDb(gainAt(1600, cutoff, 0))
    expect(slope).toBeGreaterThan(-27)
    expect(slope).toBeLessThan(-21)
  })

  it('matches the analytic response within 1 dB', () => {
    for (const k of [0, 2, 3.5]) {
      for (const freq of [100, 400, 800, 1600]) {
        const measured = toDb(gainAt(freq, 400, k))
        expect(Math.abs(measured - toDb(ladderMagnitude(freq, 400, k)))).toBeLessThan(1)
      }
    }
  })

  it('grows a bigger peak at the cutoff as resonance rises', () => {
    const peaks = [0, 1, 2, 3, 3.7].map((k) => toDb(gainAt(500, 500, k)))
    for (let i = 1; i < peaks.length; i++) expect(peaks[i]).toBeGreaterThan(peaks[i - 1])
  })

  it('stays finite and bounded at maximum resonance with a loud input', () => {
    const f = new LadderFilter(SR)
    const out = new Float64Array(SR)
    for (let i = 0; i < SR; i++) {
      const saw = 2 * ((i * 55) / SR - Math.floor((i * 55) / SR)) - 1
      out[i] = f.process(saw * 2, 300 + 5000 * Math.abs(Math.sin(i / 3000)), 3.9)
    }
    expect(out.every(Number.isFinite)).toBe(true)
    expect(peak(out)).toBeLessThan(6)
  })

  it('handles cutoff changes every sample', () => {
    const f = new LadderFilter(SR)
    let last = 0
    for (let i = 0; i < SR / 10; i++) last = f.process(Math.sin(i / 10), i % 2 ? 20000 : 20, 2)
    expect(Number.isFinite(last)).toBe(true)
  })
})

describe('softClip', () => {
  it('is nearly linear for small signals and saturates at ±1', () => {
    expect(softClip(0.01)).toBeCloseTo(0.01, 4)
    expect(softClip(10)).toBe(1)
    expect(softClip(-10)).toBe(-1)
    expect(softClip(1)).toBeCloseTo(Math.tanh(1), 1)
  })
})
