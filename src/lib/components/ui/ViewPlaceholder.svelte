<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    kicker,
    title,
    lede,
    phase,
    children,
  }: { kicker: string; title: string; lede: string; phase: string; children?: Snippet } = $props()
</script>

<section class="flex max-w-3xl flex-col gap-3">
  <span class="text-xs tracking-[0.1em] text-subtle uppercase">{kicker}</span>
  <h1 class="m-0 text-3xl leading-tight font-[650] tracking-tight sm:text-4xl">{title}</h1>
  <p class="m-0 text-base leading-relaxed text-[#b7c0c9] sm:text-lg">{lede}</p>
  {@render children?.()}
  <p
    class="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-xs text-muted"
  >
    <span class="size-2 rounded-full bg-stage-osc" aria-hidden="true"></span>{phase}
  </p>
</section>
