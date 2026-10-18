<script lang="ts">
  import { stageColors } from '../content/controls'
  import { vizCopy } from '../content/viz'
  import type { Stage } from '../pedal/params'
  import { pedal } from '../state.svelte'
  import { BLOCKS, linksFor, type BlockId } from './links'

  const stageOf: Record<BlockId, Stage> = {
    input: 'input',
    tracking: 'input',
    osc: 'osc',
    filter: 'filter',
    amp: 'env',
    fx: 'mod',
    dyn: 'dyn',
    mix: 'dyn',
    out: 'dyn',
  }
  const lit = $derived(linksFor(pedal.focused, pedal.layer).blocks)
  const inactive = $derived(!pedal.state.engaged)
</script>

<div
  class="flex flex-wrap items-center gap-1.5 rounded-[14px] border border-line bg-surface px-3 py-2.5"
>
  <span class="mr-1.5 text-xs tracking-[0.04em] text-subtle" aria-hidden="true"
    >{vizCopy.chain}</span
  >
  <ol aria-label={vizCopy.chainLabel} class="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
    {#each BLOCKS as b, i (b)}
      {@const on = lit.includes(b)}
      <li class="flex items-center gap-1.5">
        <span
          data-block={b}
          data-highlighted={on}
          class={[
            'inline-flex items-center gap-[7px] rounded-full border px-[11px] py-1.5 text-[12.5px] font-medium transition-colors duration-150',
            on
              ? 'border-[#2f7f86] bg-[rgba(67,198,207,0.12)] text-text'
              : 'border-[#232a33] text-muted',
            inactive && !['input', 'mix', 'out'].includes(b) ? 'opacity-50' : '',
          ]}
          ><span class="size-[7px] rounded-full" style:background={stageColors[stageOf[b]]}
          ></span>{vizCopy.blocks[b]}</span
        >
        {#if i < BLOCKS.length - 1}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4a5562"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg
          >
        {/if}
      </li>
    {/each}
  </ol>
</div>
