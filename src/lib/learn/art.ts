/**
 * Tiny glossary illustrations as SVG paths in a 120 × 48 box. Pure, so they're cheap to test
 * and render the same everywhere.
 */
export type ArtId =
  | 'sine'
  | 'triangle'
  | 'saw'
  | 'square'
  | 'harmonics'
  | 'noise'
  | 'lowpass'
  | 'resonance'
  | 'slope'
  | 'envelope'
  | 'ampEnv'
  | 'lfo'
  | 'glide'
  | 'octave'
  | 'chorus'
  | 'compression'
  | 'gate'
  | 'mix'
  | 'stereo'
  | 'pitch'
  | 'aliasing'
  | 'spectrogram'

export interface ArtPath {
  d: string
  /** 'main' draws in the accent color, 'soft' faint, 'fill' as a light area. */
  tone: 'main' | 'soft' | 'fill'
}

export const ART_W = 120
export const ART_H = 48
const MID = ART_H / 2
const f1 = (n: number) => Math.round(n * 10) / 10

/** A path through `fn(t)` for t in 0…1 (fn returns −1…1, up is positive). */
function plot(fn: (t: number) => number, amp = 18, n = 120, x0 = 4, x1 = ART_W - 4): string {
  let d = ''
  for (let i = 0; i <= n; i++) {
    const t = i / n
    d += `${i ? 'L' : 'M'}${f1(x0 + (x1 - x0) * t)} ${f1(MID - amp * fn(t))}`
  }
  return d
}

const sin = (t: number, cycles: number) => Math.sin(2 * Math.PI * cycles * t)
const saw = (t: number, cycles: number) => 2 * ((t * cycles) % 1) - 1
const square = (t: number, cycles: number) => ((t * cycles) % 1 < 0.5 ? 1 : -1)
const tri = (t: number, cycles: number) => 1 - 4 * Math.abs(((t * cycles + 0.25) % 1) - 0.5)

/** Deterministic pseudo-random values for the noise picture. */
function rand(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/** A log-frequency filter curve: gain in dB → y. */
function curve(peak: number): string {
  return plot(
    (t) => {
      const b = 2 ** ((t - 0.5) * 6)
      const r2 = 1 - b * b
      const k = peak
      const re = r2 * r2 - 4 * b * b + k
      const im = 4 * r2 * b
      const db = 20 * Math.log10((1 + 0.5 * k) / Math.hypot(re, im))
      return Math.max(-1, Math.min(1, db / 24 + 0.4))
    },
    20,
    80,
  )
}

export function art(id: ArtId): ArtPath[] {
  switch (id) {
    case 'sine':
      return [{ d: plot((t) => sin(t, 2)), tone: 'main' }]
    case 'triangle':
      return [{ d: plot((t) => tri(t, 2)), tone: 'main' }]
    case 'saw':
      return [{ d: plot((t) => saw(t, 2), 18, 400), tone: 'main' }]
    case 'square':
      return [{ d: plot((t) => square(t, 2), 16, 400), tone: 'main' }]
    case 'harmonics': {
      let d = ''
      for (let h = 1; h <= 10; h++) d += `M${f1(4 + (h - 1) * 12.4)} 46 V${f1(46 - 40 / h)}`
      return [{ d, tone: 'main' }]
    }
    case 'noise':
      return [{ d: plot((t) => rand(Math.round(t * 120)) * 2 - 1, 18, 120), tone: 'main' }]
    case 'lowpass':
      return [{ d: curve(0), tone: 'main' }]
    case 'resonance':
      return [
        { d: curve(0), tone: 'soft' },
        { d: curve(3.2), tone: 'main' },
      ]
    case 'slope': {
      const pts = [
        [4, 12],
        [60, 12],
        [116, 44],
      ]
      return [
        { d: `M${pts.map((p) => p.join(' ')).join(' L')}`, tone: 'main' },
        { d: 'M60 12 L116 22', tone: 'soft' },
      ]
    }
    case 'envelope':
      return [
        { d: 'M4 44 L18 6 C30 30, 50 40, 116 43', tone: 'main' },
        { d: 'M4 44 H116', tone: 'soft' },
      ]
    case 'ampEnv':
      return [{ d: plot((t) => Math.min(1, t * 2.5) * sin(t, 8), 20, 400), tone: 'main' }]
    case 'lfo':
      return [
        { d: plot((t) => sin(t, 1.5), 16), tone: 'main' },
        {
          d: `M${f1(4 + 112 * 0.17)} ${f1(MID - 16)} m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0`,
          tone: 'fill',
        },
      ]
    case 'glide':
      return [
        { d: 'M4 36 H44 L76 12 H116', tone: 'main' },
        { d: 'M44 36 H60 V12 H76', tone: 'soft' },
      ]
    case 'octave':
      return [
        { d: plot((t) => sin(t, 2), 9, 120, 4, 116), tone: 'soft' },
        { d: plot((t) => sin(t, 4)), tone: 'main' },
      ]
    case 'chorus':
      return [
        { d: plot((t) => sin(t, 2)), tone: 'main' },
        { d: plot((t) => sin(t + 0.06, 2)), tone: 'soft' },
      ]
    case 'compression':
      return [
        {
          d: plot((t) => (t < 0.33 ? 1 : t < 0.66 ? 0.35 : 0.7) * sin(t, 9), 20, 400),
          tone: 'soft',
        },
        {
          d: plot((t) => (t < 0.33 ? 0.75 : t < 0.66 ? 0.55 : 0.68) * sin(t, 9), 20, 400),
          tone: 'main',
        },
      ]
    case 'gate':
      return [
        {
          d: plot(
            (t) => (t < 0.4 || t > 0.6 ? 1 : 0) * sin(t, 10) * (t < 0.4 ? 1 - t : 1),
            18,
            400,
          ),
          tone: 'main',
        },
      ]
    case 'mix':
      return [
        {
          d: plot((t) => 0.6 * sin(t, 2) + 0.3 * rand(Math.round(t * 60)) - 0.15, 18),
          tone: 'soft',
        },
        { d: plot((t) => saw(t, 2) * 0.8, 18, 400), tone: 'main' },
      ]
    case 'stereo':
      return [
        { d: plot((t) => sin(t, 2), 9), tone: 'main' },
        { d: plot((t) => sin(t + 0.12, 2), 9), tone: 'soft' },
      ]
    case 'pitch':
      return [{ d: 'M4 40 H30 V28 H60 V16 H90 V28 H116', tone: 'main' }]
    case 'aliasing':
      return [
        { d: plot((t) => sin(t, 9), 18, 400), tone: 'soft' },
        { d: plot((t) => sin(t, 1), 18), tone: 'main' },
      ]
    case 'spectrogram': {
      let d = ''
      for (let i = 0; i < 12; i++) {
        const x = 6 + i * 9.5
        const h = 10 + 26 * Math.abs(Math.sin(i / 2))
        d += `M${f1(x)} 46 V${f1(46 - h)}`
      }
      return [{ d, tone: 'main' }]
    }
  }
}
