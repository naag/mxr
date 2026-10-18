<script lang="ts">
  import AppFooter from './lib/components/ui/AppFooter.svelte'
  import AppHeader from './lib/components/ui/AppHeader.svelte'
  import { router } from './lib/router.svelte'
  import FlowView from './views/FlowView.svelte'
  import LearnView from './views/LearnView.svelte'
  import PlayView from './views/PlayView.svelte'
  import PresetsView from './views/PresetsView.svelte'
  import ReferenceView from './views/ReferenceView.svelte'

  const route = $derived(router.route)
</script>

<div class="min-h-screen">
  <AppHeader current={route.name} />
  <main class="mx-auto max-w-[1440px] px-4 py-7 sm:px-7">
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
</div>
