/**
 * Spectrogram (PLAN §3, detailed mode): frequency over time as a heat map. Pure helpers:
 * one log-frequency column per moment, a short-time spectrum of a whole render, a ring
 * buffer for the live scroll, and the RGBA pixels the canvas shows.
 */
import { dB, FREQ_MAX, FREQ_MIN, magnitudeSpectrum, posFreq } from './analysis'

/** Rows of the heat map (log-spaced, 20 Hz at the bottom to 12 kHz at the top). */
export const SPEC_ROWS = 96
/** FFT size per column: 2048 samples ≈ 43 ms at 48 kHz, enough for low notes. */
export const SPEC_FFT = 2048
/** Level range the colors span (0 dB = a full-scale sine). */
export const SPEC_DB_TOP = -6
export const SPEC_DB_BOTTOM = -84

/** 0–1 level per row from a magnitude spectrum: the loudest bin in each row's band. */
export function spectrogramColumn(
  mags: ArrayLike<number>,
  binHz: number,
  rows = SPEC_ROWS,
): Float32Array {
  const out = new Float32Array(rows)
  for (let r = 0; r < rows; r++) {
    const lo = posFreq(r / rows, FREQ_MIN, FREQ_MAX) / binHz
    const hi = posFreq((r + 1) / rows, FREQ_MIN, FREQ_MAX) / binHz
    let m = 0
    if (Math.floor(hi) - Math.ceil(lo) < 1) {
      // Narrower than a bin (low rows): interpolate at the band's centre.
      const c = (lo + hi) / 2
      const i = Math.floor(c)
      const a = mags[i] ?? 0
      const b = mags[i + 1] ?? a
      m = a + (b - a) * (c - i)
    } else {
      for (let k = Math.ceil(lo); k <= Math.floor(hi) && k < mags.length; k++)
        m = Math.max(m, mags[k])
    }
    out[r] = levelOf(m)
  }
  return out
}

/** Amplitude → 0–1 on the spectrogram's dB scale. */
export const levelOf = (amplitude: number) =>
  Math.min(1, Math.max(0, (dB(amplitude) - SPEC_DB_BOTTOM) / (SPEC_DB_TOP - SPEC_DB_BOTTOM)))

export interface SpectrogramData {
  rows: number
  frames: number
  /** Seconds between columns. */
  dt: number
  /** frames × rows levels (0–1), column after column. */
  data: Float32Array
}

/** Short-time spectrum of a whole signal: one column every `hopSeconds`. */
export function spectrogram(
  x: Float32Array,
  sampleRate: number,
  hopSeconds = 0.01,
  rows = SPEC_ROWS,
  size = SPEC_FFT,
): SpectrogramData {
  const hop = Math.max(1, Math.round(hopSeconds * sampleRate))
  const frames = Math.max(0, Math.floor(x.length / hop))
  const data = new Float32Array(frames * rows)
  const padded = new Float32Array(size)
  for (let f = 0; f < frames; f++) {
    // The window ends at this column's time (zero-padded at the start).
    const end = (f + 1) * hop
    padded.fill(0)
    const from = Math.max(0, end - size)
    padded.set(x.subarray(from, end), size - (end - from))
    data.set(spectrogramColumn(magnitudeSpectrum(padded, size), sampleRate / size, rows), f * rows)
  }
  return { rows, frames, dt: hop / sampleRate, data }
}

/** The last `capacity` columns, for the live scrolling view. */
export class SpectrogramHistory {
  readonly data: Float32Array
  #next = 0
  #count = 0

  constructor(
    readonly capacity: number,
    readonly rows = SPEC_ROWS,
  ) {
    this.data = new Float32Array(capacity * rows)
  }

  get length() {
    return this.#count
  }

  push(column: ArrayLike<number>) {
    this.data.set(column, this.#next * this.rows)
    this.#next = (this.#next + 1) % this.capacity
    this.#count = Math.min(this.capacity, this.#count + 1)
  }

  clear() {
    this.#next = 0
    this.#count = 0
    this.data.fill(0)
  }

  /** Columns oldest → newest, padded with silence at the start until the buffer is full. */
  toData(): SpectrogramData {
    const out = new Float32Array(this.capacity * this.rows)
    const start = this.#count < this.capacity ? 0 : this.#next
    const offset = this.capacity - this.#count
    for (let i = 0; i < this.#count; i++) {
      const src = ((start + i) % this.capacity) * this.rows
      out.set(this.data.subarray(src, src + this.rows), (offset + i) * this.rows)
    }
    return { rows: this.rows, frames: this.capacity, dt: 0, data: out }
  }
}

type Rgb = readonly [number, number, number]

/** Heat colors: background → violet → teal → amber → near-white (the app's stage colors). */
const STOPS: readonly [number, Rgb][] = [
  [0, [13, 16, 20]],
  [0.3, [58, 44, 110]],
  [0.55, [67, 198, 207]],
  [0.8, [242, 169, 59]],
  [1, [255, 244, 222]],
]

export function heat(v: number): Rgb {
  const t = Math.min(1, Math.max(0, v))
  for (let i = 1; i < STOPS.length; i++) {
    const [t1, c1] = STOPS[i]
    if (t <= t1) {
      const [t0, c0] = STOPS[i - 1]
      const u = (t - t0) / (t1 - t0)
      return [0, 1, 2].map((k) => Math.round(c0[k] + (c1[k] - c0[k]) * u)) as unknown as Rgb
    }
  }
  return STOPS[STOPS.length - 1][1]
}

/** RGBA pixels (frames wide, rows tall), low frequencies at the bottom. */
export function spectrogramPixels(s: SpectrogramData): Uint8ClampedArray<ArrayBuffer> {
  const px = new Uint8ClampedArray(s.frames * s.rows * 4)
  for (let f = 0; f < s.frames; f++) {
    for (let r = 0; r < s.rows; r++) {
      const [red, green, blue] = heat(s.data[f * s.rows + r])
      const i = ((s.rows - 1 - r) * s.frames + f) * 4
      px[i] = red
      px[i + 1] = green
      px[i + 2] = blue
      px[i + 3] = 255
    }
  }
  return px
}

/**
 * For readouts: the loudest row, and the highest row within `range` (0–1 of the color scale,
 * 0.45 ≈ 35 dB) of it. Null when nothing is above `floor`.
 */
export function columnSummary(
  column: ArrayLike<number>,
  floor = 0.35,
  range = 0.45,
): { loudestHz: number; topHz: number } | null {
  const rows = column.length
  let best = -1
  for (let r = 0; r < rows; r++) if (column[r] > (best < 0 ? floor : column[best])) best = r
  if (best < 0) return null
  let top = best
  const limit = Math.max(floor, column[best] - range)
  for (let r = best; r < rows; r++) if (column[r] >= limit) top = r
  const hz = (r: number) => posFreq((r + 0.5) / rows, FREQ_MIN, FREQ_MAX)
  return { loudestHz: hz(best), topHz: hz(top) }
}
