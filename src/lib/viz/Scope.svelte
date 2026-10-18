<script lang="ts">
  import { midiToHz } from '../audio/dsp/analysis'
  import type { AnalyserName } from '../audio/engine'
  import { scopeReadout, vizCopy } from '../content/viz'
  import { audio, computed, pedal, pedalSettings, viz } from '../state.svelte'
  import { PeakHold, resample, scopeWindow } from './analysis'
  import { CanvasView, token } from './canvas.svelte'
  import { oscLayers, repeatHz, SCOPE_TAPS, WINDOW, type OscLayer, type ScopeTap } from './computed'
  import { drawScope, type ScopeTrace } from './draw/scope'
  import { linksFor } from './links'
  import { isLive } from './live.svelte'
  import { scheduler } from './scheduler'
  import Segmented from './Segmented.svelte'
  import VizPanel from './VizPanel.svelte'

  let {
    class: cls = '',
    fixedTap,
    fixedLayers,
  }: {
    class?: string
    /** Learn chapters pin the tap point (and layers mode) instead of using the shared choice. */
    fixedTap?: ScopeTap
    fixedLayers?: boolean
  } = $props()

  const pinned = $derived(fixedTap !== undefined)
  const tapNow = $derived(fixedTap ?? viz.tap)
  const layersNow = $derived(fixedLayers ?? viz.layers)

  const view = new CanvasView()
  const live = $derived(isLive())
  const highlighted = $derived(linksFor(pedal.focused, pedal.layer).viz.includes('scope'))
  let readout = $state('')
  let layerIds = $state<OscLayer['id'][]>([])

  const analyser: Record<ScopeTap, AnalyserName> = {
    osc: 'osc',
    filter: 'filter',
    amp: 'amp',
    out: 'left',
  }
  const tapColor: Record<ScopeTap, string> = {
    osc: 'stage-osc',
    filter: 'stage-filter',
    amp: 'stage-env',
    out: 'stage-dyn',
  }
  const layerColor = {
    main: 'stage-osc',
    voice1: 'layer-voice',
    voice2: 'layer-voice',
    sub: 'knob-orange',
    noise: 'muted',
  } as const

  const buf = new Float32Array(WINDOW)
  const ghostBuf = new Float32Array(WINDOW)
  const hold = new PeakHold(0.9)
  const ghostHold = new PeakHold(0.9)

  const peakOf = (x: ArrayLike<number>) => {
    let p = 0
    for (let i = 0; i < x.length; i++) p = Math.max(p, Math.abs(x[i]))
    return p
  }
  const scaled = (x: Float32Array, peak: number) =>
    peak > 1e-4 ? x.map((v) => v / peak) : new Float32Array(x.length)

  function draw() {
    const ctx = view.context()
    const snap = computed.snapshot
    if (!ctx) return
    const tap = tapNow
    const settings = pedalSettings()
    const isLiveNow = live && audio.engine.ctx !== null
    let main: Float32Array
    let ghost: Float32Array | null
    let midi: number | null
    let sr: number
    if (isLiveNow) {
      audio.engine.readTap(analyser[tap], buf)
      if (tap === 'filter') audio.engine.readTap('osc', ghostBuf)
      main = buf
      ghost = tap === 'filter' ? ghostBuf : null
      midi = audio.telemetry?.pitch ?? null
      sr = audio.engine.ctx!.sampleRate
    } else {
      if (!snap) return
      main = snap.taps[tap]
      ghost = tap === 'filter' ? snap.taps.osc : null
      midi = snap.midi
      sr = snap.sampleRate
    }
    const pitchHz = midi === null ? 55 : midiToHz(midi)
    const rep = repeatHz(settings, pitchHz)
    const period = sr / rep
    const points = Math.max(200, Math.min(900, Math.round(view.width)))
    let traces: ScopeTrace[]
    let cycles: number
    let silent: boolean

    if (layersNow && tap === 'osc') {
      cycles = 2
      const { layers, sum } = oscLayers(settings, midi ?? 33, cycles * period, sr)
      const peak = peakOf(sum)
      silent = false
      layerIds = layers.map((l) => l.id)
      traces = [
        ...layers.map((l) => ({
          samples: resample(scaled(l.samples, peak), 0, l.samples.length - 1, points),
          color: token(layerColor[l.id]),
          dashed: true,
        })),
        { samples: resample(scaled(sum, peak), 0, sum.length - 1, points), color: token('text') },
      ]
    } else {
      const w = scopeWindow(main, period, points, 2)
      cycles = w.cycles
      const peak = isLiveNow ? hold.next(peakOf(w.samples)) : peakOf(w.samples)
      silent = peak < 1e-3
      traces = []
      if (ghost) {
        const g = resample(ghost, w.start, w.length, points)
        const gp = isLiveNow ? ghostHold.next(peakOf(g)) : peakOf(g)
        traces.push({ samples: scaled(g, gp), color: token('stage-osc'), dashed: true })
      }
      traces.push({
        samples: scaled(w.samples, peak),
        color: token(tapColor[tap]),
        glow: true,
      })
    }

    drawScope(
      ctx,
      view.size,
      {
        traces,
        scale: silent ? 0 : 1,
        cycles,
        detailed: viz.detailed,
        highlighted,
        cycleLabel: vizCopy.scope.cycle,
      },
      {
        grid: token('grid'),
        axis: token('axis'),
        marker: token('marker'),
        text: token('faint'),
        trace: token(tapColor[tap]),
        ghost: token('stage-osc'),
      },
    )
    readout = scopeReadout({
      tap,
      midi,
      pitchHz,
      repeatHz: rep,
      silent,
      detailed: viz.detailed,
    })
  }

  // Live: redraw every frame while on screen. Computed: redraw when its inputs change.
  $effect(() => {
    if (live && view.visible) return scheduler().add(draw)
    draw()
  })

  const tapOptions = SCOPE_TAPS.map((t) => ({ value: t, label: vizCopy.taps[t] }))
