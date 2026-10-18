<script lang="ts">
  import { spectrogramReadout, vizCopy } from '../content/viz'
  import { audio, computed, pedal } from '../state.svelte'
  import { magnitudeSpectrum } from './analysis'
  import { CanvasView, token } from './canvas.svelte'
  import { WINDOW } from './computed'
  import { drawSpectrogram, type SpectrogramCtx } from './draw/spectrogram'
  import { linksFor } from './links'
  import { isLive } from './live.svelte'
  import { scheduler } from './scheduler'
  import {
    columnSummary,
    SPEC_FFT,
    spectrogramColumn,
    spectrogramPixels,
    SpectrogramHistory,
    type SpectrogramData,
  } from './spectrogram'
  import VizPanel from './VizPanel.svelte'

  let { class: cls = '' }: { class?: string } = $props()

  /** Live view: columns per second and how many seconds it keeps. */
  const RATE = 50
  const SECONDS = 6

  const view = new CanvasView()
  const live = $derived(isLive())
  const link = $derived(linksFor(pedal.focused, pedal.layer))
  const highlighted = $derived(link.viz.includes('spectrogram'))
  let readout = $state('')

  const history = new SpectrogramHistory(RATE * SECONDS)
  const cutoffs = new Float32Array(RATE * SECONDS).fill(NaN)
  const buf = new Float32Array(WINDOW)
  let lastPush = -Infinity

  // The heat map is drawn into a small offscreen canvas, then scaled into the plot.
  let image: HTMLCanvasElement | null = null
  function toImage(data: SpectrogramData): HTMLCanvasElement | null {
    if (typeof document === 'undefined' || data.frames === 0) return null
    image ??= document.createElement('canvas')
    if (image.width !== data.frames || image.height !== data.rows) {
      image.width = data.frames
      image.height = data.rows
    }
    const ctx = image.getContext('2d')
    if (!ctx) return null
    ctx.putImageData(new ImageData(spectrogramPixels(data), data.frames, data.rows), 0, 0)
    return image
  }

  const theme = () => ({
    grid: token('grid'),
    text: token('faint'),
    cutoff: token('stage-filter'),
    marker: token('marker'),
  })

  function drawLive(now: number) {
    const ctx = view.context() as SpectrogramCtx | null
    if (!ctx || !audio.engine.ctx) return
    if (now - lastPush >= 1000 / RATE) {
      lastPush = now
      audio.engine.readTap('left', buf)
      const column = spectrogramColumn(
        magnitudeSpectrum(buf, SPEC_FFT),
        audio.engine.ctx.sampleRate / SPEC_FFT,
      )
      history.push(column)
      cutoffs.copyWithin(0, 1)
      cutoffs[cutoffs.length - 1] = audio.telemetry?.cutoffHz ?? NaN
      readout = spectrogramReadout(columnSummary(column), 'now')
    }
    drawSpectrogram(
      ctx,
      view.size,
      {
        image: toImage(history.toData()),
        seconds: SECONDS,
        scrolling: true,
        cutoff: cutoffs,
        labels: { hz: vizCopy.spectrogram.hzTick, time: vizCopy.spectrogram.ago },
      },
      theme(),
    )
  }

  function drawComputed() {
    const ctx = view.context() as SpectrogramCtx | null
    const snap = computed.snapshot
    if (!ctx || !snap) return
    const g = snap.spectrogram
    const env = snap.envelope
    drawSpectrogram(
      ctx,
      view.size,
      {
        image: toImage(g),
        seconds: env.seconds,
        scrolling: false,
        cutoff: env.cutoffHz,
        markers: [
          { at: env.synthOn, label: vizCopy.spectrogram.noteOn },
          { at: env.noteOff, label: vizCopy.spectrogram.noteEnds },
        ],
        labels: { hz: vizCopy.spectrogram.hzTick, time: vizCopy.spectrogram.time },
      },
      theme(),
    )
    const f = Math.min(g.frames - 1, Math.round(snap.at / g.dt))
    readout = spectrogramReadout(
      f >= 0 ? columnSummary(g.data.subarray(f * g.rows, (f + 1) * g.rows)) : null,
      'note',
    )
  }

  $effect(() => {
    if (live && view.visible) {
      history.clear()
      cutoffs.fill(NaN)
      return scheduler().add(drawLive)
    }
    // Redraw when the snapshot or the size changes.
    void computed.snapshot
    void view.width
    drawComputed()
  })
</script>

<VizPanel
  id="spectrogram"
  title={vizCopy.spectrogram.title}
  sub={live ? vizCopy.spectrogram.sub : vizCopy.spectrogram.subComputed}
  {live}
  {highlighted}
  {readout}
  class={cls}
>
  <div role="img" aria-label="{vizCopy.spectrogram.canvas}: {readout}" data-testid="spectrogram">
    <canvas {@attach view.attach} class="block h-[200px] w-full" aria-hidden="true"></canvas>
  </div>
  {#snippet legend()}
    <span class="inline-flex items-center gap-2"
      ><span
        class="inline-block h-2.5 w-10 rounded-sm"
        style:background="linear-gradient(90deg, #0d1014, #3a2c6e, #43c6cf, #f2a93b, #fff4de)"
        aria-hidden="true"
      ></span>{vizCopy.spectrogram.heat}</span
    >
    <span class="inline-flex items-center gap-2"
      ><svg width="22" height="8" aria-hidden="true"
        ><path
          d="M1 4 H21"
          stroke="var(--color-stage-filter)"
          stroke-width="2"
          stroke-dasharray="6 4"
        /></svg
      >{vizCopy.spectrogram.cutoff}</span
    >
  {/snippet}
</VizPanel>
