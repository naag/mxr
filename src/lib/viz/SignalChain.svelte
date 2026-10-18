<script lang="ts">
  import { stageColors } from '../content/controls'
  import { vizCopy } from '../content/viz'
  import type { Stage } from '../pedal/params'
  import { pedal, viz } from '../state.svelte'
  import type { ScopeTap } from './computed'
  import { BLOCKS, linksFor, type BlockId } from './links'

  /** Blocks you can click to look at in the waveform. */
  const tapOf: Partial<Record<BlockId, ScopeTap>> = {
    osc: 'osc',
    filter: 'filter',
    amp: 'amp',
    out: 'out',
  }

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
      {@const tap = tapOf[b]}
      {@const cls = [
        'inline-flex items-center gap-[7px] rounded-full border px-[11px] py-1.5 text-[12.5px] font-medium transition-colors duration-150',
        on
          ? 'border-[#2f7f86] bg-[rgba(67,198,207,0.12)] text-text'
          : 'border-[#232a33] text-muted',
        inactive && !['input', 'mix', 'out'].includes(b) ? 'opacity-50' : '',
      ]}
      <li class="flex items-center gap-1.5">
        {#if tap}
          <button
            type="button"
            data-block={b}
            data-highlighted={on}
            aria-pressed={viz.tap === tap}
            title={vizCopy.showInScope(vizCopy.blocks[b])}
            onclick={() => viz.setTap(tap)}
            class={[
              ...cls,
              'cursor-pointer hover:border-[#3a4450]',
              viz.tap === tap ? 'ring-1 ring-[#3a4450]' : '',
            ]}
            ><span class="size-[7px] rounded-full" style:background={stageColors[stageOf[b]]}
            ></span>{vizCopy.blocks[b]}</button
          >
        {:else}
          <span data-block={b} data-highlighted={on} class={cls}
            ><span class="size-[7px] rounded-full" style:background={stageColors[stageOf[b]]}
            ></span>{vizCopy.blocks[b]}</span
          >
        {/if}
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
  <a
    href="#/flow"
    class="ml-auto px-1 py-1.5 text-[13px] font-medium text-[#7fd8df] hover:text-[#b5ecf0]"
    >{vizCopy.openFlow} →</a
  >
</div>
