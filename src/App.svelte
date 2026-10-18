<script lang="ts">
  import SoundControls from './lib/components/audio/SoundControls.svelte'
  import SourceBar from './lib/components/audio/SourceBar.svelte'
  import AppFooter from './lib/components/ui/AppFooter.svelte'
  import AppHeader from './lib/components/ui/AppHeader.svelte'
  import { router } from './lib/router.svelte'
  import { audio, pedalSettings } from './lib/state.svelte'
  import FlowView from './views/FlowView.svelte'
  import LearnView from './views/LearnView.svelte'
  import PlayView from './views/PlayView.svelte'
  import PresetsView from './views/PresetsView.svelte'
  import ReferenceView from './views/ReferenceView.svelte'

  const route = $derived(router.route)

  // Keep the sound engine in step with the pedal.
  $effect(() => {
    audio.setSettings(pedalSettings())
  })
</script>

<div class="flex min-h-screen flex-col">
  <AppHeader current={route.name}>
    {#snippet end()}<SoundControls />{/snippet}
  </AppHeader>
  <main class="mx-auto w-full max-w-[1440px] flex-1 px-4 py-7 sm:px-7">
    {#if route.name === 'flow'}
      <FlowView />
    {:else if route.name === 'learn'}
      <LearnView chapter={route.chapter ?? 0} />
    {:else if route.name === 'presets'}
      <PresetsView />
    {:else if route.name === 'reference'}
      <ReferenceView />
    {:else}
      <PlayView />
    {/if}
  </main>
  <AppFooter />
  <SourceBar />
</div>
