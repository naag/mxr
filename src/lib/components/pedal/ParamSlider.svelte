<script lang="ts">
  import { paramCopy, stageColors } from '../../content/controls'
  import { describe, PARAM, stepIndex, type ParamId } from '../../pedal/params'
  import type { PedalStore } from '../../pedal/pedal.svelte'

  /** A plain slider for one parameter, whatever layer it lives on (flow inspector). */
  let {
    pedal,
    param,
    onactive,
  }: { pedal: PedalStore; param: ParamId; onactive?: (on: boolean) => void } = $props()

  const uid = $props.id()
  const p = $derived(PARAM[param])
  const value = $derived(pedal.valueOf(param))
  const text = $derived(describe(param, value))
  const step = $derived(p.steps ? 1 / (p.steps.length - 1) : 0.005)
</script>

<div
  class="flex flex-col gap-1"
  role="presentation"
  onpointerenter={() => onactive?.(true)}
  onpointerleave={() => onactive?.(false)}
>
  <div class="flex items-baseline justify-between gap-3 text-sm">
    <label for="{uid}-input" class="font-semibold">{p.label}</label>
    <span class="text-right font-mono text-[12.5px] text-[#c9d1d9]">{text}</span>
  </div>
  <input
    id="{uid}-input"
    type="range"
    min="0"
    max="1"
    {step}
    value={p.steps ? stepIndex(p, value) * step : value}
    aria-valuetext={text}
    aria-describedby="{uid}-hint"
    oninput={(e) => pedal.set(param, Number(e.currentTarget.value))}
    onfocus={() => onactive?.(true)}
    onblur={() => onactive?.(false)}
    class="slider w-full cursor-pointer"
    style:--accent={stageColors[p.stage]}
  />
  <span id="{uid}-hint" class="text-xs text-subtle">{paramCopy[param].oneLiner}</span>
</div>

<style>
  .slider {
    accent-color: var(--accent);
    min-height: 28px;
  }
</style>
