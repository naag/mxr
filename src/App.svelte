<script lang="ts">
  import SoundControls from './lib/components/audio/SoundControls.svelte'
  import SourceBar from './lib/components/audio/SourceBar.svelte'
  import AppFooter from './lib/components/ui/AppFooter.svelte'
  import AppHeader from './lib/components/ui/AppHeader.svelte'
  import ShortcutSheet from './lib/components/ui/ShortcutSheet.svelte'
  import { siteCopy } from './lib/content/site'
  import { router } from './lib/router.svelte'
  import { keyContext, shortcutFor } from './lib/shortcuts'
  import { audio, computed, pedal, pedalSettings } from './lib/state.svelte'
  import { FLOW_STAGE, type FlowStageId } from './lib/viz/flow'
  import FlowView from './views/FlowView.svelte'
  import PlayView from './views/PlayView.svelte'

  // Views other than Play and Under the hood load when first opened (PLAN §5.6).
  const learnView = () => import('./views/LearnView.svelte')
  const referenceView = () => import('./views/ReferenceView.svelte')
  const presetsView = () => import('./views/PresetsView.svelte')
  const aboutView = () => import('./views/AboutView.svelte')

  const route = $derived(router.route)
  let shortcutsOpen = $state(false)

  function keydown(e: KeyboardEvent) {
    const action = shortcutFor(e, keyContext(e.target, audio.source === 'keyboard'))
    if (!action) return
    e.preventDefault()
    if (action === 'help') shortcutsOpen = true
    else if (action === 'mute') audio.toggleMute()
    else if (action === 'footswitch') pedal.toggleBypass()
    else pedal.select(pedal.state.preset + (action === 'nextPreset' ? 1 : -1))
  }

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

<svelte:window onkeydown={keydown} />

<a
  href="#main"
  onclick={(e) => {
    e.preventDefault()
    document.getElementById('main')?.focus()
  }}
  class="sr-only z-50 rounded-lg bg-raised px-3 py-2 text-sm text-text focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
  >{siteCopy.skip}</a
>
<div class="flex min-h-screen flex-col">
  <AppHeader current={route.name}>
    {#snippet end()}<SoundControls />{/snippet}
  </AppHeader>
  <main
    id="main"
    tabindex="-1"
    class="mx-auto w-full max-w-[1440px] flex-1 px-4 py-7 outline-none sm:px-7"
  >
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
  <AppFooter onshortcuts={() => (shortcutsOpen = true)} />
  <SourceBar />
</div>
<ShortcutSheet bind:open={shortcutsOpen} />
