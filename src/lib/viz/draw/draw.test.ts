import { describe, expect, it } from 'vitest'
import { ladderMagnitude } from '../../audio/dsp/ladder'
import type { EnvelopeCurve } from '../computed'
import type { Ctx } from './canvas'
import { envelopeGeometry } from './envelope'
import { pitchGeometry, pitchRange } from './pitch'
import { drawScope, type ScopeScene } from './scope'
import { drawSpectrogram, spectrogramLayout, type SpectrogramCtx } from './spectrogram'
import { drawSpectrum, spectrumLayout, type SpectrumScene } from './spectrum'

/** Records every call and property write, like a canvas that only takes notes. */
function recorder() {
  const calls: { op: string; args: unknown[] }[] = []
  const state: Record<string, unknown> = {}
  const ctx = new Proxy(state, {
    get(_, key: string) {
      if (key in state) return state[key]
      return (...args: unknown[]) => calls.push({ op: key, args })
    },
    set(_, key: string, value) {
      state[key] = value
      calls.push({ op: `set:${key}`, args: [value] })
      return true
    },
  }) as unknown as Ctx
  return { ctx, calls, count: (op: string) => calls.filter((c) => c.op === op).length }
}

const size = { width: 400, height: 200 }

const scopeTheme = {
  grid: 'g',
  axis: 'a',
  marker: 'm',
  text: 't',
  trace: 'tr',
  ghost: 'gh',
}

describe('drawScope', () => {
  const scene = (extra: Partial<ScopeScene> = {}): ScopeScene => ({
    traces: [{ samples: [0, 1, 0, -1, 0], color: 'teal', glow: true }],
    scale: 1,
    cycles: 2,
    detailed: false,
    highlighted: false,
    cycleLabel: (n) => `${n} cycle`,
    ...extra,
  })

  it('maps samples to the canvas: +1 near the top, −1 near the bottom', () => {
    const r = recorder()
    drawScope(r.ctx, size, scene({ cycles: 1 }), scopeTheme)
    const ys = r.calls.filter((c) => c.op === 'lineTo').map((c) => c.args[1] as number)
    expect(Math.min(...ys)).toBeCloseTo(100 - 86, 6)
    expect(Math.max(...ys)).toBeCloseTo(100 + 86, 6)
  })

  it('labels each cycle boundary and adds a grid in detailed mode', () => {
    const simple = recorder()
    drawScope(simple.ctx, size, scene({ cycles: 3 }), scopeTheme)
    expect(simple.calls.filter((c) => c.op === 'fillText').map((c) => c.args[0])).toEqual([
      '1 cycle',
      '2 cycle',
    ])
    const detailed = recorder()
    drawScope(detailed.ctx, size, scene({ cycles: 3, detailed: true }), scopeTheme)
    expect(detailed.count('stroke')).toBe(simple.count('stroke') + 4)
  })

  it('draws a flat line for silence instead of blowing up the noise', () => {
    const r = recorder()
    drawScope(
      r.ctx,
      size,
      scene({ scale: 0, traces: [{ samples: [0.00001, -0.00001], color: 'x' }] }),
      scopeTheme,
    )
    const ys = r.calls.filter((c) => c.op === 'lineTo').map((c) => c.args[1])
    expect(ys.at(-1)).toBe(100)
  })
})

describe('drawSpectrum', () => {
  const scene = (extra: Partial<SpectrumScene> = {}): SpectrumScene => ({
    base: 55,
    raw: Array.from({ length: 40 }, (_, i) => 1 / (i + 1)),
    filtered: Array.from(
      { length: 40 },
      (_, i) => (1 / (i + 1)) * ladderMagnitude((i + 1) * 55, 500, 2),
    ),
    curve: (hz) => ladderMagnitude(hz, 500, 2),
    cutoffHz: 500,
    detailed: false,
    highlighted: false,
    labels: {
      cutoff: 'cutoff 500 Hz',
      low: 'low',
      high: 'high',
      harmonic: (n) => `${n}×`,
      hz: (f) => `${f}`,
    },
    ...extra,
  })

  it('puts frequencies on a log axis and dB on a linear one', () => {
    const L = spectrumLayout(size)
    expect(L.x(20)).toBeCloseTo(0)
    expect(L.x(12000)).toBeCloseTo(400)
    expect(L.y(18)).toBeLessThan(L.y(0))
    expect(L.y(-200)).toBe(L.y(-60))
  })

  it('labels the cutoff and the first harmonics', () => {
    const r = recorder()
    drawSpectrum(r.ctx, size, scene(), {
      grid: 'g',
      axis: 'a',
      text: 't',
      label: 'l',
      bar: 'b',
      curve: 'c',
      curveLabel: 'cl',
      fft: 'f',
    })
    const texts = r.calls.filter((c) => c.op === 'fillText').map((c) => c.args[0])
    expect(texts).toContain('cutoff 500 Hz')
    expect(texts).toContain('1×')
    expect(texts).toContain('low')
    expect(texts).not.toContain('100')
  })

  it('shows Hz and dB axes and the FFT line in detailed mode', () => {
    const r = recorder()
    const mags = Float32Array.from({ length: 512 }, () => 0.01)
    drawSpectrum(r.ctx, size, scene({ detailed: true, fft: { mags, binHz: 23.4 } }), {
      grid: 'g',
      axis: 'a',
      text: 't',
      label: 'l',
      bar: 'b',
      curve: 'c',
      curveLabel: 'cl',
      fft: 'f',
    })
    const texts = r.calls.filter((c) => c.op === 'fillText').map((c) => c.args[0])
    expect(texts).toContain('1000')
    expect(texts).toContain('−24 dB')
    expect(r.calls.some((c) => c.op === 'set:strokeStyle' && c.args[0] === 'f')).toBe(true)
  })
})

