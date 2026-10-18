import { describe, expect, it } from 'vitest'
import { cents, estimatePitch, midiToHz, rms } from './analysis'
import { Pluck } from './pluck'

const SR = 48000

function play(hz: number, seconds = 1, seed = 1234) {
  const p = new Pluck(SR, seed)
  p.pluck(hz)
  return Float64Array.from({ length: Math.round(SR * seconds) }, () => p.next())
}

describe('Pluck (virtual bass)', () => {
  it.each([28, 33, 38, 43, 50, 55])('MIDI %i is in tune within 5 cents', (midi) => {
    const hz = midiToHz(midi)
    const x = play(hz, 0.6)
    const f = estimatePitch(x.subarray(SR * 0.1), SR, 35, 400)
    expect(Math.abs(cents(f, hz))).toBeLessThan(5)
  })

  it('decays like a plucked string', () => {
    const x = play(55, 2)
    const early = rms(x, 0, SR * 0.2)
    const late = rms(x, SR * 1.6, SR * 2)
    expect(late).toBeLessThan(early * 0.3)
    expect(late).toBeGreaterThan(0)
  })

  it('stops quickly when damped', () => {
    const p = new Pluck(SR)
    p.pluck(55)
    for (let i = 0; i < SR * 0.1; i++) p.next()
    p.damp()
    const after = Float64Array.from({ length: SR * 0.3 }, () => p.next())
    expect(rms(after, SR * 0.2, SR * 0.3)).toBeLessThan(rms(after, 0, SR * 0.02) * 0.05)
  })

  it('is deterministic for a seed', () => {
    expect(play(41.2, 0.1, 7)).toEqual(play(41.2, 0.1, 7))
  })
})
