/** The part of CanvasRenderingContext2D the drawing functions use (easy to fake in tests). */
export interface Ctx {
  strokeStyle: string | CanvasGradient | CanvasPattern
  fillStyle: string | CanvasGradient | CanvasPattern
  lineWidth: number
  lineJoin: CanvasLineJoin
  globalAlpha: number
  font: string
  textAlign: CanvasTextAlign
  textBaseline: CanvasTextBaseline
  shadowBlur: number
  shadowColor: string
  beginPath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  closePath(): void
  stroke(): void
  fill(): void
  fillRect(x: number, y: number, w: number, h: number): void
  clearRect(x: number, y: number, w: number, h: number): void
  fillText(text: string, x: number, y: number): void
  setLineDash(segments: number[]): void
  save(): void
  restore(): void
}

export interface Size {
  width: number
  height: number
}

/** Draws a polyline through `ys` spread evenly across `x0…x1`. */
export function polyline(ctx: Ctx, ys: ArrayLike<number>, x0: number, x1: number) {
  ctx.beginPath()
  const n = ys.length
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / Math.max(1, n - 1)
    if (i === 0) ctx.moveTo(x, ys[i])
    else ctx.lineTo(x, ys[i])
  }
  ctx.stroke()
}

export function hline(ctx: Ctx, y: number, x0: number, x1: number) {
  ctx.beginPath()
  ctx.moveTo(x0, y)
  ctx.lineTo(x1, y)
  ctx.stroke()
}

export function vline(ctx: Ctx, x: number, y0: number, y1: number) {
  ctx.beginPath()
  ctx.moveTo(x, y0)
  ctx.lineTo(x, y1)
  ctx.stroke()
}

export const MONO = '11px "JetBrains Mono Variable", ui-monospace, monospace'
export const SANS = '600 12.5px "Instrument Sans Variable", system-ui, sans-serif'
