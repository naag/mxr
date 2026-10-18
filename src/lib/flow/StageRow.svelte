<script lang="ts">
  import { stageColors } from '../content/controls'
  import { flowCopy, modCopy, stageCopy } from '../content/flow'
  import { valueOf } from '../pedal/machine'
  import { formatValue, PARAM } from '../pedal/params'
  import { pedal } from '../state.svelte'
  import MiniScope from '../viz/MiniScope.svelte'
  import { MOD_COLOR, type FlowState, type StageDef } from './stages'

  interface Props {
    stage: StageDef
    flow: FlowState
    selected: boolean
    onselect: () => void
  }
  let { stage, flow, selected, onselect }: Props = $props()

  const copy = $derived(stageCopy[stage.id])
  const status = $derived(flow.stages[stage.id])
  const tag = $derived(
    status === 'bypassed'
      ? flowCopy.bypassed
      : status === 'off'
        ? (flowCopy.offTag[stage.id] ?? flowCopy.off)
        : null,
  )
  const knobs = $derived(
    stage.params
      .map((id) => `${PARAM[id].label} ${formatValue(id, valueOf(pedal.state, PARAM[id]))}`)
      .join(' · '),
  )
  const color = $derived(stageColors[stage.color])
</script>

<div class="flex flex-col gap-2 sm:flex-row sm:items-stretch">
  <button
    type="button"
    aria-pressed={selected}
    onclick={onselect}
    data-stage={stage.id}
    data-status={status}
    class={[
      'flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-[14px] border px-3.5 py-3 text-left transition-[opacity,border-color,background-color] duration-150',
      selected ? 'bg-[#161d25]' : 'border-[#222a33] bg-surface hover:border-[#2f3a46]',
      status !== 'on' && !selected ? 'opacity-55' : '',
    ]}
    style:border-color={selected ? color : undefined}
  >
    <span
      class="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full px-1.5 font-mono text-[12.5px] font-semibold text-[#0d1014]"
      style:background={status === 'on' ? color : '#4a5562'}
      aria-hidden="true">{stage.letter}</span
    >
    <span class="flex min-w-0 flex-1 flex-col gap-0.5">
      <span class="flex flex-wrap items-center gap-2">
        <span class="text-[14.5px] font-semibold">{copy.title}</span>
        {#if tag}<span
            class="rounded-full border border-[#2a313a] px-2 py-px font-mono text-[11px] text-muted"
            >{tag}</span
          >{/if}
      </span>
      <span class="text-[13px] text-[#b7c0c9]">{copy.desc}</span>
      {#if knobs}<span class="truncate font-mono text-[11.5px] text-subtle">{knobs}</span>{/if}
    </span>
    <MiniScope
      source={stage.waveOut}
      view={stage.view}
      color={`stage-${stage.color}`}
      dim={status !== 'on'}
      class="hidden h-14 w-[180px] shrink-0 sm:block"
    />
  </button>
  {#if stage.mods.length}
    <ul class="m-0 flex list-none flex-col justify-center gap-1.5 p-0 sm:w-[220px]">
      {#each stage.mods as m (m)}
        {@const on = flow.mods[m]}
        <li
          class={[
            'flex items-center gap-2 rounded-[10px] border border-dashed px-2.5 py-1.5 text-[12.5px]',
            on ? 'border-[#3a4450]' : 'border-[#232a33] opacity-55',
          ]}
          data-mod={m}
          data-active={on}
        >
          <svg width="18" height="12" viewBox="0 0 22 14" aria-hidden="true"
            ><path
              d="M21 7 H4 M8 2 L3 7 L8 12"
              fill="none"
              stroke={stageColors[MOD_COLOR[m]]}
              stroke-width="2"
              stroke-linecap="round"
            /></svg
          >
          <span class="flex flex-col">
            <span class="font-semibold">{modCopy[m].title}</span>
            <span class="text-muted">{on ? modCopy[m].desc : flowCopy.modOff}</span>
          </span>
        </li>
      {/each}
    </ul>
  {/if}
</div>
