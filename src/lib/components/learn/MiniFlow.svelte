<script lang="ts">
  import { learnCopy } from '../../content/learn'
  import { pedal } from '../../state.svelte'

  /** Chapter 0: the whole pedal in three blocks. */
  const c = learnCopy.miniFlow
  const on = $derived(pedal.state.engaged)
  const blocks = $derived([
    { title: c.bass, sub: c.bassSub, color: 'var(--color-stage-input)', active: true },
    { title: c.detective, sub: c.detectiveSub, color: 'var(--color-stage-input)', active: on },
    { title: c.synth, sub: c.synthSub, color: 'var(--color-stage-osc)', active: on },
  ])
</script>

<section
  aria-label={c.label}
  class="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-[18px]"
  data-testid="mini-flow"
  data-engaged={on}
>
  <h2 class="m-0 text-[15px] font-semibold">{c.label}</h2>
  <ol class="m-0 flex list-none flex-wrap items-center gap-2 p-0">
    {#each blocks as b, i (b.title)}
      <li class="flex items-center gap-2">
        <div
          class={[
            'flex min-w-[150px] flex-col gap-0.5 rounded-xl border px-3.5 py-2.5 transition-opacity',
            b.active ? 'border-[#2b3540] bg-raised' : 'border-line opacity-45',
          ]}
        >
          <span class="flex items-center gap-2 text-[14.5px] font-semibold"
            ><span class="size-2 rounded-full" style:background={b.color} aria-hidden="true"
            ></span>{b.title}</span
          >
          <span class="text-[12.5px] text-muted">{b.sub}</span>
        </div>
        {#if i < blocks.length - 1}
          <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true"
            ><path
              d="M1 7 H18 M14 2 L19 7 L14 12"
              fill="none"
              stroke="#4a5562"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            /></svg
          >
        {/if}
      </li>
    {/each}
  </ol>
  <p class="m-0 font-mono text-[12.5px] text-[#c9d1d9]">{on ? c.on : c.off}</p>
</section>
