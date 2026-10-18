<script lang="ts">
  import { stageColors } from '../content/controls'
  import { flowCopy, idleCopy, knobLine, modCopy, sourceCopy, stageCopy } from '../content/flow'
  import { pedal, pedalSettings } from '../state.svelte'
  import { FLOW_STAGES, flowState, type FlowStageId } from './flow'
  import TapScope from './TapScope.svelte'

  interface Props {
    selected?: FlowStageId | null
    onselect?: (id: FlowStageId) => void
    /** Stages lit by linked highlighting. */
    lit?: readonly FlowStageId[]
    live: boolean
    /** Smaller version without side inputs (Learn chapter 12). */
    compact?: boolean
  }

  let { selected = null, onselect, lit = [], live, compact = false }: Props = $props()

  const uid = $props.id()
  const flow = $derived(flowState(pedalSettings()))
  const tokenOf = {
    osc: 'stage-osc',
    filter: 'stage-filter',
    env: 'stage-env',
    mod: 'stage-mod',
    dyn: 'stage-dyn',
    input: 'stage-input',
  } as const
  const DRY_FROM = 0
  const DRY_TO = FLOW_STAGES.findIndex((s) => s.id === 'mix')
  const FILTER = FLOW_STAGES.findIndex((s) => s.id === 'filter')

  const rows = $derived(
    FLOW_STAGES.map((s, i) => {
      const idle = flow.stages[s.id]
      return {
        ...s,
        i,
        copy: stageCopy[s.id],
        idle,
        color: stageColors[s.stage],
        knobs: knobLine(s.params, (p) => pedal.valueOf(p)),
        mods: (s.mods ?? []).map((m) => ({
          ...m,
          idle: flow.mods[m.id],
          color: stageColors[m.stage],
          knobs: knobLine(m.params, (p) => pedal.valueOf(p)),
        })),
      }
    }),
  )
  /** Signal moves along the main path while the synth is on. */
  const flowing = $derived(flow.engaged)
  const dryFlowing = $derived(flow.dry !== 'muted')
</script>

