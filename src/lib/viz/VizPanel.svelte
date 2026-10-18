<script lang="ts">
  import type { Snippet } from 'svelte'
  import { vizCopy } from '../content/viz'
  import { viz } from '../state.svelte'
  import type { VizId } from './links'

  interface Props {
    id: VizId
    title: string
    sub: string
    live: boolean
    highlighted: boolean
    /** Live text readout; announced at most once per second (PLAN §6). */
    readout: string
    actions?: Snippet
    legend?: Snippet
    children: Snippet
    class?: string
  }

  let {
    id,
    title,
    sub,
    live,
    highlighted,
    readout,
    actions,
    legend,
    children,
    class: cls = '',
  }: Props = $props()

  const uid = $props.id()

  // Throttle: the first text shows at once, later ones at most once per second.
  let announced = $state('')
  let last = -Infinity
  let timer: ReturnType<typeof setTimeout> | null = null
  $effect(() => {
    const text = readout
    const now = performance.now()
    if (timer) clearTimeout(timer)
    if (now - last >= 1000) {
      announced = text
      last = now
    } else {
      timer = setTimeout(
        () => {
          announced = text
          last = performance.now()
        },
        1000 - (now - last),
      )
    }
  })
  $effect(() => () => {
    if (timer) clearTimeout(timer)
  })
</script>

<section
  aria-labelledby="{uid}-title"
  data-viz={id}
  data-highlighted={highlighted}
  data-live={live}
  onpointerenter={() => (viz.hovered = id)}
  onpointerleave={() => {
    if (viz.hovered === id) viz.hovered = null
  }}
  class={[
    'flex min-w-0 flex-col gap-2.5 rounded-2xl border bg-surface px-[18px] py-4 transition-colors duration-150',
    highlighted ? 'border-[#2f7f86]' : 'border-line',
    cls,
  ]}
>
  <div class="flex flex-wrap items-center gap-x-3.5 gap-y-2">
    <div class="flex flex-col gap-0.5">
      <h2 id="{uid}-title" class="m-0 flex items-center gap-2 text-[15px] font-semibold">
        {title}
        <span
          class={[
            'rounded-full px-2 py-0.5 font-mono text-[10.5px] font-medium tracking-wide uppercase',
            live ? 'bg-[rgba(166,217,106,0.14)] text-stage-dyn' : 'bg-raised text-muted',
          ]}
          title={live ? undefined : vizCopy.computedHint}
          >{live ? vizCopy.live : vizCopy.computed}</span
        >
        {#if highlighted}<span class="sr-only">({vizCopy.highlightedSuffix})</span>{/if}
      </h2>
      <span class="text-[12.5px] text-subtle">{sub}</span>
    </div>
    {#if actions}<div class="ml-auto flex flex-wrap items-center gap-2">
        {@render actions()}
      </div>{/if}
  </div>
  {@render children()}
  <div class="flex flex-wrap items-center gap-x-[18px] gap-y-2 text-[12.5px] text-muted">
    {@render legend?.()}
    <p
      class="m-0 ml-auto font-mono text-xs text-[#c9d1d9]"
      aria-live="polite"
      data-testid="{id}-readout"
    >
      {announced}
    </p>
  </div>
</section>
