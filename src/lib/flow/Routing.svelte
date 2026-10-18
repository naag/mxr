<script lang="ts">
  import { flowCopy, routingCopy } from '../content/flow'
  import type { OutputMode } from './stages'

  let { mode }: { mode: OutputMode } = $props()
  const r = $derived(routingCopy[mode])
</script>

<div
  class="flex flex-col gap-2 rounded-[10px] border border-line bg-[#0d1115] p-3"
  data-testid="routing"
  data-mode={mode}
>
  <span class="text-[11.5px] tracking-[0.06em] text-subtle uppercase"
    >{flowCopy.jacks} · {r.label}</span
  >
  {#each [{ jack: flowCopy.outJack, text: r.out, used: true }, { jack: flowCopy.ctrJack, text: r.ctr, used: mode !== 'mono' }] as j (j.jack)}
    <div class={['flex items-center gap-3 text-[13px]', j.used ? '' : 'opacity-55']}>
      <span
        class="w-12 rounded-md border border-[#2a313a] py-0.5 text-center font-mono text-xs text-[#c9d1d9]"
        >{j.jack}</span
      >
      <span class={j.used ? 'text-text' : 'text-muted'}>{j.text}</span>
    </div>
  {/each}
</div>
