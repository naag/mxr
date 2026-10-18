/**
 * Tiny inline illustrations for the glossary (120 × 48 SVG units). Computed from the same
 * maths as the app (waveforms, the ladder response), so they match what the visuals show.
 */
import { ladderMagnitude } from '../audio/dsp/ladder'

export type IllustrationId =
  | 'sine'
  | 'triangle'
  | 'saw'
  | 'square'
  | 'harmonics'
  | 'octave'
  | 'noise'
  | 'lowpass'
  | 'resonance'
  | 'envelope'
  | 'swell'
  | 'lfo'
  | 'chorus'
  | 'glide'
  | 'gate'
  | 'compression'

export interface IllustrationPath {
  d: string
  /** `main` is the stage color, `faint` a grey guide, `fill` a filled shape. */
  tone: 'main' | 'faint' | 'fill'
}

export const ILLUSTRATION_VIEW = { width: 120, height: 48 }

const W = ILLUSTRATION_VIEW.width
const H = ILLUSTRATION_VIEW.height
const MID = H / 2
const AMP = 18
const f1 = (n: number) => (Math.round(n * 10) / 10).toString()

/** Polyline through `fn(t)` for t in 0–1 (values −1…1, up is positive). */
function trace(fn: (t: number) => number, points = 120, amp = AMP, mid = MID): string {
  const out: string[] = []
  for (let i = 0; i <= points; i++) {
    const t = i / points
    out.push(`${f1(t * W)} ${f1(mid - amp * fn(t))}`)
  }
  return `M${out.join(' L')}`
}

const frac = (x: number) => x - Math.floor(x)
const wave = {
  sine: (t: number) => Math.sin(2 * Math.PI * t),
  triangle: (t: number) => 1 - 4 * Math.abs(frac(t + 0.25) - 0.5),
  saw: (t: number) => 2 * frac(t + 0.5) - 1,
  square: (t: number) => (frac(t) < 0.5 ? 1 : -1),
}

/** Frequency response on a log axis 20 Hz–20 kHz, mapped to the box (0 dB near the top). */
function response(cutoff: number, k: number): string {
  return trace(
    (t) => {
      const hz = 20 * 1000 ** t
      const db = 20 * Math.log10(ladderMagnitude(hz, cutoff, k))
      return Math.max(-1, Math.min(1, (db + 18) / 24))
    },
    120,
    18,
    26,
  )
}

export function illustration(id: IllustrationId): IllustrationPath[] {
  const axis: IllustrationPath = { d: `M0 ${MID} H${W}`, tone: 'faint' }
  switch (id) {
    case 'sine':
    case 'triangle':
    case 'saw':
    case 'square': {
      const fn = wave[id === 'saw' ? 'saw' : id]
      return [axis, { d: trace((t) => fn(2 * t), id === 'square' ? 400 : 120), tone: 'main' }]
    }
    case 'harmonics': {
      // Sawtooth harmonics: 1/n.
      const bars = Array.from({ length: 10 }, (_, i) => {
        const x = 8 + i * 11.5
        const h = 40 / (i + 1)
        return `M${f1(x)} ${H - 2} V${f1(H - 2 - h)}`
      })
      return [
        { d: `M0 ${H - 2} H${W}`, tone: 'faint' },
        { d: bars.join(' '), tone: 'main' },
      ]
    }
    case 'octave':
      return [
        axis,
        { d: trace((t) => wave.sine(4 * t)), tone: 'main' },
        { d: trace((t) => wave.square(2 * t) * 0.7), tone: 'faint' },
      ]
    case 'noise': {
      let seed = 7
      const rand = () => {
        seed = (seed * 16807) % 2147483647
        return (seed / 2147483647) * 2 - 1
      }
      const values = Array.from({ length: 121 }, () => rand())
      return [axis, { d: trace((t) => values[Math.round(t * 120)]), tone: 'main' }]
    }
    case 'lowpass':
      return [
        { d: `M0 8 H${W}`, tone: 'faint' },
        { d: response(400, 0), tone: 'main' },
      ]
    case 'resonance':
      return [
        { d: response(400, 0), tone: 'faint' },
        { d: response(400, 3.2), tone: 'main' },
      ]
    case 'envelope': {
      // Fast attack, exponential decay.
      const fn = (t: number) => (t < 0.12 ? t / 0.12 : Math.exp(-(t - 0.12) * 5)) * 2 - 1
      return [
        { d: `M0 ${MID + AMP} H${W}`, tone: 'faint' },
        { d: trace(fn), tone: 'main' },
      ]
    }
    case 'swell': {
      const env = (t: number) =>
        Math.min(1, t / 0.6) * (t > 0.85 ? Math.max(0, 1 - (t - 0.85) * 6) : 1)
      return [
        { d: trace((t) => env(t)), tone: 'faint' },
        { d: trace((t) => env(t) * wave.sine(14 * t), 240), tone: 'main' },
      ]
    }
    case 'lfo':
      return [axis, { d: trace((t) => wave.sine(1.5 * t) * 0.9), tone: 'main' }]
    case 'chorus':
      return [
        { d: trace((t) => wave.saw(3 * t) * 0.8), tone: 'faint' },
        { d: trace((t) => wave.saw(3 * t - 0.08 - 0.04 * Math.sin(6 * t)) * 0.8), tone: 'main' },
      ]
    case 'glide': {
      const fn = (t: number) => (t < 0.35 ? -0.7 : t > 0.65 ? 0.7 : -0.7 + (1.4 * (t - 0.35)) / 0.3)
      return [{ d: trace(fn), tone: 'main' }]
    }
    case 'gate': {
      const env = (t: number) => (t < 0.4 ? 1 : t < 0.6 ? 0 : 1)
      return [axis, { d: trace((t) => env(t) * wave.sine(12 * t) * 0.8, 240), tone: 'main' }]
    }
    case 'compression': {
      const levels = [1, 0.35, 0.8, 0.3]
      const squashed = levels.map((l) => 0.45 + 0.4 * l)
      const pick = (arr: number[], t: number) => arr[Math.min(3, Math.floor(t * 4))]
      return [
        { d: trace((t) => pick(levels, t) * wave.sine(16 * t), 320), tone: 'faint' },
        { d: trace((t) => pick(squashed, t) * wave.sine(16 * t), 320), tone: 'main' },
      ]
    }
  }
}
