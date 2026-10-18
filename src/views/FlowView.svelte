<script lang="ts">
  import { stageColors } from '../lib/content/controls'
  import { flowCopy, stageCopy } from '../lib/content/flow'
  import { views } from '../lib/content/site'
  import Routing from '../lib/flow/Routing.svelte'
  import StageRow from '../lib/flow/StageRow.svelte'
  import { flowState, MOD_PARAMS, STAGE, STAGES, type StageId } from '../lib/flow/stages'
  import { valueOf } from '../lib/pedal/machine'
  import { describe, PARAM } from '../lib/pedal/params'
  import { pedal, pedalSettings } from '../lib/state.svelte'
  import MiniScope from '../lib/viz/MiniScope.svelte'

  let selected = $state<StageId>('filter')

  const flow = $derived(flowState(pedalSettings()))
  const sel = $derived(STAGE[selected])
  const copy = $derived(stageCopy[selected])
  const color = $derived(stageColors[sel.color])
  const controls = $derived(
    [...sel.params, ...sel.mods.flatMap((m) => MOD_PARAMS[m])]
      .filter((id, i, all) => all.indexOf(id) === i)
      .map((id) => ({
        id,
        label: PARAM[id].label,
        value: describe(id, valueOf(pedal.state, PARAM[id])),
      })),
  )
  const mixIndex = STAGES.findIndex((s) => s.id === 'mix')
  /** Signal moves between two stages unless the synth path is bypassed there. */
  const flowing = (i: number) =>
    flow.stages[STAGES[i].id] !== 'bypassed' && flow.stages[STAGES[i + 1].id] !== 'bypassed'
</script>