</script>

<VizPanel
  id="scope"
  title={vizCopy.scope.title}
  sub={vizCopy.scope.sub}
  {live}
  {highlighted}
  {readout}
  class={cls}
>
  {#snippet actions()}
    {#if !pinned}
      <Segmented
        label={vizCopy.scope.tapLabel}
        options={tapOptions}
        value={viz.tap}
        onchange={(t) => viz.setTap(t)}
      />
      {#if viz.tap === 'osc'}
        <button
          type="button"
          aria-pressed={viz.layers}
          title={vizCopy.scope.layersHint}
          onclick={() => viz.setLayers(!viz.layers)}
          class={[
            'min-h-[36px] cursor-pointer rounded-[10px] border px-3 text-[12.5px]',
            viz.layers
              ? 'border-[#5c4a26] bg-[rgba(242,169,59,0.14)] font-semibold text-[#f7c77a]'
              : 'border-line text-muted hover:text-text',
          ]}>{vizCopy.scope.layers}</button
        >
      {/if}
    {/if}
  {/snippet}
  <div role="img" aria-label="{vizCopy.scope.canvas}: {readout}">
    <canvas
      {@attach view.attach}
      class="block h-[200px] w-full"
      aria-hidden="true"
      data-testid="scope-canvas"
    ></canvas>
  </div>
  {#snippet legend()}
    {#if layersNow && tapNow === 'osc'}
      <span class="inline-flex items-center gap-2"
        ><svg width="22" height="8" aria-hidden="true"
          ><path d="M1 4 H21" stroke="var(--color-text)" stroke-width="2.4" /></svg
        >{vizCopy.layerNames.sum}</span
      >
      {#each layerIds as id (id)}
        <span class="inline-flex items-center gap-2"
          ><svg width="22" height="8" aria-hidden="true"
            ><path
              d="M1 4 H21"
              stroke="var(--color-{layerColor[id]})"
              stroke-width="2"
              stroke-dasharray="4 3"
            /></svg
          >{vizCopy.layerNames[id]}</span
        >
      {/each}
    {:else}
      {#if tapNow === 'filter'}
        <span class="inline-flex items-center gap-2"
          ><svg width="22" height="8" aria-hidden="true"
            ><path
              d="M1 4 H21"
              stroke="var(--color-stage-osc)"
              stroke-width="2"
              stroke-dasharray="4 3"
            /></svg
          >{vizCopy.ghost}</span
        >
      {/if}
      <span class="inline-flex items-center gap-2"
        ><svg width="22" height="8" aria-hidden="true"
          ><path d="M1 4 H21" stroke="var(--color-{tapColor[tapNow]})" stroke-width="3" /></svg
        >{vizCopy.tapLegend[tapNow]}</span
      >
    {/if}
  {/snippet}
</VizPanel>
