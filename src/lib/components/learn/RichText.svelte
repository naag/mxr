<script lang="ts">
  import { glossaryById } from '../../content/glossary'
  import { parseRich, plainText } from '../../learn/rich'
  import { hrefFor } from '../../router'

  /** Copy with `[[term]]` glossary links (see learn/rich.ts). */
  let { text }: { text: string } = $props()
  const parts = $derived(parseRich(text))
</script>

{#each parts as part, i (i)}{#if 'term' in part}<a
      href={hrefFor({ name: 'reference', item: part.term })}
      title={plainText(glossaryById[part.term]?.definition ?? '')}
      class="text-[#7fd8df] underline decoration-dotted underline-offset-2 hover:text-[#b5ecf0]"
      ><em>{part.text}</em></a
    >{:else}{part.text}{/if}{/each}
