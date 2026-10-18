import { describe, expect, it } from 'vitest'
import { rms } from './analysis'
import { Chorus, Compressor } from './effects'

const SR = 48000

describe('Chorus', () => {
  it('passes the signal through untouched at zero depth', () => {
    const c = new Chorus(SR)
    const out: [number, number] = [0, 0]
    for (let i = 0; i < 2000; i++) {
      const x = Math.sin(i / 7)
      c.process(x, 0, out)
      expect(out[0]).toBe(x)
      expect(out[1]).toBe(x)
    }
  })

  it('makes left and right differ (width) when turned up', () => {
    const c = new Chorus(SR)
    const out: [number, number] = [0, 0]
    let diff = 0
    for (let i = 0; i < SR; i++) {
      c.process(Math.sin((2 * Math.PI * 220 * i) / SR), 1, out)
      if (i > SR / 2) diff += Math.abs(out[0] - out[1])
    }
    expect(diff / (SR / 2)).toBeGreaterThan(0.05)
  })
})

describe('Compressor', () => {
  function levels(amount: number) {
    const c = new Compressor(SR)
    const out: [number, number] = [0, 0]
    const loud: number[] = []
    const quiet: number[] = []
    for (let i = 0; i < SR; i++) {
      const amp = i < SR / 2 ? 0.9 : 0.1
      const x = amp * Math.sin((2 * Math.PI * 110 * i) / SR)
      c.process(x, x, amount, out)
      if (i > SR / 4 && i < SR / 2) loud.push(out[0])
      if (i > (3 * SR) / 4) quiet.push(out[0])
    }
    return rms(loud) / rms(quiet)
  }

  it('is a clean pass-through at zero', () => {
    expect(levels(0)).toBeCloseTo(9, 1)
  })

  it('narrows the gap between loud and quiet notes as it is turned up', () => {
    const off = levels(0)
    const mid = levels(0.5)
    const max = levels(1)
    expect(mid).toBeLessThan(off)
    expect(max).toBeLessThan(mid)
    expect(max).toBeLessThan(2)
  })
})
