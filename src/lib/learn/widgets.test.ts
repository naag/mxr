import { describe, expect, it } from 'vitest'
import { cutoffHz } from '../pedal/params'
import { errorOf, harmonicAmplitude, partialSum } from './additive'
import { illustration, type IllustrationId } from './illustrations'
import { lfoView } from './lfo'

describe('additive demo', () => {
  it('uses every harmonic for the saw and only odd ones for the square', () => {
    expect(harmonicAmplitude('saw', 2)).not.toBe(0)
    expect(harmonicAmplitude('square', 2)).toBe(0)
    expect(partialSum('square', 3, 50).newestHarmonic).toBe(5)
    expect(partialSum('saw', 3, 50).newestHarmonic).toBe(3)
  })

  it('gets closer to the target wave with every harmonic', () => {
    for (const target of ['saw', 'square'] as const) {
      let last = Infinity
      for (const n of [1, 2, 4, 8, 16]) {
        const e = errorOf(target, n)
        expect(e).toBeLessThan(last)
        last = e
      }
      // 16 harmonics: within 5% mean squared error of the ideal wave.
      expect(last).toBeLessThan(0.05)
    }
  })

  it('starts as a pure sine', () => {
    const { sum, newest } = partialSum('saw', 1, 64)
    expect(Array.from(sum)).toEqual(Array.from(newest))
  })
})

describe('LFO widget', () => {
  it('does nothing with MOD at minimum', () => {
    const v = lfoView(0, 1, 0.5, 0.3)
    expect(v.depthOct).toBe(0)
    expect(v.cutoffNow).toBeCloseTo(cutoffHz(0.5))
  })

  it('moves the cutoff by up to 1.5 octaves at full MOD and MOD BLEND', () => {
    const v = lfoView(1, 1, 0.5, 0)
    expect(v.depthOct).toBeCloseTo(1.5)
    expect(v.cutoffMax / v.cutoffMin).toBeCloseTo(2 ** 3)
    // A quarter period in, the LFO is at its peak.
    const peak = lfoView(1, 1, 0.5, 0.25 / v.rateHz)
    expect(peak.value).toBeCloseTo(1)
    expect(peak.cutoffNow).toBeCloseTo(v.cutoffMax)
  })

  it('leaves the cutoff alone when MOD BLEND is all chorus', () => {
    expect(lfoView(1, 0, 0.5, 0.1).depthOct).toBe(0)
  })
})

describe('glossary illustrations', () => {
  const ids: IllustrationId[] = [
    'sine',
    'triangle',
    'saw',
    'square',
    'harmonics',
    'octave',
    'noise',
    'lowpass',
    'resonance',
    'envelope',
    'swell',
    'lfo',
    'chorus',
    'glide',
    'gate',
    'compression',
  ]
  it.each(ids)('%s draws inside its box', (id) => {
    const paths = illustration(id)
    expect(paths.some((p) => p.tone === 'main')).toBe(true)
    for (const p of paths) {
      expect(p.d).not.toMatch(/NaN|Infinity/)
      const nums = p.d.match(/-?\d+(\.\d+)?/g)!.map(Number)
      for (const n of nums) expect(n).toBeGreaterThanOrEqual(-0.5)
      for (const n of nums) expect(n).toBeLessThanOrEqual(120.5)
    }
  })
})
