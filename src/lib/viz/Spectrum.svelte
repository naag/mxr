<script lang="ts">
  import { midiToHz } from '../audio/dsp/analysis'
  import { ladderMagnitude } from '../audio/dsp/ladder'
  import { spectrumReadout, vizCopy } from '../content/viz'
  import { resonanceFeedback } from '../pedal/params'
  import { audio, computed, pedal, pedalSettings, viz } from '../state.svelte'
  import { centroidOf, harmonicLevels, magnitudeSpectrum } from './analysis'
  import { CanvasView, token } from './canvas.svelte'
  import { repeatHz, WINDOW } from './computed'
  import { drawSpectrum } from './draw/spectrum'
  import { linksFor } from './links'
  import { isLive } from './live.svelte'
  import { scheduler } from './scheduler'
  import VizPanel from './VizPanel.svelte'

  let { class: cls = '' }: { class?: string } = $props()

  const view = new CanvasView()
  const live = $derived(isLive())
  const link = $derived(linksFor(pedal.focused, pedal.layer))
  const highlighted = $derived(link.viz.includes('spectrum'))
  let readout = $state('')
  let baseHz = $state(55)

  const filterBuf = new Float32Array(WINDOW)
  const oscBuf = new Float32Array(WINDOW)
  const AUDIBLE = 10 ** (-24 / 20)

  /** Frequency of the resonant peak, if the curve has one above its low-end level. */
  function peakOf(curve: (hz: number) => number, cutoff: number): number | null {
    const lowGain = curve(20)
    let best = cutoff
    let bestGain = 0
    for (let i = 0; i <= 120; i++) {
      const hz = cutoff * 2 ** ((i - 60) / 40)
      const g = curve(hz)
      if (g > bestGain) {
        bestGain = g
        best = hz
      }
    }
    return bestGain > lowGain * 1.12 ? best : null
  }

  function draw() {
    const ctx = view.context()
    const snap = computed.snapshot
    if (!ctx) return
    const settings = pedalSettings()
    let filter: Float32Array
    let osc: Float32Array
    let midi: number | null
    let sr: number
    let cutoff: number
    if (live && audio.engine.ctx) {
      audio.engine.readTap('filter', filterBuf)
      audio.engine.readTap('osc', oscBuf)
      filter = filterBuf
      osc = oscBuf
      midi = audio.telemetry?.pitch ?? null
      sr = audio.engine.ctx.sampleRate
      cutoff = audio.telemetry?.cutoffHz ?? 640
    } else {
      if (!snap) return
      filter = snap.taps.filter
      osc = snap.taps.osc
      midi = snap.midi
      sr = snap.sampleRate
      cutoff = snap.cutoffNow
    }
    const binHz = sr / WINDOW
    const pitchHz = midiToHz(midi ?? 33)
    const base = repeatHz(settings, pitchHz)
    const filterMags = magnitudeSpectrum(filter)
    const oscMags = magnitudeSpectrum(osc)
    const raw = harmonicLevels(oscMags, binHz, base, 12000)
    const filtered = harmonicLevels(filterMags, binHz, base, 12000)
    // 0 dB = the loudest harmonic going into the filter (which takes 0.7 × the oscillators).
    const ref = raw.reduce((m, v) => Math.max(m, v), 0)
    const rawScale = ref > 1e-5 ? 1 / ref : 0
    const filterScale = ref > 1e-5 ? 1 / (0.7 * ref) : 0
    const k = resonanceFeedback(settings.patch.values.resonance)
    const curve = (hz: number) => ladderMagnitude(hz, cutoff, k)
    const fft = filterMags.map((v) => v * filterScale)
    drawSpectrum(
      ctx,
      view.size,
      {
        base,
        raw: raw.map((v) => v * rawScale),
        filtered: filtered.map((v) => v * filterScale),
        curve,
        cutoffHz: cutoff,
        fft: { mags: fft, binHz },
        detailed: viz.detailed,
        highlighted: highlighted && link.curve === true,
        labels: {
          cutoff: vizCopy.spectrum.cutoff(cutoff, viz.detailed),
          low: vizCopy.spectrum.low,
          high: vizCopy.spectrum.high,
          harmonic: vizCopy.spectrum.harmonic,
          hz: vizCopy.spectrum.hzTick,
        },
      },
      {
        grid: token('grid'),
        axis: token('axis'),
        text: token('faint'),
        label: '#c9d1d9',
        bar: token('stage-osc'),
        curve: token('stage-filter'),
        curveLabel: '#7fd8df',
        fft: token('stage-filter'),
      },
    )
    baseHz = base
    readout = spectrumReadout({
      midi: ref > 1e-5 ? midi : null,
      pitchHz,
      centroidHz: centroidOf(filterMags, binHz),
      cutoffHz: cutoff,
      peakHz: peakOf(curve, cutoff),
      audible: filtered.reduce((n, v) => n + (v * filterScale >= AUDIBLE ? 1 : 0), 0),
      detailed: viz.detailed,
    })
  }

  $effect(() => {
    if (live && view.visible) return scheduler().add(draw)
    draw()
  })
</script>

<VizPanel
  id="spectrum"
  title={vizCopy.spectrum.title}
  sub={vizCopy.spectrum.sub}
  {live}
  {highlighted}
  {readout}
  class={cls}
>
  <div
    role="img"
    aria-label="{vizCopy.spectrum.canvas}: {readout}"
    data-curve-highlighted={highlighted && link.curve === true}
    data-testid="spectrum-curve"
  >
    <canvas {@attach view.attach} class="block h-[240px] w-full" aria-hidden="true"></canvas>
  </div>
  {#snippet legend()}
    <span class="inline-flex items-center gap-2"
      ><svg width="14" height="12" aria-hidden="true"
        ><path
          d="M3 12 V2 M7 12 V5 M11 12 V7"
          stroke="var(--color-stage-osc)"
          stroke-width="2"
        /></svg
      >{vizCopy.spectrum.harmonics(baseHz)}</span
    >
    <span class="inline-flex items-center gap-2"
      ><svg width="14" height="12" aria-hidden="true"
        ><path
          d="M3 12 V2 M7 12 V5 M11 12 V7"
          stroke="var(--color-stage-osc)"
          stroke-opacity="0.3"
          stroke-width="2"
        /></svg
      >{vizCopy.spectrum.before}</span
    >
    <span class="inline-flex items-center gap-2"
      ><svg width="22" height="8" aria-hidden="true"
        ><path d="M1 4 H21" stroke="var(--color-stage-filter)" stroke-width="3" /></svg
      >{vizCopy.spectrum.curve}</span
    >
    {#if viz.detailed}
      <span class="inline-flex items-center gap-2"
        ><svg width="22" height="8" aria-hidden="true"
          ><path
            d="M1 4 H21"
            stroke="var(--color-stage-filter)"
            stroke-opacity="0.55"
            stroke-width="1.2"
          /></svg
        >{vizCopy.spectrum.fft}</span
      >
    {/if}
  {/snippet}
</VizPanel>
