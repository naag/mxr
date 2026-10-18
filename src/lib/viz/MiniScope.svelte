<script lang="ts">
  import { midiToHz } from '../audio/dsp/analysis'
  import type { WaveSource } from '../flow/stages'
  import { audio, computed, pedalSettings } from '../state.svelte'
  import { scopeWindow } from './analysis'
  import { CanvasView, token } from './canvas.svelte'
  import { repeatHz } from './computed'
  import { drawLevel, drawScope } from './draw/scope'
  import { readLiveTap } from './live-taps'
  import { isLive } from './live.svelte'
  import { scheduler } from './scheduler'

  interface Props {
    source: WaveSource
    view: 'cycles' | 'note'
    /** Theme color token, e.g. 'stage-filter'. */
    color: string
    /** Greyed out (stage off or bypassed). */
    dim?: boolean
    class?: string
  }
  let { source, view, color, dim = false, class: cls = '' }: Props = $props()

  const canvas = new CanvasView()
  const live = $derived(isLive())
  /** Live "note" view: rolling peak levels, newest last (about 4 s at 60 fps). */
  const history = new Float32Array(240)
  let historyPeak = 0

  const peakOf = (x: ArrayLike<number>, from = 0) => {
    let p = 0
    for (let i = from; i < x.length; i++) p = Math.max(p, Math.abs(x[i]))
    return p
  }

  function sine(hz: number, sr: number, n: number) {
    return Float32Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * hz * i) / sr))
  }

  function draw(frame = -1) {
    const ctx = canvas.context()
    const snap = computed.snapshot
    if (!ctx) return
    const engine = audio.engine
    const liveNow = live && engine.ctx !== null && frame >= 0
    const tint = token(dim ? 'marker' : color)
    const axis = token('axis')
    const sr = liveNow ? engine.ctx!.sampleRate : (snap?.sampleRate ?? 48000)
    const midi = liveNow ? (audio.telemetry?.pitch ?? 33) : (snap?.midi ?? 33)
    const pitchHz = midiToHz(midi)

    if (view === 'note' && source !== 'pitch') {
      if (liveNow) {
        const x = readLiveTap(engine, source, frame)
        if (!x) return
        history.copyWithin(0, 1)
        // The newest ~20 ms: about one frame's worth of signal.
        history[history.length - 1] = peakOf(x, x.length - 960)
        historyPeak = Math.max(peakOf(history), historyPeak * 0.995)
        drawLevel(ctx, canvas.size, history, historyPeak, tint, axis)
      } else if (snap) {
        const peaks = snap.long[source]
        drawLevel(ctx, canvas.size, peaks, peakOf(peaks), tint, axis)
      }
      return
    }

    const points = Math.max(80, Math.min(600, Math.round(canvas.width)))
    let x: Float32Array | null
    if (source === 'pitch') x = sine(pitchHz, sr, 4096)
    else x = liveNow ? readLiveTap(engine, source, frame) : (snap?.taps[source] ?? null)
    if (!x) return
    const period =
      sr / (source === 'pitch' || source === 'dry' ? pitchHz : repeatHz(pedalSettings(), pitchHz))
    const w = scopeWindow(x, period, points, 2)
    const peak = peakOf(w.samples)
    drawScope(
      ctx,
      canvas.size,
      {
        traces: [
          {
            samples: peak > 1e-4 ? w.samples.map((v) => v / peak) : w.samples,
            color: tint,
            width: 1.8,
          },
        ],
        scale: peak > 1e-3 ? 1 : 0,
        cycles: 1,
        detailed: false,
        highlighted: false,
        cycleLabel: () => '',
      },
      { grid: axis, axis, marker: axis, text: axis, trace: tint, ghost: tint },
    )
  }

  $effect(() => {
    if (live && canvas.visible) return scheduler().add((now) => draw(now))
    draw()
  })
</script>

<div class={cls}>
  <canvas {@attach canvas.attach} class="block h-full w-full" aria-hidden="true"></canvas>
</div>
