<script lang="ts">
  import { statusCopy } from '../../content/controls'
  import type { PedalStore } from '../../pedal/pedal.svelte'

  let { pedal }: { pedal: PedalStore } = $props()

  const s = $derived(pedal.state)
  const info = $derived(pedal.preset.info)
  const bank = $derived(pedal.preset.bank)
  const dot = $derived(
    bank === 'green' ? 'var(--color-led-green)' : bank === 'red' ? 'var(--color-led-red)' : null,
  )
  const status = $derived.by(() => {
    if (s.confirm) return statusCopy[s.confirm.kind]
    if (s.copy) return s.preset === 0 ? statusCopy.copyLive : statusCopy.copy
    if (s.frozen) return statusCopy.frozen
    if (s.scrollUntil !== null) return statusCopy.scroll
    if (s.footMode === 'freeze') return statusCopy.freezeMode
    return null
  })

  const step = (d: number) => pedal.select(s.preset + d)
</script>

<div class="flex w-full flex-col gap-2">
  <div class="flex items-center gap-3">
    <span
      class="size-2.5 shrink-0 rounded-full"
      style:background={dot ?? '#5b6470'}
      style:box-shadow={dot ? `0 0 10px ${dot}` : 'none'}
      aria-hidden="true"
    ></span>
    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
      <span class="font-mono text-[11px] font-medium tracking-[0.08em] text-muted">
        {info ? `${info.code} · ${bank?.toUpperCase()}` : 'LIVE'}
      </span>
      <span class="text-[17px] font-semibold tracking-[0.01em]" data-testid="preset-name"
        >{info ? info.name : statusCopy.liveMode}</span
      >
    </div>
    {#if pedal.modified}
      <span
        class="rounded-full border border-[#3a4450] px-2 py-0.5 font-mono text-[11px] text-[#c9d1d9]"
        data-testid="preset-edited">{statusCopy.edited}</span
      >
    {/if}
    {#each [-1, 1] as d (d)}
      <button
        type="button"
        aria-label={d < 0 ? 'Previous preset' : 'Next preset'}
        onclick={() => step(d)}
        class="flex size-10 cursor-pointer items-center justify-center rounded-[10px] border border-[#2a313a] bg-surface text-[#c9d1d9] hover:text-text"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"><path d={d < 0 ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} /></svg
        >
      </button>
    {/each}
  </div>
  <p
    class="m-0 min-h-5 text-[13px] leading-snug text-stage-filter"
    role="status"
    data-testid="pedal-status"
  >
    {status ?? ''}
  </p>
</div>
