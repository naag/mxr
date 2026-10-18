<script lang="ts">
  import { audioCopy } from '../../content/audio'
  import { audio } from '../../state.svelte'

  const t = $derived(audio.telemetry)
  // Peak level → 0–1 bar on a −48…0 dB scale.
  const bar = (peak: number) =>
    Math.min(1, Math.max(0, 1 + (20 * Math.log10(Math.max(peak, 1e-5))) / 48))
  const level = $derived(
    t && audio.status === 'running' ? bar(Math.max(t.peakLeft, t.peakRight)) : 0,
  )
  const segments = [0.15, 0.35, 0.55, 0.75, 0.9]
  const segmentColor = (i: number) =>
    i >= 4 ? '#e5484d' : i === 3 ? '#d9c85a' : 'var(--color-stage-dyn)'
</script>

<div class="flex flex-wrap items-center gap-3">
  {#if audio.status === 'running'}
    <div
      class="flex h-[18px] items-end gap-[3px]"
      role="meter"
      aria-label={audioCopy.meter}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={Math.round(level * 100) / 100}
      data-testid="output-meter"
    >
      {#each segments as s, i (s)}
        <span
          class="w-1 rounded-sm transition-colors duration-75"
          style:height="{6 + i * 3}px"
          style:background={level >= s ? segmentColor(i) : '#2a313a'}
        ></span>
      {/each}
    </div>
    <label class="flex items-center gap-2 text-[13px] text-muted">
      <span class="sr-only sm:not-sr-only">{audioCopy.volume}</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={audio.volume}
        oninput={(e) => audio.setVolume(Number(e.currentTarget.value))}
        class="w-24 accent-[var(--color-stage-filter)]"
      />
    </label>
    <button
      type="button"
      aria-pressed={audio.muted}
      onclick={() => audio.toggleMute()}
      class={[
        'flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-[13.5px] font-semibold',
        audio.muted
          ? 'border-[#3a4450] bg-raised text-muted'
          : 'border-[#2c5a5e] bg-[rgba(67,198,207,0.12)] text-[#cff3f5]',
      ]}
    >
      <span
        class="size-2 rounded-full"
        style:background={audio.muted ? '#5b6470' : 'var(--color-stage-filter)'}
        aria-hidden="true"
      ></span>
      {audio.muted ? audioCopy.muted : audioCopy.on}
      <span class="sr-only">({audio.muted ? audioCopy.unmute : audioCopy.mute})</span>
    </button>
  {:else}
    <button
      type="button"
      onclick={() => audio.start()}
      disabled={audio.status === 'starting'}
      class="flex min-h-10 cursor-pointer items-center gap-2 rounded-full bg-stage-filter px-4 text-[13.5px] font-semibold text-[#071012] disabled:opacity-60"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
        ><path d="M7 4v16l13-8z" /></svg
      >
      {audio.status === 'starting' ? audioCopy.starting : audioCopy.start}
    </button>
  {/if}
  {#if audio.error}
    <p class="m-0 text-xs text-[#ff9b9e]" role="alert">{audioCopy.error} {audio.error}</p>
  {/if}
</div>
