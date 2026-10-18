import { describe, expect, it } from 'vitest'
import { FREQ_MAX, FREQ_MIN, freqPos, magnitudeSpectrum, posFreq } from './analysis'
import {
  columnSummary,
  heat,
  levelOf,
  SPEC_FFT,
  SPEC_ROWS,
  spectrogram,
  spectrogramColumn,
  spectrogramPixels,
  SpectrogramHistory,
} from './spectrogram'

const SR = 48000
const sine = (hz: number, n: number, amp = 0.5) =>
  Float32Array.from({ length: n }, (_, i) => amp * Math.sin((2 * Math.PI * hz * i) / SR))
const rowOf = (hz: number) => Math.floor(freqPos(hz, FREQ_MIN, FREQ_MAX) * SPEC_ROWS)

describe('spectrogram columns', () => {
  it('puts a sine in the row of its frequency (±1 FFT bin or ±1 row, whichever is wider)', () => {
    const binHz = SR / SPEC_FFT
    for (const hz of [55, 440, 3000]) {
      const col = spectrogramColumn(magnitudeSpectrum(sine(hz, SPEC_FFT)), binHz)
      const loudest = col.indexOf(Math.max(...col))
      const rowHz = posFreq((loudest + 0.5) / SPEC_ROWS, FREQ_MIN, FREQ_MAX)
      expect(Math.abs(rowHz - hz)).toBeLessThanOrEqual(Math.max(binHz, 0.07 * hz))
    }
  })

  it('maps level in dB: a −6 dB sine is full scale, silence is 0', () => {
    expect(levelOf(0.5)).toBeCloseTo(1, 2)
    expect(levelOf(0)).toBe(0)
    expect(levelOf(10 ** (-45 / 20))).toBeCloseTo(0.5, 2)
  })

  it('summarizes the loudest and highest rows (within one row, ≈ 7%)', () => {
    const col = spectrogramColumn(magnitudeSpectrum(sine(440, SPEC_FFT)), SR / SPEC_FFT)
    const s = columnSummary(col)!
    expect(s.loudestHz / 440).toBeGreaterThan(0.93)
    expect(s.loudestHz / 440).toBeLessThan(1.07)
    expect(columnSummary(new Float32Array(SPEC_ROWS))).toBeNull()
  })
})

describe('short-time spectrum', () => {
  it('has one column per hop and follows a pitch change', () => {
    const x = new Float32Array(SR)
    x.set(sine(110, SR / 2))
    x.set(sine(1760, SR / 2), SR / 2)
    const g = spectrogram(x, SR, 0.01)
    expect(g.frames).toBe(100)
    const loudest = (f: number) => {
      const col = g.data.subarray(f * g.rows, (f + 1) * g.rows)
      return col.indexOf(Math.max(...col))
    }
    expect(Math.abs(loudest(30) - rowOf(110))).toBeLessThanOrEqual(1)
    expect(Math.abs(loudest(90) - rowOf(1760))).toBeLessThanOrEqual(1)
  })
})

describe('live history', () => {
  it('keeps the newest columns, oldest first, padded with silence', () => {
    const h = new SpectrogramHistory(3, 2)
    h.push([0.1, 0.1])
    expect(Array.from(h.toData().data)).toEqual([0, 0, 0, 0, 0.1, 0.1].map(Math.fround))
    h.push([0.2, 0.2])
    h.push([0.3, 0.3])
    h.push([0.4, 0.4])
    expect(h.length).toBe(3)
    expect(Array.from(h.toData().data)).toEqual([0.2, 0.2, 0.3, 0.3, 0.4, 0.4].map(Math.fround))
    h.clear()
    expect(h.length).toBe(0)
  })
})

describe('pixels', () => {
  it('runs from the background color to near-white, low rows at the bottom', () => {
    expect(heat(0)).toEqual([13, 16, 20])
    expect(heat(1)).toEqual([255, 244, 222])
    const px = spectrogramPixels({ rows: 2, frames: 1, dt: 0, data: Float32Array.of(1, 0) })
    // Row 0 (low) is drawn on the bottom line.
    expect(Array.from(px.subarray(4, 8))).toEqual([255, 244, 222, 255])
    expect(Array.from(px.subarray(0, 4))).toEqual([13, 16, 20, 255])
  })
})
