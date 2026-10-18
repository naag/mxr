<script lang="ts">
  import { lfoOctaves } from '../audio/dsp/pedal-dsp'
  import { learnCopy } from '../content/learn'
  import { modDepthRate } from '../pedal/params'
  import { pedal } from '../state.svelte'
  import { scheduler } from '../viz/scheduler'

  const c = learnCopy.lfo
  const W = 400
  const H = 120
  const values = $derived(pedal.state.current.values)
  const rate = $derived(modDepthRate(values.mod).rateHz)
  const oct = $derived(lfoOctaves(values.mod, values.modBlend))
  const active = $derived(values.mod > 0.005)

  let phase = $state(0.25)
  const reduced =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

  $effect(() => {
    if (!active || reduced) return
    const r = rate
    return scheduler().add((now) => (phase = ((now / 1000) * r) % 1))
  })

  const wave = Array.from(
    { length: 101 },
    (_, i) => `${((W - 80) * i) / 100} ${H / 2 - Math.sin((2 * Math.PI * i) / 100) * 40}`,
  )
  const dot = $derived({
    x: (W - 80) * phase,
    y: H / 2 - Math.sin(2 * Math.PI * phase) * 40,
  })
  /** The cutoff marker: up to ±40 px for the widest swing (1.5 octaves). */
  const marker = $derived(H / 2 - Math.sin(2 * Math.PI * phase) * 40 * (oct / 1.5))
</script>

<section
  aria-labelledby="lfo-title"
  class="flex flex-col gap-3 rounded-2xl border border-line bg-surface px-[18px] py-4"
  data-testid="lfo-widget"
>
  <h2 id="lfo-title" class="m-0 text-[15px] font-semibold">{c.title}</h2>
  {#if active}
    <svg viewBox="0 0 {W} {H}" class="block h-auto w-full" aria-hidden="true">
      <path d="M0 {H / 2} H{W - 80}" stroke="var(--color-axis)" />
      <path d="M{wave.join(' L')}" fill="none" stroke="var(--color-stage-mod)" stroke-width="2.4" />
      <circle
        cx={dot.x}
        cy={dot.y}
        r="7"
        fill="var(--color-stage-mod)"
        stroke="var(--color-bg)"
        stroke-width="2"
      />
      <path
        d="M{dot.x} {dot.y} H{W - 40}"
        stroke="var(--color-stage-mod)"
        stroke-dasharray="3 4"
        opacity="0.6"
      />
      <rect
        x={W - 52}
        y="14"
        width="24"
        height={H - 28}
        rx="6"
        fill="#0d1115"
        stroke="var(--color-line)"
      />
      <path
        d="M{W - 58} {marker} H{W - 22}"
        stroke="var(--color-stage-filter)"
        stroke-width="4"
        stroke-linecap="round"
      />
      <text
        x={W - 40}
        y={H - 2}
        text-anchor="middle"
        font-size="11"
        fill="var(--color-subtle)"
        font-family="var(--font-mono)">{c.cutoff}</text
      >
    </svg>
    <p class="m-0 font-mono text-xs text-[#c9d1d9]" aria-live="polite">
      {oct > 0.01 ? c.readout(rate, oct) : c.chorusOnly}
    </p>
  {:else}
    <p class="m-0 text-sm text-muted">{c.off}</p>
  {/if}
</section>
