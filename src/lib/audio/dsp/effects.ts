import { Lfo } from './modulation'

/**
 * Stereo chorus: two delay lines swept by opposite LFO phases. `depth` 0 is a clean pass-
 * through; 1 is a deep, wide shimmer.
 */
export class Chorus {
  readonly #buf: Float32Array
  #write = 0
  readonly #lfo: Lfo

  constructor(readonly sampleRate: number) {
    this.#buf = new Float32Array(Math.ceil(sampleRate * 0.05))
    this.#lfo = new Lfo(sampleRate)
    this.#lfo.rateHz = 0.6
  }

  #read(delaySamples: number): number {
    const len = this.#buf.length
    let pos = this.#write - delaySamples
    while (pos < 0) pos += len
    const i = Math.floor(pos)
    const frac = pos - i
    return this.#buf[i % len] * (1 - frac) + this.#buf[(i + 1) % len] * frac
  }

  process(x: number, depth: number, out: [number, number]): void {
    this.#buf[this.#write] = x
    const sweep = this.#lfo.next()
    const base = 0.012 * this.sampleRate
    const swing = 0.004 * this.sampleRate * depth
    const left = this.#read(base + swing * sweep)
    const right = this.#read(base - swing * sweep)
    this.#write = (this.#write + 1) % this.#buf.length
    const wet = 0.5 * depth
    out[0] = x * (1 - wet) + left * wet
    out[1] = x * (1 - wet) + right * wet
  }
}

/**
 * Feed-forward compressor with a linked stereo detector. `amount` 0 is off; 1 is tight
 * limiting (high ratio, low threshold). Gives back part of the gain it takes, so turning it up
 * sounds denser rather than just quieter.
 */
export class Compressor {
  #env = 0
  readonly #attack: number
  readonly #release: number
  /** Last gain reduction in dB (≤ 0), for the meter. */
  reductionDb = 0

  constructor(readonly sampleRate: number) {
    this.#attack = Math.exp(-1 / (0.003 * sampleRate))
    this.#release = Math.exp(-1 / (0.12 * sampleRate))
  }

  process(l: number, r: number, amount: number, out: [number, number]): void {
    if (amount <= 0.005) {
      this.reductionDb = 0
      out[0] = l
      out[1] = r
      return
    }
    const level = Math.max(Math.abs(l), Math.abs(r))
    const coef = level > this.#env ? this.#attack : this.#release
    this.#env = level + coef * (this.#env - level)
    const thresholdDb = -6 - 30 * amount
    const ratio = 1 + 19 * amount
    const levelDb = 20 * Math.log10(Math.max(this.#env, 1e-6))
    const over = Math.max(0, levelDb - thresholdDb)
    this.reductionDb = -over * (1 - 1 / ratio)
    const makeupDb = -thresholdDb * (1 - 1 / ratio) * 0.5
    const gain = 10 ** ((this.reductionDb + makeupDb) / 20)
    out[0] = l * gain
    out[1] = r * gain
  }
}
