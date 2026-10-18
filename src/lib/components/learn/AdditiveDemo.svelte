<script lang="ts">
  import { learnCopy } from '../../content/learn'
  import {
    harmonicAmplitude,
    idealWave,
    partialSum,
    type AdditiveTarget,
  } from '../../learn/additive'
  import Segmented from '../../viz/Segmented.svelte'

  /** Chapter 2: stack sine harmonics until they become a sawtooth or a square. */
  const c = learnCopy.additive
  const W = 800
  const H = 200
  const MAX = 20
  let count = $state(1)
  let target = $state<AdditiveTarget>('saw')
  let timer: ReturnType<typeof setInterval> | null = null
  let playing = $state(false)
  const uid = $props.id()

  const y = (v: number) => H / 2 - v * (H / 2) * 0.72
  const path = (xs: ArrayLike<number>) => {
    let d = ''
    for (let i = 0; i < xs.length; i++) {
      d += `${i ? 'L' : 'M'}${((W * i) / (xs.length - 1)).toFixed(1)} ${y(xs[i]).toFixed(1)}`
    }
    return d
  }
  const wave = $derived(partialSum(target, count, 400))
  const ideal = $derived(
    path(Array.from({ length: 401 }, (_, i) => idealWave(target, (2 * i) / 400))),
  )
  const bars = $derived(
    Array.from({ length: MAX }, (_, i) => {
      const n = i + 1
      const a = Math.abs(harmonicAmplitude(target, n))
      const used = a > 0 && n <= wave.newestHarmonic
      return { n, h: (a / (4 / Math.PI)) * 60, used, newest: n === wave.newestHarmonic }
    }),
  )
  const targetName = $derived(target === 'saw' ? c.saw : c.square)

  function stop() {
    if (timer) clearInterval(timer)
    timer = null
    playing = false
  }
  function play() {
    if (playing) return stop()
    if (count >= MAX) count = 1
    playing = true
    timer = setInterval(() => {
      if (count >= MAX) stop()
      else count++
    }, 450)
  }
  $effect(() => stop)

  const options = [
    { value: 'saw', label: c.saw },
    { value: 'square', label: c.square },
  ] as const
</script>

<section
  aria-labelledby="{uid}-title"
  class="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-[18px]"
  data-testid="additive-demo"
>
  <div class="flex flex-wrap items-center gap-3">
    <h2 id="{uid}-title" class="m-0 text-[15px] font-semibold">{c.title}</h2>
    <div class="ml-auto flex flex-wrap items-center gap-2">
      <Segmented
        label={c.shapeLabel}
        {options}
        value={target}
        onchange={(t) => {
          target = t
          count = Math.min(count, MAX)
        }}
      />
      <button
        type="button"
        onclick={play}
        aria-pressed={playing}
        class="min-h-9 cursor-pointer rounded-[10px] border border-line px-3 text-[12.5px] text-muted hover:text-text"
        >{playing ? c.pause : c.play}</button
      >
    </div>
  </div>
  <svg
    viewBox="0 0 {W} {H}"
    class="block h-auto w-full rounded-[10px] bg-[#0b0e12]"
    role="img"
    aria-labelledby="{uid}-readout"
  >
    <path d="M0 {H / 2} H{W}" stroke="var(--color-line)" stroke-width="1.2" />
    <path
      d={ideal}
      fill="none"
      stroke="var(--color-faint)"
      stroke-width="1.6"
      stroke-dasharray="5 4"
      opacity="0.7"
    />
    {#if count > 1}
      <path
        d={path(wave.newest)}
        fill="none"
        stroke="var(--color-stage-filter)"
        stroke-width="1.4"
        opacity="0.8"
      />
    {/if}
    <path
      d={path(wave.sum)}
      fill="none"
      stroke="var(--color-stage-osc)"
      stroke-width="2.6"
      stroke-linejoin="round"
    />
  </svg>
  <svg viewBox="0 0 {W} 70" class="block h-auto w-full" aria-hidden="true">
    {#each bars as b (b.n)}
      {@const x = 20 + (b.n - 1) * ((W - 40) / (MAX - 1))}
      <path
        d="M{x} 66 V{66 - b.h}"
        stroke={b.newest
          ? 'var(--color-stage-filter)'
          : b.used
            ? 'var(--color-stage-osc)'
            : 'var(--color-axis)'}
        stroke-width="10"
      />
    {/each}
  </svg>
  <label class="flex flex-wrap items-center gap-3 text-sm">
    <span class="font-semibold">{c.label}</span>
    <input
      type="range"
      min="1"
      max={MAX}
      step="1"
      bind:value={count}
      oninput={stop}
      class="min-h-7 flex-1 cursor-pointer accent-[var(--color-stage-osc)]"
    />
    <span class="w-8 text-right font-mono text-[#c9d1d9]">{count}</span>
  </label>
  <div class="flex flex-wrap items-center gap-x-[18px] gap-y-2 text-[12.5px] text-muted">
    <span class="inline-flex items-center gap-2"
      ><svg width="22" height="8" aria-hidden="true"
        ><path d="M1 4 H21" stroke="var(--color-stage-osc)" stroke-width="3" /></svg
      >{c.sum}</span
    >
    <span class="inline-flex items-center gap-2"
      ><svg width="22" height="8" aria-hidden="true"
        ><path d="M1 4 H21" stroke="var(--color-stage-filter)" stroke-width="2" /></svg
      >{c.newest}</span
    >
    <span class="inline-flex items-center gap-2"
      ><svg width="22" height="8" aria-hidden="true"
        ><path
          d="M1 4 H21"
          stroke="var(--color-faint)"
          stroke-width="2"
          stroke-dasharray="4 3"
        /></svg
      >{c.target}: {targetName}</span
    >
    <p id="{uid}-readout" class="m-0 ml-auto font-mono text-xs text-[#c9d1d9]" aria-live="polite">
      {c.readout(count, targetName)}
    </p>
  </div>
</section>
