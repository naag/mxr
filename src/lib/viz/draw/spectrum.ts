/**
 * Spectrum drawing (Canvas 2D): harmonic bars before and after the filter, the analytic
 * filter curve, the cutoff marker and (detailed mode) a continuous FFT line and axes.
 */
import { dB, FREQ_MAX, FREQ_MIN, freqPos } from '../analysis'
import { hline, MONO, SANS, vline, type Ctx, type Size } from './canvas'

export const DB_TOP = 18
export const DB_BOTTOM = -60
const PAD_BOTTOM = 26
const PAD_TOP = 28

export interface SpectrumTheme {
  grid: string
  axis: string
  text: string
  label: string
  bar: string
  curve: string
  curveLabel: string
  fft: string
}

export interface SpectrumScene {
  /** Frequency of harmonic 1 (Hz). */
  base: number
  /** Harmonic amplitudes before the filter, relative to the reference (1 = 0 dB). */
  raw: ArrayLike<number>
  /** After the filter, same reference. */
  filtered: ArrayLike<number>
  /** Filter gain at a frequency (linear). */
  curve: (hz: number) => number
  cutoffHz: number
  /** Continuous magnitude spectrum (relative), with its bin width. */
  fft?: { mags: ArrayLike<number>; binHz: number }
  detailed: boolean
  highlighted: boolean
  labels: {
    cutoff: string
    low: string
    high: string
    harmonic: (n: number) => string
    hz: (f: number) => string
  }
}

export interface SpectrumLayout {
  x: (hz: number) => number
  y: (db: number) => number
  bottom: number
}

export function spectrumLayout(size: Size): SpectrumLayout {
  const bottom = size.height - PAD_BOTTOM
  return {
    x: (hz) => freqPos(hz) * size.width,
    y: (db) =>
      PAD_TOP +
      ((DB_TOP - Math.max(DB_BOTTOM, Math.min(DB_TOP, db))) / (DB_TOP - DB_BOTTOM)) *
        (bottom - PAD_TOP),
    bottom,
  }
}

const FREQ_TICKS = [50, 100, 200, 500, 1000, 2000, 5000, 10000]
const DB_TICKS = [12, 0, -24, -48]

