<script lang="ts">
  import {
    buttonCopy,
    paramCopy,
    shapeNames,
    stageColors,
    statusCopy,
  } from '../../content/controls'
  import { describe } from '../../pedal/params'
  import type { PedalStore } from '../../pedal/pedal.svelte'

  let { pedal }: { pedal: PedalStore } = $props()

  const card = $derived.by(() => {
    const id = pedal.focused
    const s = pedal.state
    if (!id) {
      return {
        title: 'Try it',
        value: shapeNames[s.current.shape],
        text: statusCopy.idle,
        color: stageColors.osc,
        left: undefined,
        right: undefined,
      }
    }
    if (id === 'voice' || id === 'shape' || id === 'footswitch' || id === 'presets') {
      const b = buttonCopy[id]
      const value = {
        voice: s.current.voiceOn ? 'on' : 'off',
        shape: shapeNames[s.current.shape],
        footswitch: s.engaged ? 'synth on' : 'bypassed',
        presets: pedal.preset.info ? pedal.preset.info.code : 'live',
      }[id]
      return { title: b.label, value, text: b.oneLiner, color: stageColors[b.stage] }
    }
    const p = pedal.paramFor(id)
    const copy = paramCopy[p.id]
    return {
      title: p.label,
      value: describe(p.id, pedal.knobValue(id)),
      text: copy.oneLiner,
      color: stageColors[p.stage],
      left: copy.left,
      right: copy.right,
    }
  })
</script>

<div
  class="flex w-full flex-col gap-1.5 rounded-2xl border border-[#232a33] bg-surface px-4 py-3.5"
  data-testid="control-caption"
  aria-live="polite"
>
  <div class="flex items-center gap-2">
    <span class="size-2 shrink-0 rounded-full" style:background={card.color} aria-hidden="true"
    ></span>
    <span class="text-[15px] font-semibold tracking-wide">{card.title}</span>
    <span class="ml-auto text-right font-mono text-[12.5px] text-[#c9d1d9]">{card.value}</span>
  </div>
  <p class="m-0 text-sm leading-relaxed text-[#b7c0c9]">{card.text}</p>
  {#if card.left && card.right}
    <div class="flex justify-between gap-3 text-xs text-subtle">
      <span>← {card.left}</span><span>{card.right} →</span>
    </div>
  {/if}
</div>
