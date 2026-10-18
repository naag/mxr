<script lang="ts">
  import { hrefFor } from '../router'
  import { parseRich } from './rich'

  let { text }: { text: string } = $props()
  const parts = $derived(parseRich(text))
</script>

{#each parts as p, i (i)}{#if p.term}<a
      href={hrefFor({ name: 'reference', term: p.term })}
      class="text-[#7fd8df] underline decoration-dotted underline-offset-[3px] hover:text-[#b5ecf0]"
      >{p.text}</a
    >{:else}{p.text}{/if}{/each}
