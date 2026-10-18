import type { Shape } from '../../pedal/presets'

/**
 * PolyBLEP correction: smooths the jump in a naive sawtooth or square so it doesn't alias.
 * `t` is the phase (0–1), `dt` the phase increment per sample.
 */
export function polyBlep(t: number, dt: number): number {
  if (t < dt) {
    const x = t / dt
    return x + x - x * x - 1
  }
  if (t > 1 - dt) {
    const x = (t - 1) / dt
    return x * x + x + x + 1
  }
  return 0
}

/** Band-limited oscillator with triangle, sawtooth and square shapes, output −1…1. */
export class Oscillator {
  phase = 0
  /** Counts completed cycles; the sub-oscillator divides this by two. */
  cycles = 0
  dt = 0

  constructor(readonly sampleRate: number) {}

  setFrequency(hz: number) {
    this.dt = Math.min(Math.max(hz / this.sampleRate, 0), 0.45)
  }

  /** Value at the current phase, then advances one sample. */
  next(shape: Shape): number {
    const t = this.phase
    const dt = this.dt
    let y: number
    if (shape === 'saw') {
      // Rising ramp, matching the ◿ symbol on the pedal.
      y = 2 * t - 1 - polyBlep(t, dt)
    } else if (shape === 'square') {
      y = (t < 0.5 ? 1 : -1) + polyBlep(t, dt) - polyBlep((t + 0.5) % 1, dt)
    } else {
      // A triangle's harmonics fall at 12 dB/octave, so the naive form aliases very little.
      y = 1 - 4 * Math.abs(t - 0.5)
    }
    this.phase += dt
    if (this.phase >= 1) {
      this.phase -= 1
      this.cycles++
    }
    return y
  }
}

/**
 * Square wave one octave below `main`, locked to its phase like the flip-flop divider in
 * analog octave pedals (ASSUMPTION: the MB301's sub is a square, docs/pedal-reference.md §3).
 * Call `next()` right before `main.next()` each sample.
 */
export function subOctave(main: Oscillator): number {
  const t = ((main.cycles % 2) + main.phase) / 2
  const dt = main.dt / 2
  return (t < 0.5 ? 1 : -1) + polyBlep(t, dt) - polyBlep((t + 0.5) % 1, dt)
}

/** Seeded white noise (xorshift32), output −1…1. Deterministic for tests. */
export class Noise {
  #state: number

  constructor(seed = 0x9e3779b9) {
    this.#state = seed >>> 0 || 1
  }

  next(): number {
    let x = this.#state
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    this.#state = x >>> 0
    return (this.#state / 0xffffffff) * 2 - 1
  }
}
