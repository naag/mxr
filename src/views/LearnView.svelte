<script lang="ts">
  import ViewPlaceholder from '../lib/components/ui/ViewPlaceholder.svelte'
  import { views } from '../lib/content/site'

  let { chapter }: { chapter: number } = $props()
</script>

<ViewPlaceholder {...views.learn}>
  <p class="m-0 font-mono text-sm text-stage-filter">Chapter {chapter}</p>
</ViewPlaceholder>
