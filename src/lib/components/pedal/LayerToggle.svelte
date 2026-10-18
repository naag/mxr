<script lang="ts">
  import { layerCopy } from '../../content/controls'
  import type { Layer } from '../../pedal/params'
  import type { PedalStore } from '../../pedal/pedal.svelte'

  let { pedal }: { pedal: PedalStore } = $props()

  const layers: Layer[] = ['main', 'voice', 'shape']
  const selected: Record<Layer, string> = {
    main: 'bg-[#2a313a] text-text',
    voice: 'bg-[rgba(94,200,255,0.16)] text-layer-voice',
    shape: 'bg-[rgba(99,219,120,0.15)] text-layer-shape',
  }
</script>

<div
  role="group"
  aria-label="Knob layer"
  class="flex w-full gap-1 rounded-xl border border-[#232a33] bg-surface p-1"
>
  {#each layers as layer (layer)}
    <button
      type="button"
      aria-pressed={pedal.layer === layer}
      onclick={() => pedal.setLayer(layer)}
      class={[
        'flex min-h-11 flex-1 cursor-pointer flex-col items-center justify-center gap-px rounded-[9px] px-1.5 py-1 transition-colors',
        pedal.layer === layer ? selected[layer] : 'text-muted hover:text-text',
      ]}
    >
      <span class="text-[13.5px] font-semibold">{layerCopy[layer].label}</span>
      <span class="text-[11px] opacity-80">{layerCopy[layer].sub}</span>
    </button>
  {/each}
</div>
