<script lang="ts">
  import { flowCopy } from '../lib/content/flow'
  import type { ParamId } from '../lib/pedal/params'
  import { viz } from '../lib/state.svelte'
  import { FLOW_STAGE, stagesForBlocks, type FlowStageId } from '../lib/viz/flow'
  import FlowInspector from '../lib/viz/FlowInspector.svelte'
  import { PARAM_LINKS } from '../lib/viz/links'
  import { isLive } from '../lib/viz/live.svelte'
  import SignalFlow from '../lib/viz/SignalFlow.svelte'

  let { stage = null }: { stage?: FlowStageId | null } = $props()

  // A deep link (#/flow/filter) picks the stage; otherwise start at the filter, where the
  // sound gets darker.
  let picked = $state<FlowStageId | null>(null)
  const selected = $derived(picked ?? stage ?? 'filter')
  let pointing = $state<ParamId | null>(null)
  const lit = $derived(pointing ? stagesForBlocks(PARAM_LINKS[pointing].blocks) : [])
  const live = $derived(isLive())

  function select(id: FlowStageId) {
    picked = id
    // Clicking a block focuses its tap point in the scope (PLAN §3).
    const tap = FLOW_STAGE[id].scopeTap
    if (tap) viz.setTap(tap)
  }
</script>

<div class="flex flex-col gap-[22px]">
  <div class="flex max-w-[760px] flex-col gap-2">
    <span class="text-xs tracking-[0.1em] text-subtle uppercase">{flowCopy.kicker}</span>
    <h1 class="m-0 text-3xl leading-tight font-[650] tracking-tight sm:text-[34px]">
      {flowCopy.title}
    </h1>
    <p class="m-0 text-base leading-relaxed text-[#b7c0c9]">{flowCopy.lede}</p>
    {#if !live}<p class="m-0 text-[13px] text-subtle">{flowCopy.computedHint}</p>{/if}
  </div>
  <div class="flex flex-wrap items-start gap-7">
    <div class="min-w-0 flex-[1_1_640px] lg:max-w-[860px]">
      <SignalFlow {selected} onselect={select} {lit} {live} />
    </div>
    <div class="min-w-0 flex-[1_1_380px] lg:sticky lg:top-4">
      <FlowInspector stage={selected} {live} onparam={(id) => (pointing = id)} />
    </div>
  </div>
</div>
