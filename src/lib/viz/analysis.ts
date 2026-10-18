/**
 * Analysis for the visuals: a pitch-synchronous scope trigger, magnitude spectra, harmonic
 * levels and the shared axes. Pure functions on plain arrays, so they're unit-tested in node.
 */
import { fft } from '../audio/dsp/analysis'

/**
 * Finds where to start drawing so the wave stands still from frame to frame.
 *
 * Looks at one period of the signal, starting at `from`, and returns the rising zero crossing
 * with the steepest slope (linearly interpolated, so it's sub-sample accurate). Because the
 * wave repeats every period, the same point of the cycle wins in every frame. Returns `from`
 * when there is no crossing (silence, DC).
 */
export function findTrigger(x: ArrayLike<number>, period: number, from = 0): number {
  const start = Math.max(1, Math.floor(from))
  const end = Math.min(x.length - 2, Math.ceil(from + Math.max(2, period)))
  const d = Math.max(1, Math.round(period / 64))
  let best = -1
  let bestSlope = 0
  for (let i = start; i <= end; i++) {
    if (x[i - 1] < 0 && x[i] >= 0) {
      const slope = x[Math.min(x.length - 1, i + d)] - x[Math.max(0, i - 1 - d)]
      if (best < 0 || slope > bestSlope * 1.0001) {
        best = i - 1 + -x[i - 1] / (x[i] - x[i - 1])
        bestSlope = slope
      }
    }
  }
  return best < 0 ? from : best
}

/** Linear interpolation at a fractional index (0 outside the array). */
export function sampleAt(x: ArrayLike<number>, t: number): number {
  const i = Math.floor(t)
  if (i < 0 || i >= x.length) return 0
  const a = x[i]
  const b = i + 1 < x.length ? x[i + 1] : a
  return a + (b - a) * (t - i)
}

/** `points` evenly spaced samples of `x` from index `start` over `length` samples. */
export function resample(
  x: ArrayLike<number>,
  start: number,
  length: number,
  points: number,
): Float32Array {
  const out = new Float32Array(points)
  for (let i = 0; i < points; i++) out[i] = sampleAt(x, start + (length * i) / (points - 1))
  return out
}

export interface ScopeWindow {
  samples: Float32Array
  /** Length of the shown window in samples. */
  length: number
  /** Cycles of the full waveform (sub-aware) shown. */
  cycles: number
}

/**
 * The scope's view of a buffer: a whole number of cycles that ends as close to the newest
 * sample as possible, starting at a stable trigger point.
 */
export function scopeWindow(
  x: ArrayLike<number>,
  period: number,
  points: number,
  cycles = 2,
): ScopeWindow {
  // Fall back to a 20 ms window when the pitch is unknown.
  const p = period > 1 ? period : 960
  let n = cycles
  while (n > 1 && (n + 1) * p > x.length) n--
  const length = n * p
  const from = Math.max(0, x.length - length - p - 2)
  const trigger = findTrigger(x, p, from)
  return { samples: resample(x, trigger, length, points), length, cycles: n }
}

/** Largest power of two that fits in `n`, capped at `max`. */
export const fitPow2 = (n: number, max = 8192) => {
  let size = 1
  while (size * 2 <= Math.min(n, max)) size *= 2
  return size
}

/**
 * Magnitude spectrum of the newest `size` samples (Hann window), scaled so a unit sine reads
 * 1 at its bin. Index k is k × sampleRate / size Hz.
 */
export function magnitudeSpectrum(x: ArrayLike<number>, size = fitPow2(x.length)): Float32Array {
  const re = new Float64Array(size)
  const im = new Float64Array(size)
  const offset = x.length - size
  for (let i = 0; i < size; i++) {
    re[i] = x[offset + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1)))
  }
  fft(re, im)
  const out = new Float32Array(size / 2)
  const scale = 2 / (size * 0.5)
  for (let k = 0; k < size / 2; k++) out[k] = Math.hypot(re[k], im[k]) * scale
  return out
}

/**
 * Amplitude of each harmonic of `base` (1×, 2×, 3×…) up to `maxHz`, read as the largest bin
 * within ±1 bin of where it should be (Hann leakage spreads a sine over about 3 bins).
 */
export function harmonicLevels(
  spectrum: Float32Array,
  binHz: number,
  base: number,
  maxHz: number,
  maxCount = 96,
): Float32Array {
  if (!(base > 0)) return new Float32Array(0)
  const count = Math.max(0, Math.min(maxCount, Math.floor(maxHz / base)))
  const out = new Float32Array(count)
  for (let h = 0; h < count; h++) {
    const bin = Math.round(((h + 1) * base) / binHz)
    let m = 0
    for (let k = bin - 1; k <= bin + 1; k++)
      if (k > 0 && k < spectrum.length) m = Math.max(m, spectrum[k])
    out[h] = m
  }
  return out
}

/** Amplitude-weighted mean frequency of a magnitude spectrum ("brightness"). */
export function centroidOf(spectrum: Float32Array, binHz: number): number {
  let num = 0
  let den = 0
  for (let k = 1; k < spectrum.length; k++) {
    num += spectrum[k] * k * binHz
    den += spectrum[k]
  }
  return den > 0 ? num / den : 0
}

export const dB = (amplitude: number) => 20 * Math.log10(Math.max(amplitude, 1e-9))

/** Log-frequency axis shared by the spectrum and the envelope graph. */
export const FREQ_MIN = 20
export const FREQ_MAX = 12000

/** 0–1 position of a frequency on the log axis. */
export const freqPos = (hz: number, min = FREQ_MIN, max = FREQ_MAX) =>
  Math.log(Math.max(hz, 1e-3) / min) / Math.log(max / min)

/** Inverse of `freqPos`. */
export const posFreq = (pos: number, min = FREQ_MIN, max = FREQ_MAX) => min * (max / min) ** pos

/** Peak hold that decays, for scope auto-scaling without jumpy zoom. */
export class PeakHold {
  value = 0
  constructor(readonly decay = 0.92) {}
  next(peak: number): number {
    this.value = Math.max(peak, this.value * this.decay)
    return this.value
  }
}
