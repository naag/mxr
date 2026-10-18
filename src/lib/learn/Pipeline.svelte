<script lang="ts">
  import { learnCopy } from '../content/learn'
  import { pedal } from '../state.svelte'

  const c = learnCopy.pipeline
  const on = $derived(pedal.state.engaged)
  const blocks = $derived([
    { label: c.bass, color: 'var(--color-stage-input)', active: true },
    { label: c.detective, color: 'var(--color-stage-input)', active: on },
    { label: c.synth, color: 'var(--color-stage-osc)', active: on },
  ])
</script>

<section
  aria-label={c.label}
  class="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-[18px]"
  data-testid="pipeline"
  data-engaged={on}
>
  <ol class="m-0 flex list-none flex-wrap items-center gap-2 p-0">
    {#each blocks as b, i (b.label)}
      <li class="flex items-center gap-2">
        <span
          class={[
            'inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-[15px] font-semibold transition-opacity duration-200',
            b.active ? 'border-[#2f3a46]' : 'border-dashed border-[#2a313a] font-normal text-muted',
          ]}
          ><span
            class="size-2.5 rounded-full"
            style:background={b.active ? b.color : 'var(--color-marker)'}
          ></span>{b.label}</span
        >
        {#if i < blocks.length - 1}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={blocks[i + 1].active ? '#8c99a8' : '#3a4450'}
            stroke-width="2.4"
            stroke-linecap="round"
            aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg
          >
        {/if}
      </li>
    {/each}
  </ol>
  <p class="m-0 text-sm text-[#c9d1d9]" aria-live="polite">{on ? c.engaged : c.bypassed}</p>
</section>
