<script lang="ts">
  import { learnCopy } from '../content/learn'
  import Segmented from '../viz/Segmented.svelte'
  import { harmonicAmp, harmonicsUsed, idealWave, partialSum, type AdditiveShape } from './additive'

  const c = learnCopy.additive
  const MAX = 24
  const W = 560
  const H = 150
  const POINTS = 241

  let shape = $state<AdditiveShape>('saw')
  let n = $state(1)
  let timer: ReturnType<typeof setInterval> | null = null
  let playing = $state(false)

  const y = (v: number) => H / 2 - v * (H / 2 - 12)
  const path = (vals: ArrayLike<number>) =>
    'M' +
    Array.from(
      vals,
      (v, i) => `${((W * i) / (vals.length - 1)).toFixed(1)} ${y(v).toFixed(1)}`,
    ).join(' L')

  const sum = $derived(path(partialSum(shape, n, POINTS)))
  const target = $derived(
    path(Array.from({ length: POINTS }, (_, i) => idealWave(shape, i / (POINTS - 1)))),
  )
  /** The harmonic added last (the newest one the shape uses). */
  const newest = $derived.by(() => {
    let h = n
    while (h > 1 && harmonicAmp(shape, h) === 0) h--
    const a = harmonicAmp(shape, h)
    return {
      h,
      d: path(
        Array.from(
          { length: POINTS },
          (_, i) => a * Math.sin((2 * Math.PI * h * i) / (POINTS - 1)),
        ),
      ),
    }
  })
  const bars = $derived(
    Array.from({ length: MAX }, (_, i) => ({
      h: i + 1,
      a: Math.abs(harmonicAmp(shape, i + 1)) / Math.abs(harmonicAmp(shape, 1)),
      on: i + 1 <= n,
    })),
  )

  function stop() {
    if (timer) clearInterval(timer)
    timer = null
    playing = false
  }
  function play() {
    stop()
    n = 1
    playing = true
    timer = setInterval(() => {
      if (n >= 16) stop()
      else n++
    }, 450)
  }
  $effect(() => stop)

  const shapes = (['saw', 'square', 'triangle'] as const).map((s) => ({
    value: s,
    label: c.shapes[s],
  }))
</script>

<section
  aria-labelledby="additive-title"
  class="flex flex-col gap-3 rounded-2xl border border-line bg-surface px-[18px] py-4"
  data-testid="additive"
>
  <div class="flex flex-wrap items-center gap-3">
    <h2 id="additive-title" class="m-0 text-[15px] font-semibold">{c.title}</h2>
    <div class="ml-auto">
      <Segmented
        label={c.shape}
        options={shapes}
        value={shape}
        onchange={(s) => {
          stop()
          shape = s
        }}
      />
    </div>
  </div>
  <svg
    viewBox="0 0 {W} {H}"
    class="block h-auto w-full"
    role="img"
    aria-label={c.readout(c.shapes[shape], n, harmonicsUsed(shape, n))}
  >
    <path d="M0 {H / 2} H{W}" stroke="var(--color-axis)" stroke-width="1" />
    <path
      d={target}
      fill="none"
      stroke="var(--color-faint)"
      stroke-width="1.4"
      stroke-dasharray="4 4"
    />
    {#if n > 1}
      <path
        d={newest.d}
        fill="none"
        stroke="var(--color-stage-osc)"
        stroke-width="1.2"
        opacity="0.6"
      />
    {/if}
    <path
      d={sum}
      fill="none"
      stroke="var(--color-stage-filter)"
      stroke-width="2.6"
      stroke-linejoin="round"
    />
  </svg>
  <svg viewBox="0 0 {W} 48" class="block h-auto w-full" aria-hidden="true">
    {#each bars as b (b.h)}
      <rect
        x={(b.h - 1) * (W / MAX) + 4}
        y={44 - 40 * b.a}
        width={W / MAX - 8}
        height={40 * b.a}
        rx="2"
        fill="var(--color-stage-osc)"
        opacity={b.on ? 0.9 : 0.18}
      />
    {/each}
  </svg>
  <div class="flex flex-wrap items-center gap-3 text-[13px]">
    <span class="text-muted">{c.harmonics}</span>
    <button
      type="button"
      aria-label={c.fewer}
      disabled={n <= 1}
      onclick={() => (stop(), (n = Math.max(1, n - 1)))}
      class="size-8 cursor-pointer rounded-lg border border-[#2a313a] bg-raised text-base disabled:opacity-40"
      >−</button
    >
    <span class="min-w-8 text-center font-mono" data-testid="additive-count">{n}</span>
    <button
      type="button"
      aria-label={c.more}
      disabled={n >= MAX}
      onclick={() => (stop(), (n = Math.min(MAX, n + 1)))}
      class="size-8 cursor-pointer rounded-lg border border-[#2a313a] bg-raised text-base disabled:opacity-40"
      >+</button
    >
    <button
      type="button"
      onclick={() => (playing ? stop() : play())}
      class="min-h-8 cursor-pointer rounded-lg border border-[#2c5a5e] bg-[rgba(67,198,207,0.1)] px-3 font-semibold text-[#cff3f5]"
      >{playing ? c.stop : c.play}</button
    >
    <p class="m-0 ml-auto font-mono text-xs text-[#c9d1d9]" aria-live="polite">
      {c.readout(c.shapes[shape], n, harmonicsUsed(shape, n))}
    </p>
  </div>
  <div class="flex flex-wrap gap-x-[18px] gap-y-1 text-[12.5px] text-muted" aria-hidden="true">
    <span class="inline-flex items-center gap-2"
      ><svg width="22" height="8"
        ><path d="M1 4 H21" stroke="var(--color-stage-filter)" stroke-width="3" /></svg
      >{c.sum}</span
    >
    <span class="inline-flex items-center gap-2"
      ><svg width="22" height="8"
        ><path
          d="M1 4 H21"
          stroke="var(--color-faint)"
          stroke-width="1.6"
          stroke-dasharray="4 3"
        /></svg
      >{c.target}</span
    >
    <span class="inline-flex items-center gap-2"
      ><svg width="22" height="8"
        ><path d="M1 4 H21" stroke="var(--color-stage-osc)" stroke-width="1.4" /></svg
      >{c.newest}</span
    >
  </div>
</section>