export function drawSpectrum(ctx: Ctx, size: Size, scene: SpectrumScene, theme: SpectrumTheme) {
  const { width: w } = size
  const L = spectrumLayout(size)
  ctx.clearRect(0, 0, w, size.height)
  ctx.setLineDash([])
  ctx.globalAlpha = 1
  ctx.lineWidth = 1

  if (scene.detailed) {
    ctx.strokeStyle = theme.grid
    for (const f of FREQ_TICKS) vline(ctx, L.x(f), PAD_TOP, L.bottom)
    for (const d of DB_TICKS) hline(ctx, L.y(d), 0, w)
  }
  ctx.strokeStyle = theme.axis
  ctx.lineWidth = 1.2
  hline(ctx, L.bottom, 0, w)

  // Area under the filter curve, then the continuous spectrum.
  const steps = Math.max(64, Math.round(w / 3))
  const curveY: number[] = []
  for (let i = 0; i <= steps; i++) {
    const hz = FREQ_MIN * (FREQ_MAX / FREQ_MIN) ** (i / steps)
    curveY.push(L.y(dB(scene.curve(hz))))
  }
  ctx.fillStyle = theme.curve
  ctx.globalAlpha = 0.07
  ctx.beginPath()
  ctx.moveTo(0, L.bottom)
  curveY.forEach((y, i) => ctx.lineTo((w * i) / steps, y))
  ctx.lineTo(w, L.bottom)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1

  if (scene.detailed && scene.fft) {
    const { mags, binHz } = scene.fft
    ctx.strokeStyle = theme.fft
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.55
    ctx.beginPath()
    let started = false
    for (let k = 1; k < mags.length; k++) {
      const hz = k * binHz
      if (hz < FREQ_MIN || hz > FREQ_MAX) continue
      const x = L.x(hz)
      const y = L.y(dB(mags[k]))
      if (started) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
      started = true
    }
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  // Harmonic bars: faint before the filter, solid after. Quiet ones fade out.
  const bar = (amps: ArrayLike<number>, alpha: number, width: number) => {
    ctx.strokeStyle = theme.bar
    ctx.lineWidth = width
    for (let i = 0; i < amps.length; i++) {
      const hz = (i + 1) * scene.base
      if (hz > FREQ_MAX) break
      const level = dB(amps[i])
      if (level <= DB_BOTTOM) continue
      ctx.globalAlpha = alpha * Math.min(1, 0.25 + (level - DB_BOTTOM) / 40)
      vline(ctx, L.x(hz), L.bottom, L.y(level))
    }
    ctx.globalAlpha = 1
  }
  bar(scene.raw, 0.22, 2.2)
  bar(scene.filtered, 1, 2.4)

  // The filter curve, brighter while a filter control is pointed at.
  ctx.lineJoin = 'round'
  ctx.strokeStyle = theme.curve
  ctx.save()
  ctx.globalAlpha = scene.highlighted ? 0.6 : 0.35
  ctx.lineWidth = scene.highlighted ? 8 : 6
  ctx.shadowBlur = 8
  ctx.shadowColor = theme.curve
  strokeCurve(ctx, curveY, w, steps)
  ctx.restore()
  ctx.lineWidth = scene.highlighted ? 3.2 : 2.6
  strokeCurve(ctx, curveY, w, steps)

  // Cutoff marker.
  const cx = L.x(scene.cutoffHz)
  ctx.globalAlpha = 0.7
  ctx.lineWidth = 1.2
  ctx.setLineDash([3, 4])
  vline(ctx, cx, PAD_TOP, L.bottom)
  ctx.setLineDash([])
  ctx.globalAlpha = 1
  ctx.font = SANS
  ctx.fillStyle = theme.curveLabel
  ctx.textBaseline = 'alphabetic'
  const right = cx > w * 0.7
  ctx.textAlign = right ? 'right' : 'left'
  ctx.fillText(scene.labels.cutoff, cx + (right ? -8 : 8), 18)

  // Harmonic numbers under the first bars that have room.
  ctx.font = MONO
  ctx.fillStyle = theme.label
  ctx.textAlign = 'center'
  let lastX = -Infinity
  for (let i = 0; i < Math.min(scene.filtered.length, 16); i++) {
    const x = L.x((i + 1) * scene.base)
    if (x - lastX < 24 || x > w - 12) continue
    const level = dB(scene.filtered[i])
    if (level <= DB_BOTTOM + 6) continue
    ctx.fillText(scene.labels.harmonic(i + 1), x, Math.max(PAD_TOP + 10, L.y(level) - 8))
    lastX = x
  }

  // Axes.
  ctx.fillStyle = theme.text
  ctx.textBaseline = 'alphabetic'
  if (scene.detailed) {
    ctx.textAlign = 'center'
    for (const f of FREQ_TICKS) ctx.fillText(scene.labels.hz(f), L.x(f), size.height - 6)
    ctx.textAlign = 'left'
    for (const d of DB_TICKS)
      ctx.fillText(`${d > 0 ? '+' : d < 0 ? '−' : ''}${Math.abs(d)} dB`, 4, L.y(d) - 4)
  } else {
    ctx.font = SANS
    ctx.textAlign = 'left'
    ctx.fillText(scene.labels.low, 8, size.height - 6)
    ctx.textAlign = 'right'
    ctx.fillText(scene.labels.high, w - 8, size.height - 6)
  }
}

function strokeCurve(ctx: Ctx, ys: number[], w: number, steps: number) {
  ctx.beginPath()
  ys.forEach((y, i) => (i ? ctx.lineTo((w * i) / steps, y) : ctx.moveTo(0, y)))
  ctx.stroke()
}
