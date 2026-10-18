/**
 * Additive synthesis for the chapter 2 demo: a sawtooth, square or triangle built from its
 * first n sine-wave harmonics (Fourier series), next to the ideal shape.
 */
export type AdditiveShape = 'saw' | 'square' | 'triangle'

/** Amplitude and sign of harmonic h (1-based) in each shape's series; 0 if it isn't there. */
export function harmonicAmp(shape: AdditiveShape, h: number): number {
  // Saw: every harmonic at 1/h, alternating sign, for a ramp rising through zero.
  if (shape === 'saw') return ((h % 2 ? 1 : -1) * 2) / Math.PI / h
  if (h % 2 === 0) return 0
  if (shape === 'square') return 4 / Math.PI / h
  // Triangle: odd harmonics at 1/h², alternating sign.
  const sign = ((h - 1) / 2) % 2 === 0 ? 1 : -1
  return (sign * 8) / (Math.PI * Math.PI * h * h)
}

/** One cycle (t in 0…1) of the sum of harmonics 1…n. */
export function partialSum(shape: AdditiveShape, n: number, points: number): Float64Array {
  const out = new Float64Array(points)
  for (let h = 1; h <= n; h++) {
    const a = harmonicAmp(shape, h)
    if (a === 0) continue
    for (let i = 0; i < points; i++) out[i] += a * Math.sin((2 * Math.PI * h * i) / (points - 1))
  }
  return out
}

/** The ideal wave the series converges to, in the same phase. */
export function idealWave(shape: AdditiveShape, t: number): number {
  const p = t - Math.floor(t)
  if (shape === 'saw') return p < 0.5 ? 2 * p : 2 * p - 2
  if (shape === 'square') return p < 0.5 ? 1 : -1
  return p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4
}

/** Harmonics up to n that the shape actually uses. */
export const harmonicsUsed = (shape: AdditiveShape, n: number) =>
  Array.from({ length: n }, (_, i) => i + 1).filter((h) => harmonicAmp(shape, h) !== 0).length
