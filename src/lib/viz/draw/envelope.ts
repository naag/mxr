/**
 * Envelope graph geometry (SVG): brightness (cutoff, log Hz) and volume over one note.
 * The area between the curve and the knob's own cutoff is shaded, so a negative FILTER ENV
 * AMT shows as a dip below the line and a positive one as a bloom above it.
 */
import type { EnvelopeCurve } from '../computed'

export const ENV_VIEW = { width: 800, height: 250 }
const CUT = { top: 14, bottom: 140 }
const VOL = { top: 168, bottom: 222 }
const HZ_MIN = 20
const HZ_MAX = 12000

export interface EnvelopeGeometry {
  cutoff: string
  /** Area between the curve and the knob line, above it (opens) and below it (closes). */
  above: string
  below: string
  knobY: number
  level: string
  levelArea: string
  noteOffX: number
  synthOnX: number
  peak: { x: number; y: number; hz: number }
  low: { x: number; y: number; hz: number }
  ticks: { x: number; ms: number }[]
  x: (seconds: number) => number
  yHz: (hz: number) => number
  yLevel: (level: number) => number
}

const f1 = (n: number) => Math.round(n * 10) / 10

export function envelopeGeometry(c: EnvelopeCurve, width = ENV_VIEW.width): EnvelopeGeometry {
  const x = (t: number) => (t / c.seconds) * width
  const yHz = (hz: number) => {
    const p = Math.log(Math.min(HZ_MAX, Math.max(HZ_MIN, hz)) / HZ_MIN) / Math.log(HZ_MAX / HZ_MIN)
    return CUT.bottom - p * (CUT.bottom - CUT.top)
  }
  const maxLevel = Math.max(1, ...c.level)
  const yLevel = (v: number) => VOL.bottom - (v / maxLevel) * (VOL.bottom - VOL.top)
  const knobY = yHz(c.knobHz)

  // Thin the 1 kHz curves to about one point per SVG unit.
  const n = c.cutoffHz.length
  const step = Math.max(1, Math.floor(n / width))
  const pts: [number, number][] = []
  const lvl: [number, number][] = []
  let peak = { x: 0, y: CUT.bottom, hz: 0 }
  let low = { x: 0, y: CUT.top, hz: Infinity }
  for (let i = 0; i < n; i += step) {
    const t = i * c.dt
    const hz = c.cutoffHz[i]
    const px = x(t)
    const py = yHz(hz)
    pts.push([px, py])
    lvl.push([px, yLevel(c.level[i])])
    if (t >= c.synthOn && hz > peak.hz) peak = { x: px, y: py, hz }
    if (t >= c.synthOn && hz < low.hz) low = { x: px, y: py, hz }
  }
  const path = (p: [number, number][]) =>
    p.length ? 'M' + p.map(([a, b]) => `${f1(a)} ${f1(b)}`).join(' L') : ''
  const clampTo = (keep: (y: number) => number) =>
    pts.length
      ? `M${f1(pts[0][0])} ${f1(knobY)} L` +
        pts.map(([a, b]) => `${f1(a)} ${f1(keep(b))}`).join(' L') +
        ` L${f1(pts[pts.length - 1][0])} ${f1(knobY)} Z`
      : ''

  const tickMs = c.seconds <= 0.8 ? 200 : c.seconds <= 1.2 ? 300 : c.seconds <= 2 ? 500 : 1000
  const ticks: { x: number; ms: number }[] = []
  for (let ms = 0; ms <= c.seconds * 1000 + 1e-6; ms += tickMs) ticks.push({ x: x(ms / 1000), ms })

  return {
    cutoff: path(pts),
    above: clampTo((y) => Math.min(y, knobY)),
    below: clampTo((y) => Math.max(y, knobY)),
    knobY,
    level: path(lvl),
    levelArea: lvl.length
      ? path(lvl) +
        ` L${f1(lvl[lvl.length - 1][0])} ${VOL.bottom} L${f1(lvl[0][0])} ${VOL.bottom} Z`
      : '',
    noteOffX: x(c.noteOff),
    synthOnX: x(c.synthOn),
    peak,
    low: low.hz === Infinity ? { x: 0, y: knobY, hz: c.knobHz } : low,
    ticks,
    x,
    yHz,
    yLevel,
  }
}

export const ENV_REGIONS = { cutoff: CUT, volume: VOL }
