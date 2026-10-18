<script lang="ts">
  import { controls, shapeNames, stageColors } from '../../content/controls'
  import { clockLabel, toDial } from '../../pedal/knob'
  import type { KnobId } from '../../pedal/layout'
  import type { PedalState } from '../../pedal/pedal.svelte'

  let { pedal }: { pedal: PedalState } = $props()

  const copy = $derived(pedal.focused ? controls[pedal.focused] : null)
  const value = $derived.by(() => {
    const id = pedal.focused
    if (!id) return shapeNames[pedal.shape].split(':')[0]
    if (id in pedal.knobs) {
      const v = pedal.knobs[id as KnobId]
      return `${clockLabel(v)} · ${toDial(v).toFixed(1)}`
    }
    if (id === 'shape') return shapeNames[pedal.shape].split(':')[0]
    if (id === 'voice') return pedal.voiceOn ? 'on' : 'off'
    if (id === 'footswitch') return pedal.engaged ? 'synth on' : 'bypassed'
    return pedal.preset === 0 ? 'live mode' : `preset ${pedal.preset}`
  })
</script>

<div
  class="flex w-full flex-col gap-1.5 rounded-2xl border border-[#232a33] bg-surface px-4 py-3.5"
  data-testid="control-caption"
  aria-live="polite"
>
  <div class="flex items-center gap-2">
    <span
      class="size-2 shrink-0 rounded-full"
      style:background={copy ? stageColors[copy.stage] : 'var(--color-stage-osc)'}
      aria-hidden="true"
    ></span>
    <span class="text-[15px] font-semibold tracking-wide">{copy ? copy.label : 'Try it'}</span>
    <span class="ml-auto text-right font-mono text-[12.5px] text-[#c9d1d9]">{value}</span>
  </div>
  <p class="m-0 text-sm leading-relaxed text-[#b7c0c9]">
    {copy
      ? copy.oneLiner
      : 'Drag a knob up or down, or use the arrow keys. Tap SHAPE, VOICE, the footswitch or PRESETS.'}
  </p>
  {#if copy?.left && copy.right}
    <div class="flex justify-between gap-3 text-xs text-subtle">
      <span>← {copy.left}</span><span>{copy.right} →</span>
    </div>
  {/if}
</div>
