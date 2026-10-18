/** Small signal-analysis helpers for tests and, later, the visualizers. */

export function rms(x: ArrayLike<number>, from = 0, to = x.length): number {
  let sum = 0
  for (let i = from; i < to; i++) sum += x[i] * x[i]
  return Math.sqrt(sum / Math.max(1, to - from))
}

export function peak(x: ArrayLike<number>): number {
  let p = 0
  for (let i = 0; i < x.length; i++) p = Math.max(p, Math.abs(x[i]))
  return p
}

export const toDb = (gain: number) => 20 * Math.log10(Math.max(gain, 1e-12))

/** Magnitude of one frequency component (Goertzel), normalized so a unit sine reads 1. */
export function magnitudeAt(x: ArrayLike<number>, freq: number, sampleRate: number): number {
  const n = x.length
  const w = (2 * Math.PI * freq) / sampleRate
  const c = 2 * Math.cos(w)
  let s1 = 0
  let s2 = 0
  for (let i = 0; i < n; i++) {
    // Hann window keeps leakage from neighbouring harmonics out of the reading.
    const win = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))
    const s0 = x[i] * win + c * s1 - s2
    s2 = s1
    s1 = s0
  }
  const power = s1 * s1 + s2 * s2 - c * s1 * s2
  return (2 * Math.sqrt(Math.max(power, 0))) / (n * 0.5)
}

/** In-place radix-2 FFT. `re` and `im` must have the same power-of-two length. */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    const wr = Math.cos(ang)
    const wi = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let cr = 1
      let ci = 0
      for (let k = 0; k < len / 2; k++) {
        const a = i + k
        const b = a + len / 2
        const tr = re[b] * cr - im[b] * ci
        const ti = re[b] * ci + im[b] * cr
        re[b] = re[a] - tr
        im[b] = im[a] - ti
        re[a] += tr
        im[a] += ti
        const ncr = cr * wr - ci * wi
        ci = cr * wi + ci * wr
        cr = ncr
      }
    }
  }
}

/** Amplitude-weighted mean frequency: a single number for "brightness". */
export function spectralCentroid(x: ArrayLike<number>, sampleRate: number): number {
  let n = 1
  while (n * 2 <= x.length) n *= 2
  const re = new Float64Array(n)
  const im = new Float64Array(n)
  for (let i = 0; i < n; i++) re[i] = x[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)))
  fft(re, im)
  let num = 0
  let den = 0
  for (let k = 1; k < n / 2; k++) {
    const mag = Math.hypot(re[k], im[k])
    num += mag * ((k * sampleRate) / n)
    den += mag
  }
  return den > 0 ? num / den : 0
}

/** Fundamental frequency by autocorrelation, searching between `minHz` and `maxHz`. */
export function estimatePitch(
  x: ArrayLike<number>,
  sampleRate: number,
  minHz = 30,
  maxHz = 1000,
): number {
  const minLag = Math.floor(sampleRate / maxHz)
  const maxLag = Math.min(Math.ceil(sampleRate / minHz), Math.floor(x.length / 2))
  const n = x.length - maxLag
  const corr = (lag: number) => {
    let s = 0
    for (let i = 0; i < n; i++) s += x[i] * x[i + lag]
    return s
  }
  const values = new Float64Array(maxLag + 2)
  for (let lag = minLag; lag <= maxLag + 1; lag++) values[lag] = corr(lag)
  // Take the first peak that comes close to the best one, so octave-down lags don't win.
  let best = minLag
  for (let lag = minLag; lag <= maxLag; lag++) if (values[lag] > values[best]) best = lag
  let pick = best
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (
      values[lag] > values[lag - 1] &&
      values[lag] >= values[lag + 1] &&
      values[lag] > 0.9 * values[best]
    ) {
      pick = lag
      break
    }
  }
  // Parabolic interpolation around the peak for sub-sample accuracy.
  const a = values[pick - 1]
  const b = values[pick]
  const c = values[pick + 1]
  const offset = (a - c) / (2 * (a - 2 * b + c) || 1)
  return sampleRate / (pick + offset)
}

export const cents = (f: number, reference: number) => 1200 * Math.log2(f / reference)

export const midiToHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

/**
 * Frequency from the average spacing of rising zero crossings (linearly interpolated).
 * Very accurate for clean periodic waves with one rising crossing per cycle.
 */
export function zeroCrossingPitch(x: ArrayLike<number>, sampleRate: number): number {
  const crossings: number[] = []
  for (let i = 1; i < x.length; i++) {
    if (x[i - 1] < 0 && x[i] >= 0) crossings.push(i - 1 + -x[i - 1] / (x[i] - x[i - 1]))
  }
  if (crossings.length < 2) return 0
  const period = (crossings[crossings.length - 1] - crossings[0]) / (crossings.length - 1)
  return sampleRate / period
}
