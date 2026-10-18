/**
 * The "build a wave from sines" demo (Learn chapter 2): partial sums of a sawtooth or a
 * square wave's harmonics. Pure numbers, drawn as SVG by AdditiveDemo.svelte.
 */
export type AdditiveTarget = 'saw' | 'square'

/**
 * Signed amplitude of harmonic `n` (1 = the note) in the target wave; 0 when it has none.
 * The saw's even harmonics are inverted (that makes it ramp up rather than down).
 */
export function harmonicAmplitude(target: AdditiveTarget, n: number): number {
  if (target === 'square') return n % 2 === 1 ? 4 / (Math.PI * n) : 0
  return ((n % 2 === 1 ? 1 : -1) * 2) / (Math.PI * n)
}

/** The target wave itself, one cycle per unit of `t`, peak 1. */
export function idealWave(target: AdditiveTarget, t: number): number {
  const p = t - Math.floor(t)
  if (target === 'square') return p < 0.5 ? 1 : -1
  return p < 0.5 ? 2 * p : 2 * p - 2
}

/**
 * Samples (`points` over `cycles` cycles) of the sum of the first `count` harmonics of the
 * target, and of the newest harmonic on its own. Sines with these amplitudes (±2/πn for the
 * saw, 4/πn on odd harmonics for the square) add up to the ideal wave as `count` grows.
 */
export function partialSum(
  target: AdditiveTarget,
  count: number,
  points: number,
  cycles = 2,
): { sum: Float32Array; newest: Float32Array; newestHarmonic: number } {
  const sum = new Float32Array(points)
  const newest = new Float32Array(points)
  // Harmonics the target actually contains, in order.
  const used: number[] = []
  for (let n = 1; used.length < count; n++) if (harmonicAmplitude(target, n) !== 0) used.push(n)
  const last = used[used.length - 1] ?? 1
  for (let i = 0; i < points; i++) {
    const t = (cycles * i) / (points - 1)
    let s = 0
    for (const n of used) s += harmonicAmplitude(target, n) * Math.sin(2 * Math.PI * n * t)
    sum[i] = s
    newest[i] = harmonicAmplitude(target, last) * Math.sin(2 * Math.PI * last * t)
  }
  return { sum, newest, newestHarmonic: last }
}

/** Mean squared distance from the ideal wave: falls as harmonics are added. */
export function errorOf(target: AdditiveTarget, count: number, points = 400): number {
  const { sum } = partialSum(target, count, points, 1)
  let e = 0
  for (let i = 0; i < points; i++) e += (sum[i] - idealWave(target, i / (points - 1))) ** 2
  return e / points
}
