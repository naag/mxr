import { Noise } from './oscillator'

/**
 * Karplus–Strong plucked string: the "virtual bass" that stands in for a real instrument.
 * A noise burst circulates in a delay line one period long; an averaging filter in the loop
 * makes it decay and mellow like a string. A first-order allpass supplies the fractional
 * part of the delay so every note is in tune.
 */
export class Pluck {
  #buf = new Float32Array(1)
  #len = 1
  #pos = 0
  #prev = 0
  #apCoef = 0
  #apX = 0
  #apY = 0
  #decay = 0.996
  #noise: Noise
  #dcX = 0
  #dcY = 0

  constructor(
    readonly sampleRate: number,
    seed = 1234,
  ) {
    this.#noise = new Noise(seed)
  }

  /**
   * @param velocity 0–1 pick strength
   * @param brightness 0–1: how much high end the pick puts in (finger vs pick)
   */
  pluck(hz: number, velocity = 0.8, brightness = 0.5) {
    // The averaging filter adds half a sample of delay; the allpass adds about (1 − c)/(1 + c).
    const period = this.sampleRate / hz - 0.5
    const whole = Math.max(2, Math.floor(period - 0.1))
    const frac = period - whole
    this.#apCoef = (1 - frac) / (1 + frac)
    this.#len = whole
    if (this.#buf.length < whole) this.#buf = new Float32Array(whole * 2)
    // Burst: noise, softened by a one-pole low-pass (a softer pick = more filtering).
    const smooth = 0.2 + 0.75 * (1 - brightness)
    let lp = 0
    for (let i = 0; i < whole; i++) {
      lp = lp + (1 - smooth) * (this.#noise.next() - lp)
      this.#buf[i] = lp * velocity
    }
    // Remove the burst's DC so the string doesn't thump.
    let mean = 0
    for (let i = 0; i < whole; i++) mean += this.#buf[i]
    mean /= whole
    for (let i = 0; i < whole; i++) this.#buf[i] -= mean
    this.#pos = 0
    this.#prev = 0
    this.#apX = 0
    this.#apY = 0
    // Low notes ring longer; scale the loss so the decay time is similar across the neck.
    this.#decay = Math.pow(0.0015, 1 / (hz * 4))
  }

  /** Mutes the string (finger lifted). */
  damp() {
    this.#decay = Math.min(this.#decay, Math.pow(0.001, 1 / ((this.sampleRate * 0.06) / this.#len)))
  }

  next(): number {
    const cur = this.#buf[this.#pos]
    const avg = 0.5 * (cur + this.#prev) * this.#decay
    this.#prev = cur
    // Fractional delay (first-order allpass).
    const y = this.#apCoef * (avg - this.#apY) + this.#apX
    this.#apX = avg
    this.#apY = y
    this.#buf[this.#pos] = y
    this.#pos = (this.#pos + 1) % this.#len
    // DC blocker.
    const out = cur - this.#dcX + 0.995 * this.#dcY
    this.#dcX = cur
    this.#dcY = out
    return out
  }
}
