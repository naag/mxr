<script lang="ts">
  import SoundControls from './lib/components/audio/SoundControls.svelte'
  import SourceBar from './lib/components/audio/SourceBar.svelte'
  import AppFooter from './lib/components/ui/AppFooter.svelte'
  import AppHeader from './lib/components/ui/AppHeader.svelte'
  import { router } from './lib/router.svelte'
  import { audio, computed, pedalSettings } from './lib/state.svelte'
  import { FLOW_STAGE, type FlowStageId } from './lib/viz/flow'
  import FlowView from './views/FlowView.svelte'
  import PlayView from './views/PlayView.svelte'

  // Views other than Play and Under the hood load when first opened (PLAN §5.6).
  const learnView = () => import('./views/LearnView.svelte')
  const referenceView = () => import('./views/ReferenceView.svelte')
  const presetsView = () => import('./views/PresetsView.svelte')
  const aboutView = () => import('./views/AboutView.svelte')

  const route = $derived(router.route)

  // Keep the sound engine in step with the pedal.
  $effect(() => {
    audio.setSettings(pedalSettings())
  })

  // Re-render the computed visuals whenever the sound or the riff changes (every view uses them).
  $effect(() => {
    computed.request({ settings: pedalSettings(), riff: audio.riff, bpm: audio.bpm })
  })

  const flowStage = $derived(
    route.item && route.item in FLOW_STAGE ? (route.item as FlowStageId) : null,
  )
</script>

<div class="flex min-h-screen flex-col">
  <AppHeader current={route.name}>
    {#snippet end()}<SoundControls />{/snippet}
  </AppHeader>
  <main class="mx-auto w-full max-w-[1440px] flex-1 px-4 py-7 sm:px-7">
    {#if route.name === 'flow'}
      {#key flowStage}<FlowView stage={flowStage} />{/key}
    {:else if route.name === 'learn'}
      {#await learnView() then { default: LearnView }}
        <LearnView chapter={route.chapter ?? 0} />
      {/await}
    {:else if route.name === 'presets'}
      {#await presetsView() then { default: PresetsView }}
        {#key route.item}<PresetsView item={route.item ?? null} />{/key}
      {/await}
    {:else if route.name === 'about'}
      {#await aboutView() then { default: AboutView }}<AboutView />{/await}
    {:else if route.name === 'reference'}
      {#await referenceView() then { default: ReferenceView }}
        <ReferenceView term={route.item ?? null} />
      {/await}
    {:else}
      <PlayView />
    {/if}
  </main>
  <AppFooter />
  <SourceBar />
</div>
