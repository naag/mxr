import { describe, expect, it } from 'vitest'
import { zeroCrossingPitch } from './analysis'
import { ADEnvelope, FadeIn, Follower, Glide, Lfo } from './modulation'

const SR = 48000
const samples = (ms: number) => Math.round((ms / 1000) * SR)

describe('ADEnvelope', () => {
  it('reaches 1 after the attack and 5% after the decay (±5%)', () => {
    const env = new ADEnvelope(SR)
    env.trigger(20, 400)
    let v = 0
    for (let i = 0; i < samples(20); i++) v = env.next()
    expect(v).toBeCloseTo(1, 2)
    for (let i = 0; i < samples(400); i++) v = env.next()
    expect(v).toBeGreaterThan(0.05 * 0.95)
    expect(v).toBeLessThan(0.05 * 1.05)
  })

  it('retriggers from where it is', () => {
    const env = new ADEnvelope(SR)
    env.trigger(10, 100)
    for (let i = 0; i < samples(50); i++) env.next()
    const mid = env.value
    env.trigger(10, 100)
    expect(env.next()).toBeGreaterThan(mid)
  })
})

describe('FadeIn', () => {
  it('ramps up over the attack time', () => {
    const f = new FadeIn(SR)
    f.trigger(100)
    let v = 0
    for (let i = 0; i < samples(50); i++) v = f.next()
    expect(v).toBeCloseTo(0.5, 2)
    for (let i = 0; i < samples(60); i++) v = f.next()
    expect(v).toBe(1)
  })

  it('is instant for tiny attack times', () => {
    const f = new FadeIn(SR)
    f.trigger(0.001)
    expect(f.value).toBe(1)
  })
})

describe('Glide', () => {
  it('jumps on the first note and with zero glide', () => {
    const g = new Glide(SR)
    g.setTarget(33, 300)
    expect(g.next()).toBe(33)
    g.setTarget(45, 0)
    expect(g.next()).toBe(45)
  })

  it('reaches the next note in exactly the glide time, linearly in semitones', () => {
    const g = new Glide(SR)
    g.setTarget(33, 0)
    g.next()
    g.setTarget(45, 200)
    let v = 0
    for (let i = 0; i < samples(100); i++) v = g.next()
    expect(v).toBeCloseTo(39, 1)
    for (let i = 0; i < samples(100); i++) v = g.next()
    expect(v).toBe(45)
  })

  it('glides downwards too', () => {
    const g = new Glide(SR)
    g.setTarget(45, 0)
    g.next()
    g.setTarget(33, 50)
    for (let i = 0; i < samples(60); i++) g.next()
    expect(g.next()).toBe(33)
  })
})

describe('Lfo', () => {
  it('runs at its rate', () => {
    const lfo = new Lfo(SR)
    lfo.rateHz = 5
    const x = Float64Array.from({ length: SR * 2 }, () => lfo.next())
    expect(zeroCrossingPitch(x, SR)).toBeCloseTo(5, 2)
  })
})

describe('Follower', () => {
  it('rises fast and falls slowly', () => {
    const f = new Follower(SR, 1, 80)
    for (let i = 0; i < samples(10); i++) f.next(1)
    expect(f.value).toBeGreaterThan(0.99)
    for (let i = 0; i < samples(80); i++) f.next(0)
    expect(f.value).toBeCloseTo(Math.exp(-1), 2)
  })
})
