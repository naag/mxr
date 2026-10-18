/**
 * Spectrogram drawing (Canvas 2D): the heat-map image scaled into the plot, log-frequency
 * ticks, time ticks, note markers and the cutoff over time as a line on top.
 */
import { FREQ_MAX, FREQ_MIN, freqPos } from '../analysis'
import { hline, MONO, polyline, vline, type Ctx, type Size } from './canvas'

export interface SpectrogramCtx extends Ctx {
  imageSmoothingEnabled: boolean
  drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void
}

export interface SpectrogramTheme {
  grid: string
  text: string
  cutoff: string
  marker: string
}

export interface SpectrogramScene {
  /** The heat map (frames × rows pixels); null draws an empty plot. */
  image: CanvasImageSource | null
  /** Seconds the plot covers, for the time ticks. */
  seconds: number
  /** True: newest on the right, ticks count back from "now". */
  scrolling: boolean
  /** Cutoff in Hz across the plot (left → right), drawn as a line. */
  cutoff?: ArrayLike<number>
  /** Note start / end markers in seconds from the left edge. */
  markers?: { at: number; label: string }[]
  labels: { hz: (f: number) => string; time: (s: number) => string }
}

export const PAD_LEFT = 36
const PAD_BOTTOM = 20

export function spectrogramLayout(size: Size) {
  const bottom = size.height - PAD_BOTTOM
  const width = size.width - PAD_LEFT
  return {
    left: PAD_LEFT,
    bottom,
    width,
    y: (hz: number) => bottom * (1 - freqPos(hz, FREQ_MIN, FREQ_MAX)),
    x: (fraction: number) => PAD_LEFT + fraction * width,
  }
}

const HZ_TICKS = [50, 100, 200, 500, 1000, 2000, 5000, 10000]

export function drawSpectrogram(
  ctx: SpectrogramCtx,
  size: Size,
  scene: SpectrogramScene,
  theme: SpectrogramTheme,
) {
  const L = spectrogramLayout(size)
  ctx.clearRect(0, 0, size.width, size.height)
  if (scene.image) {
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(scene.image, L.left, 0, L.width, L.bottom)
  }

  ctx.font = MONO
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'right'
  ctx.lineWidth = 1
  for (const f of HZ_TICKS) {
    const y = L.y(f)
    ctx.strokeStyle = theme.grid
    ctx.globalAlpha = 0.5
    hline(ctx, y, L.left, size.width)
    ctx.globalAlpha = 1
    ctx.fillStyle = theme.text
    ctx.fillText(scene.labels.hz(f), L.left - 6, y)
  }

  // Time ticks: every 0.5 s (or 1 s on long plots).
  const step = scene.seconds > 3 ? 1 : 0.5
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  for (let t = 0; t <= scene.seconds + 1e-9; t += step) {
    const fraction = scene.scrolling ? 1 - t / scene.seconds : t / scene.seconds
    const x = L.x(fraction)
    // Keep the end labels inside the canvas.
    ctx.textAlign = x > size.width - 24 ? 'right' : x < L.left + 12 ? 'left' : 'center'
    ctx.fillStyle = theme.text
    ctx.fillText(scene.labels.time(t), x, L.bottom + 5)
  }

  for (const m of scene.markers ?? []) {
    const x = L.x(m.at / scene.seconds)
    ctx.strokeStyle = theme.marker
    ctx.setLineDash([3, 4])
    vline(ctx, x, 0, L.bottom)
    ctx.setLineDash([])
    ctx.fillStyle = theme.text
    ctx.textAlign = 'left'
    ctx.fillText(m.label, x + 4, 4)
  }

  if (scene.cutoff && scene.cutoff.length > 1) {
    const ys = Array.from(scene.cutoff, (hz) =>
      Math.min(L.bottom, Math.max(0, L.y(Number.isFinite(hz) ? hz : FREQ_MIN))),
    )
    ctx.strokeStyle = theme.cutoff
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    polyline(ctx, ys, L.left, size.width)
    ctx.setLineDash([])
  }
}
