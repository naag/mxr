/**
 * Pitch graph geometry (SVG), piano-roll style: note-name gridlines, note bars and the pitch
 * the synth plays, so glides show up as ramps and plain note changes as steps.
 */
import { noteName } from '../../audio/notes'

export const PITCH_VIEW = { width: 800, height: 250 }
const LEFT = 44
const TOP = 16
const BOTTOM = 222

export interface PitchPoint {
  t: number
  midi: number
}

export interface PitchBar {
  start: number
  end: number
  midi: number
  /** Dimmed: too soft to trigger the synth. */
  dim: boolean
}

export interface PitchGeometry {
  path: string
  bars: { x: number; y: number; width: number; height: number; dim: boolean }[]
  grid: { y: number; label: string; natural: boolean }[]
  x: (t: number) => number
  y: (midi: number) => number
  left: number
  bottom: number
}

const f1 = (n: number) => Math.round(n * 10) / 10

/** Semitone range that fits all notes and the curve, with a little room. */
export function pitchRange(values: number[]): [number, number] {
  const finite = values.filter(Number.isFinite)
  if (!finite.length) return [28, 40]
  let lo = Math.floor(Math.min(...finite)) - 1
  let hi = Math.ceil(Math.max(...finite)) + 1
  // At least an octave, so a single held note doesn't fill the whole height.
  while (hi - lo < 12) {
    hi++
    if (hi - lo < 12) lo--
  }
  return [lo, hi]
}

export function pitchGeometry(
  points: PitchPoint[],
  bars: PitchBar[],
  t0: number,
  t1: number,
  width = PITCH_VIEW.width,
): PitchGeometry {
  const [lo, hi] = pitchRange([...points.map((p) => p.midi), ...bars.map((b) => b.midi)])
  const x = (t: number) => LEFT + ((t - t0) / Math.max(1e-6, t1 - t0)) * (width - LEFT)
  const y = (m: number) => BOTTOM - ((m - lo) / (hi - lo)) * (BOTTOM - TOP)

  let path = ''
  let pen = false
  for (const p of points) {
    if (!Number.isFinite(p.midi) || p.t < t0 || p.t > t1) {
      pen = false
      continue
    }
    path += `${pen ? ' L' : 'M'}${f1(x(p.t))} ${f1(y(p.midi))}`
    pen = true
  }

  const grid: PitchGeometry['grid'] = []
  for (let m = Math.ceil(lo); m <= hi; m++) {
    const name = noteName(m)
    grid.push({ y: f1(y(m)), label: name, natural: !name.includes('♯') })
  }
  const barH = Math.min(14, ((BOTTOM - TOP) / (hi - lo)) * 0.8)
  return {
    path,
    bars: bars
      .filter((b) => b.end > t0 && b.start < t1)
      .map((b) => ({
        x: f1(x(Math.max(t0, b.start))),
        y: f1(y(b.midi) - barH / 2),
        width: f1(Math.max(2, x(Math.min(t1, b.end)) - x(Math.max(t0, b.start)) - 2)),
        height: f1(barH),
        dim: b.dim,
      })),
    grid,
    x,
    y,
    left: LEFT,
    bottom: BOTTOM,
  }
}