<div class="flex flex-col gap-6">
  <div class="flex max-w-3xl flex-col gap-2">
    <span class="text-xs tracking-[0.1em] text-subtle uppercase">{views.flow.kicker}</span>
    <h1 class="m-0 text-3xl leading-tight font-[650] tracking-tight">{views.flow.title}</h1>
    <p class="m-0 text-base leading-relaxed text-[#b7c0c9]">{views.flow.lede}</p>
  </div>

  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
    <div class="flex flex-col gap-3">
      <ol aria-label={flowCopy.stagesLabel} class="m-0 flex list-none flex-col p-0">
        {#each STAGES as stage, i (stage.id)}
          <li class="relative pl-7" data-flow-row={stage.id}>
            <!-- Dry lane: the clean bass runs from IN down to MIX. -->
            {#if i <= mixIndex}
              <span
                class="dry-lane absolute left-2 w-[3px] rounded-full"
                class:flowing={flow.stages.input === 'on'}
                style:top={i === 0 ? '28px' : '0'}
                style:bottom={i === mixIndex ? 'calc(100% - 28px)' : '0'}
                aria-hidden="true"
              ></span>
            {/if}
            {#if i === 0 || i === mixIndex || (stage.id === 'filter' && flow.dryThru)}
              <span
                class={[
                  'absolute top-[27px] left-2 h-[3px] w-5 rounded-full',
                  stage.id === 'filter' ? 'bg-stage-filter' : 'bg-stage-input',
                ]}
                data-dry-into={stage.id}
                aria-hidden="true"
              ></span>
            {/if}
            <StageRow
              {stage}
              {flow}
              selected={selected === stage.id}
              onselect={() => (selected = stage.id)}
            />
            {#if i < STAGES.length - 1}
              <div class="flex h-6 items-center pl-6" aria-hidden="true">
                <span class="connector h-full w-[3px] rounded-full" class:flowing={flowing(i)}
                ></span>
              </div>
            {/if}
          </li>
        {/each}
      </ol>
      <p class="m-0 flex items-center gap-2 text-[12.5px] text-muted">
        <span class="inline-block h-[3px] w-5 rounded-full bg-stage-input" aria-hidden="true"
        ></span>
        {flowCopy.dryLane}
      </p>
      {#if flow.dryThru}
        <p class="m-0 flex items-center gap-2 text-[12.5px] text-[#7fd8df]" data-testid="dry-thru">
          <span class="inline-block h-[3px] w-5 rounded-full bg-stage-filter" aria-hidden="true"
          ></span>
          {flowCopy.dryThru}
        </p>
      {/if}
    </div>

    <section
      aria-labelledby="inspector-title"
      aria-live="polite"
      class="flex h-fit flex-col gap-4 rounded-2xl border bg-surface p-[18px] lg:sticky lg:top-4"
      style:border-color={color}
      data-testid="inspector"
    >
      <div class="flex items-center gap-3">
        <span
          class="flex h-9 min-w-9 items-center justify-center rounded-full px-2 font-mono text-sm font-semibold text-[#0d1014]"
          style:background={color}
          aria-hidden="true">{sel.letter}</span
        >
        <div class="flex flex-col">
          <span class="text-[11.5px] tracking-[0.08em] text-subtle uppercase">{copy.kicker}</span>
          <h2 id="inspector-title" class="m-0 text-xl font-[650]">{copy.title}</h2>
        </div>
      </div>
      <p class="m-0 text-[14.5px] leading-relaxed text-[#c9d1d9]">{copy.text}</p>
      {#each [{ label: flowCopy.goingIn, source: sel.waveIn, text: copy.inLabel, c: 'faint' }, { label: flowCopy.comingOut, source: sel.waveOut, text: copy.outLabel, c: `stage-${sel.color}` }] as w (w.label)}
        <figure class="m-0 flex flex-col gap-1.5">
          <figcaption class="flex justify-between gap-3 text-[11.5px] text-subtle">
            <span class="tracking-[0.06em] uppercase">{w.label}</span><span>{w.text}</span>
          </figcaption>
          <div
            class="rounded-[10px] border border-line bg-[#0d1115] p-2"
            role="img"
            aria-label={flowCopy.waveLabel(w.label, w.text)}
          >
            <MiniScope source={w.source} view={sel.view} color={w.c} class="h-24" />
          </div>
        </figure>
      {/each}
      {#if controls.length}
        <div class="flex flex-col gap-1.5">
          <span class="text-[11.5px] tracking-[0.06em] text-subtle uppercase"
            >{flowCopy.controls}</span
          >
          <dl class="m-0 flex flex-col gap-1">
            {#each controls as c (c.id)}
              <div class="flex justify-between gap-3 text-[13.5px]">
                <dt class="text-muted">{c.label}</dt>
                <dd class="m-0 text-right font-mono text-[12.5px]">{c.value}</dd>
              </div>
            {/each}
          </dl>
        </div>
      {/if}
      {#if selected === 'out' || selected === 'mix'}
        <Routing mode={flow.outputMode} />
      {/if}
      <div
        class="flex gap-2.5 rounded-[10px] border border-[#3a3222] bg-[rgba(242,169,59,0.06)] p-3"
      >
        <span class="text-[13px] font-semibold text-[#f7c77a]">{flowCopy.tryIt}</span>
        <span class="text-[13px] text-[#d8dee4]">{copy.tip}</span>
      </div>
    </section>
  </div>
</div>

<style>
  .dry-lane,
  .connector {
    background: #3a4450;
  }
  .dry-lane.flowing {
    background: repeating-linear-gradient(
      to bottom,
      var(--color-stage-input) 0 6px,
      transparent 6px 14px
    );
    background-size: 100% 14px;
    animation: particles 0.9s linear infinite;
  }
  .connector.flowing {
    background: repeating-linear-gradient(
      to bottom,
      var(--color-stage-filter) 0 5px,
      transparent 5px 11px
    );
    background-size: 100% 11px;
    animation: particles 0.7s linear infinite;
  }
  @keyframes particles {
    to {
      background-position: 0 14px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dry-lane.flowing,
    .connector.flowing {
      animation: none;
    }
  }
</style>
