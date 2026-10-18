/** Oscilloscope drawing (Canvas 2D): a triggered trace, optional ghost and layer traces. */
import { hline, MONO, polyline, vline, type Ctx, type Size } from './canvas'

export interface ScopeTheme {
  grid: string
  axis: string
  marker: string
  text: string
  trace: string
  ghost: string
}

export interface ScopeTrace {
  samples: ArrayLike<number>
  color: string
  /** Dashed, thinner line (the oscillator under the filtered wave, or a layer). */
  dashed?: boolean
  width?: number
  glow?: boolean
}

export interface ScopeScene {
  traces: ScopeTrace[]
  /** Peak value that maps to 90% of the half-height. */
  scale: number
  cycles: number
  detailed: boolean
  highlighted: boolean
  /** Label per cycle marker, e.g. "1 cycle". */
  cycleLabel: (n: number) => string
}

export function drawScope(ctx: Ctx, size: Size, scene: ScopeScene, theme: ScopeTheme) {
  const { width: w, height: h } = size
  const mid = h / 2
  const amp = (h / 2) * 0.86
  ctx.clearRect(0, 0, w, h)
  ctx.lineWidth = 1
  ctx.setLineDash([])

  if (scene.detailed) {
    ctx.strokeStyle = theme.grid
    for (const f of [-0.75, -0.5, 0.5, 0.75]) hline(ctx, mid + f * amp, 0, w)
  }
  ctx.strokeStyle = theme.axis
  ctx.lineWidth = 1.2
  hline(ctx, mid, 0, w)

  // Cycle markers, so "one cycle" is something you can see.
  ctx.strokeStyle = theme.marker
  ctx.setLineDash([3, 5])
  ctx.font = MONO
  ctx.fillStyle = theme.text
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  for (let c = 1; c < scene.cycles; c++) {
    const x = (w * c) / scene.cycles
    vline(ctx, x, 6, h - 6)
    ctx.fillText(scene.cycleLabel(c), x + 6, 8)
  }
  ctx.setLineDash([])

  const gain = scene.scale > 1e-4 ? 1 / scene.scale : 0
  ctx.lineJoin = 'round'
  for (const t of scene.traces) {
    const ys = Array.from(t.samples, (v) => mid - Math.max(-1.1, Math.min(1.1, v * gain)) * amp)
    ctx.strokeStyle = t.color
    if (t.glow) {
      ctx.save()
      ctx.globalAlpha = scene.highlighted ? 0.45 : 0.3
      ctx.lineWidth = 6
      ctx.shadowBlur = 8
      ctx.shadowColor = t.color
      polyline(ctx, ys, 0, w)
      ctx.restore()
    }
    ctx.setLineDash(t.dashed ? [5, 4] : [])
    ctx.globalAlpha = t.dashed ? 0.6 : 1
    ctx.lineWidth = t.width ?? (t.dashed ? 1.6 : 2.4)
    polyline(ctx, ys, 0, w)
  }
  ctx.globalAlpha = 1
  ctx.setLineDash([])
}
