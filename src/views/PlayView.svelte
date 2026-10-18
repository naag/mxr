<script lang="ts">
  import ExpressionPedal from '../lib/components/expression/ExpressionPedal.svelte'
  import { holdKeyHandlers } from '../lib/components/pedal/hold-keys'
  import ControlCaption from '../lib/components/pedal/ControlCaption.svelte'
  import LayerToggle from '../lib/components/pedal/LayerToggle.svelte'
  import Pedal from '../lib/components/pedal/Pedal.svelte'
  import PresetBar from '../lib/components/pedal/PresetBar.svelte'
  import ShareButton from '../lib/components/pedal/ShareButton.svelte'
  import { views } from '../lib/content/site'
  import { vizCopy } from '../lib/content/viz'
  import { pedal, viz } from '../lib/state.svelte'
  import EnvelopeGraph from '../lib/viz/EnvelopeGraph.svelte'
  import LevelMeter from '../lib/viz/LevelMeter.svelte'
  import { knobsForViz, type VizId } from '../lib/viz/links'
  import { onMount } from 'svelte'
  import { prefersReducedMotion } from 'svelte/motion'
  import { MediaQuery } from 'svelte/reactivity'
  import PitchGraph from '../lib/viz/PitchGraph.svelte'
  import Scope from '../lib/viz/Scope.svelte'
  import Segmented from '../lib/viz/Segmented.svelte'
  import SignalChain from '../lib/viz/SignalChain.svelte'
  import Spectrogram from '../lib/viz/Spectrogram.svelte'
  import Spectrum from '../lib/viz/Spectrum.svelte'

  const keys = holdKeyHandlers(pedal)

  // Performance (PLAN §5.6): paint the pedal first, mount the visuals in the next task, so
  // the first load isn't one long main-thread block.
  let visualsReady = $state(false)
  onMount(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const frame = requestAnimationFrame(() => {
      timer = setTimeout(() => (visualsReady = true))
    })
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  })

  // Phones (PLAN §2.4): the visuals become a swipeable strip with tabs.
  const phone = new MediaQuery('max-width: 767px')
  const slide = 'max-md:w-full max-md:flex-none max-md:snap-start'
  const tabs = $derived<VizId[]>(
    viz.detailed
      ? ['scope', 'meter', 'spectrum', 'spectrogram', 'envelope', 'pitch']
      : ['scope', 'meter', 'spectrum', 'envelope', 'pitch'],
  )
  let strip: HTMLDivElement | undefined = $state()
  let shown = $state<VizId>('scope')

  function show(id: VizId) {
    const panel = strip?.querySelector<HTMLElement>(`[data-viz="${id}"]`)
    if (!strip || !panel) return
    strip.scrollTo({
      left: panel.offsetLeft - strip.offsetLeft,
      behavior: prefersReducedMotion.current ? 'instant' : 'smooth',
    })
    shown = id
  }

  function onscroll() {
    if (!strip || !phone.current) return
    const i = Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth))
    shown = tabs[Math.min(tabs.length - 1, Math.max(0, i))]
  }

  const highlight = $derived(knobsForViz(viz.hovered, pedal.layer))
  const detailOptions = [
    { value: 'simple', label: vizCopy.simple },
    { value: 'detailed', label: vizCopy.detailed },
  ] as const
</script>

<svelte:window onkeydown={keys.keydown} onkeyup={keys.keyup} />

<div class="flex flex-wrap items-start gap-8">
  <div class="mx-auto flex w-full max-w-[440px] flex-col items-center gap-4">
    <PresetBar {pedal} />
    <div
      class="w-full rounded-3xl bg-[radial-gradient(ellipse_70%_55%_at_50%_42%,#1a2128_0%,transparent_72%)] py-2"
    >
      <Pedal {pedal} {highlight} />
    </div>
    <LayerToggle {pedal} />
    <ControlCaption {pedal} />
    <ExpressionPedal {pedal} />
    <ShareButton {pedal} />
  </div>
  <div class="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex max-w-2xl flex-col gap-1">
        <h1 class="m-0 text-xl leading-tight font-[650] tracking-tight">{views.play.title}</h1>
        <p class="m-0 text-sm text-[#b7c0c9]">{views.play.lede}</p>
      </div>
      <div class="ml-auto">
        <Segmented
          label={vizCopy.detailLabel}
          options={detailOptions}
          value={viz.detailed ? 'detailed' : 'simple'}
          onchange={(v) => viz.setDetailed(v === 'detailed')}
        />
      </div>
    </div>
    <SignalChain />
    {#if phone.current}
      <div
        role="group"
        aria-label={vizCopy.tabsLabel}
        class="-mx-4 flex gap-1 overflow-x-auto border-b border-line px-4"
        data-testid="viz-tabs"
      >
        {#each tabs as id (id)}
          <button
            type="button"
            aria-pressed={shown === id}
            onclick={() => show(id)}
            class={[
              'min-h-11 shrink-0 cursor-pointer border-b-2 px-3 text-[13.5px]',
              shown === id
                ? 'border-stage-filter font-semibold text-text'
                : 'border-transparent text-subtle',
            ]}>{vizCopy.tabs[id]}</button
          >
        {/each}
      </div>
    {/if}
    <div
      bind:this={strip}
      {onscroll}
      class="relative flex flex-col gap-4 max-md:-mx-4 max-md:snap-x max-md:snap-mandatory max-md:[scroll-padding-inline:16px] max-md:flex-row max-md:overflow-x-auto max-md:px-4"
      data-testid="viz-strip"
    >
      {#if visualsReady}
        <div class="flex flex-wrap gap-4 max-md:contents">
          <Scope class="flex-[3_1_460px] {slide}" />
          <LevelMeter class="flex-[2_1_260px] {slide}" />
        </div>
        <Spectrum class={slide} />
        {#if viz.detailed}<Spectrogram class={slide} />{/if}
        <div class="flex flex-wrap gap-4 max-md:contents">
          <EnvelopeGraph class="flex-[1_1_360px] {slide}" />
          <PitchGraph class="flex-[1_1_360px] {slide}" />
        </div>
      {:else}
        <div class="min-h-[1100px] max-md:min-h-[420px]" aria-hidden="true"></div>
      {/if}
    </div>
  </div>
</div>