describe('envelopeGeometry', () => {
  const curve = (cut: (t: number) => number): EnvelopeCurve => {
    const n = 800
    return {
      dt: 0.001,
      seconds: 0.8,
      cutoffHz: Float32Array.from({ length: n }, (_, i) => cut(i / 1000)),
      level: Float32Array.from({ length: n }, (_, i) => (i > 20 && i < 520 ? 1 : 0)),
      noteOn: 0.01,
      noteOff: 0.52,
      synthOn: 0.02,
      knobHz: 200,
    }
  }

  it('finds the peak of a blooming envelope above the knob line', () => {
    const g = envelopeGeometry(curve((t) => (t < 0.02 ? 200 : 200 * 2 ** (2 * Math.exp(-t * 8)))))
    expect(g.peak.hz).toBeGreaterThan(600)
    expect(g.peak.y).toBeLessThan(g.knobY)
    expect(g.above).toMatch(/^M0 /)
    expect(g.ticks.map((t) => t.ms)).toEqual([0, 200, 400, 600, 800])
  })

  it('finds the dip of a ducking envelope below the knob line', () => {
    const g = envelopeGeometry(curve((t) => (t < 0.02 ? 200 : 200 / 2 ** (2 * Math.exp(-t * 8)))))
    expect(g.low.hz).toBeLessThan(100)
    expect(g.low.y).toBeGreaterThan(g.knobY)
  })
})

describe('pitchGeometry', () => {
  it('keeps at least an octave in view', () => {
    const [lo, hi] = pitchRange([33])
    expect(hi - lo).toBeGreaterThanOrEqual(12)
  })

  it('breaks the line where the pitch is unknown and dims ignored notes', () => {
    const points = [
      { t: 0, midi: NaN },
      { t: 0.5, midi: 33 },
      { t: 1, midi: 36 },
      { t: 1.5, midi: NaN },
      { t: 2, midi: 33 },
    ]
    const g = pitchGeometry(points, [{ start: 0.5, end: 1, midi: 33, dim: true }], 0, 2)
    expect(g.path.match(/M/g)?.length).toBe(2)
    expect(g.bars[0].dim).toBe(true)
    expect(g.y(36)).toBeLessThan(g.y(33))
    expect(g.grid.find((l) => l.label === 'A1')?.natural).toBe(true)
  })
})

describe('drawSpectrogram', () => {
  const theme = { grid: 'g', text: 't', cutoff: 'c', marker: 'm' }
  const labels = { hz: (f: number) => `${f}`, time: (t: number) => `${t}s` }

  it('puts low frequencies at the bottom of the plot', () => {
    const L = spectrogramLayout(size)
    expect(L.y(20)).toBeCloseTo(L.bottom)
    expect(L.y(12000)).toBeCloseTo(0)
    expect(L.x(1)).toBe(400)
  })

  it('blits the heat map and draws ticks, markers and the cutoff line', () => {
    const r = recorder()
    const image = {} as CanvasImageSource
    drawSpectrogram(
      r.ctx as SpectrogramCtx,
      size,
      {
        image,
        seconds: 1,
        scrolling: false,
        cutoff: [200, 400, 800],
        markers: [{ at: 0.1, label: 'note' }],
        labels,
      },
      theme,
    )
    expect(r.calls.find((c) => c.op === 'drawImage')?.args[0]).toBe(image)
    const texts = r.calls.filter((c) => c.op === 'fillText').map((c) => c.args[0])
    expect(texts).toEqual(expect.arrayContaining(['100', '1000', '0s', '0.5s', '1s', 'note']))
    expect(r.calls.some((c) => c.op === 'set:strokeStyle' && c.args[0] === 'c')).toBe(true)
  })

  it('counts time back from now while scrolling, and skips a missing image', () => {
    const r = recorder()
    drawSpectrogram(
      r.ctx as SpectrogramCtx,
      size,
      { image: null, seconds: 4, scrolling: true, labels: { ...labels, time: (t) => `-${t}` } },
      theme,
    )
    expect(r.count('drawImage')).toBe(0)
    const texts = r.calls.filter((c) => c.op === 'fillText').map((c) => c.args[0])
    expect(texts).toEqual(expect.arrayContaining(['-0', '-4']))
  })
})
