/**
 * 4-pole (24 dB/octave) resonant low-pass ladder filter, in the zero-delay-feedback /
 * topology-preserving form (Zavalishin, "The Art of VA Filter Design"). The feedback loop is
 * solved per sample, so cutoff and resonance can change every sample without zipper noise.
 *
 * A soft clipper on the input to the stages gives the gentle drive of an analog ladder and
 * keeps very high resonance bounded. The filter runs 2× oversampled to tame the aliasing
 * that clipping and steep resonance create.
 */

/** Cheap, smooth tanh approximation (Padé), exact enough for audio saturation. */
export function softClip(x: number): number {
  if (x > 3) return 1
  if (x < -3) return -1
  const x2 = x * x
  return (x * (27 + x2)) / (27 + 9 * x2)
}

export class LadderFilter {
  #s = [0, 0, 0, 0]
  #lastInput = 0
  readonly #rate: number

  /** How much of the resonance bass loss to make up (0 = classic Moog, 1 = none). */
  bassCompensation = 0.5
  /** Input level into the saturating stage; 1 = clean for normal levels. */
  drive = 1

  constructor(
    sampleRate: number,
    readonly oversample = 2,
  ) {
    this.#rate = sampleRate * oversample
  }

  reset() {
    this.#s = [0, 0, 0, 0]
    this.#lastInput = 0
  }

  /**
   * @param x input sample
   * @param cutoffHz per-pole cutoff
   * @param k feedback amount, 0…<4 (4 = self-oscillation)
   */
  process(x: number, cutoffHz: number, k: number): number {
    const fc = Math.min(Math.max(cutoffHz, 10), this.#rate * 0.45)
    const g = Math.tan((Math.PI * fc) / this.#rate)
    const G = g / (1 + g)
    const comp = 1 + this.bassCompensation * k
    let out = 0
    for (let i = 1; i <= this.oversample; i++) {
      // Linear interpolation between input samples feeds the oversampled steps.
      const xi = this.#lastInput + ((x - this.#lastInput) * i) / this.oversample
      out += this.#step(xi, G, k)
    }
    this.#lastInput = x
    return (out / this.oversample) * comp
  }

  #step(x: number, G: number, k: number): number {
    const s = this.#s
    // Each one-pole stage: y = G·x + (1 − G)·s. Collect the state part of the 4-stage output.
    const S1 = (1 - G) * s[0]
    const S2 = (1 - G) * s[1]
    const S3 = (1 - G) * s[2]
    const S4 = (1 - G) * s[3]
    const G2 = G * G
    const sigma = G2 * G * S1 + G2 * S2 + G * S3 + S4
    // Solve u = x − k·y4 with y4 = G⁴·u + sigma.
    let u = (x - k * sigma) / (1 + k * G2 * G2)
    u = softClip(u * this.drive) / this.drive
    let y = u
    for (let i = 0; i < 4; i++) {
      const v = G * (y - s[i])
      const out = v + s[i]
      s[i] = out + v
      y = out
    }
    return y
  }
}

/** Analytic magnitude response of the linear ladder, for the spectrum overlay and tests. */
export function ladderMagnitude(
  freqHz: number,
  cutoffHz: number,
  k: number,
  bassCompensation = 0.5,
): number {
  const b = freqHz / cutoffHz
  // (1 + jb)^4 + k
  const r2 = 1 - b * b
  const i2 = 2 * b
  const re = r2 * r2 - i2 * i2 + k
  const im = 2 * r2 * i2
  return (1 + bassCompensation * k) / Math.hypot(re, im)
}
