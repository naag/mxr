<script lang="ts">
  import { statusCopy } from '../../content/controls'
  import type { PedalStore } from '../../pedal/pedal.svelte'
  import { shareUrl } from '../../pedal/share'

  let { pedal }: { pedal: PedalStore } = $props()

  let copied = $state(false)
  let fallback = $state<string | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined

  async function share() {
    const link = shareUrl(pedal.state.current, location)
    try {
      await navigator.clipboard.writeText(link)
      fallback = null
      copied = true
      clearTimeout(timer)
      timer = setTimeout(() => (copied = false), 2000)
    } catch {
      // Clipboard can be blocked; show the link so it can be copied by hand.
      fallback = link
    }
  }
</script>

<div class="flex w-full flex-col gap-2">
  <button
    type="button"
    onclick={share}
    class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 self-start rounded-[10px] border border-[#2a313a] bg-raised px-3.5 text-[13.5px] font-medium text-text hover:border-[#3a4450]"
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      ><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path
        d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"
      /></svg
    >
    {copied ? statusCopy.shareCopied : statusCopy.shareLabel}
  </button>
  {#if fallback}
    <label class="flex flex-col gap-1 text-xs text-muted">
      Copy this link:
      <input
        readonly
        value={fallback}
        class="rounded-lg border border-line bg-raised px-2 py-1.5 font-mono text-xs text-text"
        onfocus={(e) => e.currentTarget.select()}
      />
    </label>
  {/if}
</div>