<div class="flex min-w-0 flex-col" data-testid="signal-flow" data-engaged={flow.engaged}>
  <ol aria-label={flowCopy.diagramLabel} class="m-0 flex list-none flex-col p-0">
    {#each rows as r (r.id)}
      {@const isSel = selected === r.id}
      {@const onLane = r.i >= DRY_FROM && r.i <= DRY_TO}
      <li class="flex flex-col">
        <div class="flex items-stretch gap-3">
          <!-- Dry lane: the clean copy of your bass, from the input to MIX -->
          <div class={['relative shrink-0', compact ? 'w-7' : 'w-11']} aria-hidden="true">
            {#if onLane}
              <div
                class={[
                  'lane absolute w-0.5',
                  compact ? 'left-[13px]' : 'left-[21px]',
                  dryFlowing && 'flowing',
                ]}
                style:top={r.i === DRY_FROM ? '50%' : '0'}
                style:bottom={r.i === DRY_TO ? '50%' : '0'}
              ></div>
            {/if}
            {#if r.i === DRY_FROM || r.i === DRY_TO || (r.i === FILTER && flow.dryThru)}
              <div
                class={[
                  'absolute top-1/2 -right-3 h-0.5',
                  compact ? 'left-[13px]' : 'left-[21px]',
                  r.i === FILTER ? 'bg-stage-input' : 'bg-[#4a5562]',
                ]}
                data-testid={r.i === FILTER ? 'dry-thru-path' : undefined}
              ></div>
            {/if}
          </div>
          <button
            type="button"
            aria-pressed={isSel}
            data-stage={r.id}
            data-active={!r.idle}
            data-highlighted={lit.includes(r.id)}
            onclick={() => onselect?.(r.id)}
            class={[
              'flex min-w-0 flex-1 cursor-pointer items-center gap-3.5 rounded-[14px] border text-left transition-[opacity,border-color,background-color] duration-150',
              compact ? 'px-3 py-2' : 'px-3.5 py-3',
              isSel ? 'bg-[#161d25]' : 'bg-surface hover:bg-[#141a21]',
              r.idle && !isSel ? 'border-dashed' : '',
              lit.includes(r.id) && !isSel ? 'border-[#2f7f86]' : !isSel ? 'border-[#222a33]' : '',
            ]}
            style:border-color={isSel ? r.color : undefined}
            style:box-shadow={isSel ? '0 0 0 3px rgba(67, 198, 207, 0.14)' : undefined}
          >
            <span
              class="flex size-8 shrink-0 items-center justify-center rounded-[9px] font-mono text-[13px] font-semibold text-bg"
              style:background={r.color}
              aria-hidden="true">{r.letter}</span
            >
            <span class="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span class="flex flex-wrap items-center gap-2">
                <span class="text-[15.5px] font-semibold">{r.copy.title}</span>
                {#if r.idle}
                  <span
                    class="rounded-full border border-[#343d48] px-2 py-0.5 text-[11.5px] text-muted"
                    >{idleCopy[r.idle]}</span
                  >
                {/if}
              </span>
              <span id="{uid}-{r.id}-desc" class="text-[13.5px] text-[#b7c0c9]"
                >{r.copy.desc}{#if r.id === 'osc' && flow.engaged}<span class="text-muted">
                    · {flowCopy.sources}: {flow.sources.map((s) => sourceCopy[s]).join(', ')}</span
                  >{/if}</span
              >
              {#if !compact && r.knobs}
                <span class="font-mono text-[11.5px] text-subtle">{r.knobs}</span>
              {/if}
            </span>
            <TapScope
              tap={r.outTap}
              color={tokenOf[r.stage]}
              {live}
              faded={!!r.idle}
              class={compact ? 'h-9 w-[110px] shrink-0' : 'h-12 w-[150px] shrink-0 max-sm:w-[96px]'}
            />
          </button>
          {#if !compact}
            <div class="flex w-[210px] shrink-0 flex-col justify-center gap-2 py-1.5 max-lg:hidden">
              {#each r.mods as m (m.id)}
                <div class="flex items-center gap-2" data-mod={m.id} data-active={!m.idle}>
                  <svg
                    width="22"
                    height="14"
                    viewBox="0 0 22 14"
                    aria-hidden="true"
                    opacity={m.idle ? 0.4 : 1}
                    ><path
                      d="M21 7 H4 M8 2 L3 7 L8 12"
                      fill="none"
                      stroke={m.color}
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    /></svg
                  >
                  <div
                    class="min-w-0 flex-1 rounded-[10px] border border-dashed border-[#343d48] bg-[#0f1318] px-2.5 py-2"
                  >
                    <div class="flex items-center gap-1.5">
                      <span
                        class={['size-[7px] rounded-full', m.idle && 'opacity-40']}
                        style:background={m.color}
                      ></span>
                      <span class="text-[13px] font-semibold">{modCopy[m.id].title}</span>
                    </div>
                    <div class="mt-0.5 text-xs text-muted">
                      {m.idle ? idleCopy[m.idle] : modCopy[m.id].desc}
                    </div>
                    <div class="mt-0.5 font-mono text-[11px] text-subtle">{m.knobs}</div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
        {#if r.i < rows.length - 1}
          <div class={['flex gap-3', compact ? 'h-4' : 'h-[22px]']} aria-hidden="true">
            <div class={['relative shrink-0', compact ? 'w-7' : 'w-11']}>
              {#if r.i < DRY_TO}
                <div
                  class={[
                    'lane absolute top-0 bottom-0 w-0.5',
                    compact ? 'left-[13px]' : 'left-[21px]',
                    dryFlowing && 'flowing',
                  ]}
                ></div>
              {/if}
            </div>
            <div class="relative flex flex-1 items-center justify-center">
              <svg width="14" height="22" viewBox="0 0 14 22" class="h-full"
                ><path
                  d="M7 0 V18 M2 13 L7 19 L12 13"
                  fill="none"
                  stroke="#4a5562"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /></svg
              >
              {#if flowing}
                <span class="particle" style:background={rows[r.i + 1].color} data-testid="particle"
                ></span>
              {/if}
            </div>
            {#if !compact}<div class="w-[210px] shrink-0 max-lg:hidden"></div>{/if}
          </div>
        {/if}
      </li>
    {/each}
  </ol>
  <div
    class="mt-2.5 flex flex-col gap-1.5 text-[12.5px] text-subtle"
    class:pl-14={!compact}
    class:pl-10={compact}
  >
    <span class="flex items-center gap-2"
      ><span class="h-0.5 w-[18px] bg-[#4a5562]" aria-hidden="true"></span>{flowCopy.dryLane}</span
    >
    <span data-testid="dry-state">{flowCopy.dryState[flow.dry]}</span>
    {#if flow.dryThru}<span class="text-stage-input">{flowCopy.dryThru}</span>{/if}
  </div>
</div>

<style>
  .lane {
    background: #4a5562;
  }
  .lane.flowing {
    background-image: repeating-linear-gradient(
      to bottom,
      var(--color-stage-input) 0 5px,
      transparent 5px 14px
    );
    background-color: #2c343e;
    background-size: 2px 14px;
    animation: lane 0.9s linear infinite;
  }
  @keyframes lane {
    to {
      background-position-y: 14px;
    }
  }
  .particle {
    position: absolute;
    left: 50%;
    top: 0;
    width: 6px;
    height: 6px;
    margin-left: -3px;
    border-radius: 50%;
    box-shadow: 0 0 6px currentColor;
    animation: drop 0.9s linear infinite;
  }
  @keyframes drop {
    from {
      transform: translateY(0);
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    to {
      transform: translateY(16px);
      opacity: 0;
    }
  }
  /* PLAN §4.5: no particles with reduced motion. */
  @media (prefers-reduced-motion: reduce) {
    .particle {
      display: none;
    }
    .lane.flowing {
      animation: none;
    }
  }
</style>
