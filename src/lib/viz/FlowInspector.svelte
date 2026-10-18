<script lang="ts">
  import ParamSlider from '../components/pedal/ParamSlider.svelte'
  import { shapeNames, stageColors } from '../content/controls'
  import { flowCopy, idleCopy, routingCopy, stageCopy } from '../content/flow'
  import type { ParamId } from '../pedal/params'
  import { SHAPES } from '../pedal/presets'
  import { pedal, pedalSettings } from '../state.svelte'
  import { FLOW_STAGE, flowState, type FlowStageId } from './flow'
  import Segmented from './Segmented.svelte'
  import TapScope from './TapScope.svelte'

  interface Props {
    stage: FlowStageId
    live: boolean
    /** The parameter being pointed at in the inspector (for linked highlighting). */
    onparam?: (id: ParamId | null) => void
  }
  let { stage, live, onparam }: Props = $props()

  const uid = $props.id()
  const def = $derived(FLOW_STAGE[stage])
  const copy = $derived(stageCopy[stage])
  const flow = $derived(flowState(pedalSettings()))
  const idle = $derived(flow.stages[stage])
  const color = $derived(stageColors[def.stage])
  const token = $derived(`stage-${def.stage}`)
  const params = $derived([
    ...new Set([...def.params, ...(def.mods ?? []).flatMap((m) => m.params)]),
  ] as ParamId[])
  const shapeOptions = SHAPES.map((s) => ({ value: s, label: shapeNames[s] }))
  const routing = $derived(routingCopy[flow.outMode])
</script>

<section
  aria-labelledby="{uid}-title"
  class="flex min-w-0 flex-col gap-4 rounded-[18px] border border-line bg-surface p-[22px]"
  data-testid="flow-inspector"
  data-stage={stage}
>
  <div class="flex items-center gap-3">
    <span
      class="flex size-[38px] items-center justify-center rounded-[11px] font-mono text-[15px] font-semibold text-bg"
      style:background={color}
      aria-hidden="true">{def.letter}</span
    >
    <div class="flex flex-col gap-0.5">
      <span class="text-xs tracking-[0.08em] text-subtle">{copy.kicker}</span>
      <h2 id="{uid}-title" class="m-0 text-2xl font-[650] tracking-tight">{copy.title}</h2>
    </div>
  </div>
  <p class="m-0 text-[15px] leading-relaxed text-[#c9d1d9]">{copy.text}</p>
  {#if idle}
    <p
      class="m-0 rounded-xl border border-[#343d48] px-3 py-2 text-sm text-muted"
      data-testid="flow-idle"
    >
      {flowCopy.idle} ({idleCopy[idle]})
    </p>
  {/if}

  <div class="flex flex-col gap-1.5">
    <span class="text-xs tracking-[0.06em] text-subtle">{flowCopy.goingIn}</span>
    <div role="img" aria-label="{flowCopy.goingIn}: {copy.inLabel}">
      <TapScope tap={def.inTap} color="faint" {live} class="h-[120px] w-full" />
    </div>
  </div>
  <div class="flex flex-col gap-1.5">
    <span class="text-xs tracking-[0.06em] text-subtle">{flowCopy.comingOut}</span>
    <div role="img" aria-label="{flowCopy.comingOut}: {copy.outLabel}">
      <TapScope tap={def.outTap} color={token} {live} class="h-[120px] w-full" />
    </div>
  </div>
  {#if stage === 'out'}
    <div class="flex flex-col gap-1.5">
      <span class="text-xs tracking-[0.06em] text-subtle">{flowCopy.rightOut}</span>
      <div role="img" aria-label="{flowCopy.rightOut}: {routing.right || routing.left}">
        <TapScope tap="right" color={token} {live} class="h-[120px] w-full" />
      </div>
    </div>
    <p class="m-0 font-mono text-[12.5px] text-[#c9d1d9]" data-testid="routing">
      {routing.label} · {routing.left}{#if routing.right}<br />{routing.right}{/if}
    </p>
  {/if}

  <div class="flex flex-col gap-3 rounded-xl border border-line bg-[#0d1115] p-3.5">
    <span class="text-xs tracking-[0.06em] text-subtle">{flowCopy.controls}</span>
    {#if stage === 'input' || stage === 'mix'}
      <div class="flex items-center justify-between gap-3 text-sm">
        <span class="font-semibold">{flowCopy.bypass.label}</span>
        <button
          type="button"
          aria-pressed={flow.engaged}
          onclick={() => pedal.toggleBypass()}
          class="min-h-9 cursor-pointer rounded-[10px] border border-line px-3 text-[13px] hover:text-text"
          >{flow.engaged ? flowCopy.bypass.on : flowCopy.bypass.off}</button
        >
      </div>
    {/if}
    {#if def.buttons?.includes('shape')}
      <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span class="font-semibold">{flowCopy.shape}</span>
        <Segmented
          label={flowCopy.shape}
          options={shapeOptions}
          value={pedal.state.current.shape}
          onchange={(s) => pedal.setShape(s)}
        />
      </div>
    {/if}
    {#if def.buttons?.includes('voice')}
      <div class="flex items-center justify-between gap-3 text-sm">
        <span class="font-semibold">{flowCopy.voice}</span>
        <button
          type="button"
          aria-pressed={pedal.state.current.voiceOn}
          onclick={() => pedal.setVoice(!pedal.state.current.voiceOn)}
          class="min-h-9 cursor-pointer rounded-[10px] border border-line px-3 text-[13px] hover:text-text"
          >{flowCopy.voice}: {pedal.state.current.voiceOn
            ? flowCopy.voiceOn
            : flowCopy.voiceOff}</button
        >
      </div>
    {/if}
    {#each params as id (id)}
      <ParamSlider {pedal} param={id} onactive={(on) => onparam?.(on ? id : null)} />
    {/each}
  </div>

  <div class="flex items-start gap-2.5 rounded-xl border border-[#2b3540] p-3.5">
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-stage-osc)"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="mt-0.5 shrink-0"
      aria-hidden="true"
      ><path
        d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"
      /></svg
    >
    <div class="flex flex-col gap-0.5">
      <span class="text-[13.5px] font-semibold">{flowCopy.tryIt}</span>
      <span class="text-sm leading-normal text-[#b7c0c9]">{copy.tip}</span>
    </div>
  </div>
</section>
