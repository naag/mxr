<script lang="ts">
  import ControlCaption from '../lib/components/pedal/ControlCaption.svelte'
  import LayerKeys from '../lib/components/pedal/LayerKeys.svelte'
  import LayerToggle from '../lib/components/pedal/LayerToggle.svelte'
  import Pedal from '../lib/components/pedal/Pedal.svelte'
  import PresetBar from '../lib/components/pedal/PresetBar.svelte'
  import ShareButton from '../lib/components/pedal/ShareButton.svelte'
  import { views } from '../lib/content/site'
  import { vizCopy } from '../lib/content/viz'
  import { pedal, viz } from '../lib/state.svelte'
  import EnvelopeGraph from '../lib/viz/EnvelopeGraph.svelte'
  import LevelMeter from '../lib/viz/LevelMeter.svelte'
  import { knobsForViz } from '../lib/viz/links'
  import PitchGraph from '../lib/viz/PitchGraph.svelte'
  import Scope from '../lib/viz/Scope.svelte'
  import Segmented from '../lib/viz/Segmented.svelte'
  import SignalChain from '../lib/viz/SignalChain.svelte'
  import Spectrum from '../lib/viz/Spectrum.svelte'

  const highlight = $derived(knobsForViz(viz.hovered, pedal.layer))
  const detailOptions = [
    { value: 'simple', label: vizCopy.simple },
    { value: 'detailed', label: vizCopy.detailed },
  ] as const
</script>

<LayerKeys {pedal} />

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
    <div class="flex flex-wrap gap-4">
      <Scope class="flex-[3_1_460px]" />
      <LevelMeter class="flex-[2_1_260px]" />
    </div>
    <Spectrum />
    <div class="flex flex-wrap gap-4">
      <EnvelopeGraph class="flex-[1_1_360px]" />
      <PitchGraph class="flex-[1_1_360px]" />
    </div>
  </div>
</div>
