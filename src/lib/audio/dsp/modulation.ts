/** Control-rate building blocks: envelopes, glide, LFO and a level follower. */

/**
 * Attack–decay envelope for the filter (ENVELOPE knob): a linear rise to 1 over `attackMs`,
 * then an exponential fall that reaches 5% after `decayMs`. Retriggers on every note.
 */
export class ADEnvelope {
  value = 0
  #stage: 'idle' | 'attack' | 'decay' = 'idle'
  #attackStep = 1
  #decayCoef = 0

  constructor(readonly sampleRate: number) {}

  trigger(attackMs: number, decayMs: number) {
    this.#attackStep = 1 / Math.max(1, (attackMs / 1000) * this.sampleRate)
    // e^(−3) ≈ 0.05: the value is down to 5% after decayMs.
    this.#decayCoef = Math.exp(-3 / Math.max(1, (decayMs / 1000) * this.sampleRate))
    this.#stage = 'attack'
  }

  next(): number {
    if (this.#stage === 'attack') {
      this.value += this.#attackStep
      if (this.value >= 1) {
        this.value = 1
        this.#stage = 'decay'
      }
    } else if (this.#stage === 'decay') {
      this.value *= this.#decayCoef
      if (this.value < 1e-5) {
        this.value = 0
        this.#stage = 'idle'
      }
    }
    return this.value
  }
}

/** Fade-in for each note (AMP ENV): a linear ramp from 0 to 1 over `attackMs`. */
export class FadeIn {
  value = 1
  #step = 1

  constructor(readonly sampleRate: number) {}

  trigger(attackMs: number) {
    this.#step = 1 / Math.max(1, (attackMs / 1000) * this.sampleRate)
    this.value = this.#step >= 1 ? 1 : 0
  }

  next(): number {
    if (this.value < 1) this.value = Math.min(1, this.value + this.#step)
    return this.value
  }
}

/**
 * Portamento in the pitch domain (semitones), so a glide sounds even across the neck.
 * Every glide takes exactly `glideMs`, whatever the interval.
 */
export class Glide {
  semitones: number | null = null
  #target = 0
  #step = 0
  #remaining = 0

  constructor(readonly sampleRate: number) {}

  setTarget(semitones: number, glideMs: number) {
    this.#target = semitones
    const samples = Math.round((glideMs / 1000) * this.sampleRate)
    if (this.semitones === null || samples < 1) {
      this.semitones = semitones
      this.#remaining = 0
    } else {
      this.#step = (semitones - this.semitones) / samples
      this.#remaining = samples
    }
  }

  next(): number {
    if (this.semitones === null) return this.#target
    if (this.#remaining > 0) {
      this.#remaining--
      this.semitones = this.#remaining === 0 ? this.#target : this.semitones + this.#step
    }
    return this.semitones
  }
}

/** Sine LFO, output −1…1. */
export class Lfo {
  phase = 0
  rateHz = 1

  constructor(readonly sampleRate: number) {}

  next(): number {
    const y = Math.sin(2 * Math.PI * this.phase)
    this.phase += this.rateHz / this.sampleRate
    if (this.phase >= 1) this.phase -= 1
    return y
  }
}

/** Peak follower with separate attack and release, used for the "synth follows your note" level. */
export class Follower {
  value = 0
  #attack: number
  #release: number

  constructor(
    readonly sampleRate: number,
    attackMs = 1,
    releaseMs = 80,
  ) {
    this.#attack = Math.exp(-1 / ((attackMs / 1000) * sampleRate))
    this.#release = Math.exp(-1 / ((releaseMs / 1000) * sampleRate))
  }

  next(x: number): number {
    const level = Math.abs(x)
    const coef = level > this.value ? this.#attack : this.#release
    this.value = level + coef * (this.value - level)
    return this.value
  }
}
