<script lang="ts">
  import { stageColors } from '../../content/controls'
  import { expressionCopy as copy } from '../../content/expression'
  import { clamp01, clockLabel } from '../../pedal/knob'
  import { PARAM, formatValue } from '../../pedal/params'
  import type { PedalStore } from '../../pedal/pedal.svelte'
  import { toeChanges, toeValue } from '../../pedal/presets'
  import { prefersReducedMotion } from 'svelte/motion'

  /** Virtual expression pedal with a heel/toe editor and a morph view (reference §7). */
  let { pedal }: { pedal: PedalStore } = $props()

  const uid = $props.id()
  const x = $derived(pedal.state.expression)
  const patch = $derived(pedal.state.current)
  const sound = $derived(pedal.sound)
  const position = $derived(x.editing === 'toe' ? 1 : x.position)
  const rows = $derived(
    toeChanges(patch).map((id) => {
      const p = PARAM[id]
      const heel = patch.values[id]
      const toe = toeValue(patch, id)
      return { id, p, heel, toe, now: sound.values[id] }
    }),
  )

  // Treadle tilt in degrees: heel down tilts back, toe down tilts forward.
  const tilt = $derived(-11 + 22 * position)

  let dragging = false
  let dragStart = { y: 0, value: 0 }
  let sweepFrame: number | null = null
  let sweeping = $state(false)

  function set(v: number) {
    stopSweep()
    pedal.setExpression(clamp01(v))
  }

  function pointerDown(e: PointerEvent) {
    if (e.button !== 0) return
    ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
    dragging = true
    dragStart = { y: e.clientY, value: position }
    e.preventDefault()
  }
  function pointerMove(e: PointerEvent) {
    if (dragging) set(dragStart.value + (dragStart.y - e.clientY) / 120)
  }
  function keyDown(e: KeyboardEvent) {
    const deltas: Record<string, number> = {
      ArrowUp: 0.05,
      ArrowRight: 0.05,
      ArrowDown: -0.05,
      ArrowLeft: -0.05,
      PageUp: 0.25,
      PageDown: -0.25,
    }
    if (e.key in deltas) set(position + deltas[e.key])
    else if (e.key === 'Home') set(0)
    else if (e.key === 'End') set(1)
    else return
    e.preventDefault()
  }

  /** Rocks the pedal heel → toe → heel every 4 seconds, to hear the morph hands-free. */
  function startSweep() {
    if (prefersReducedMotion.current) {
      pedal.setExpression(position < 0.5 ? 1 : 0)
      return
    }
    sweeping = true
    const start = performance.now() - Math.acos(1 - 2 * position) * (4000 / (2 * Math.PI))
    const step = (now: number) => {
      pedal.setExpression((1 - Math.cos(((now - start) / 4000) * 2 * Math.PI)) / 2)
      sweepFrame = requestAnimationFrame(step)
    }
    sweepFrame = requestAnimationFrame(step)
  }
  function stopSweep() {
    if (sweepFrame !== null) cancelAnimationFrame(sweepFrame)
    sweepFrame = null
    sweeping = false
  }
  $effect(() => stopSweep)
  $effect(() => {
    if (!x.connected) stopSweep()
  })

  const pct = (v: number) => `${(v * 100).toFixed(1)}%`
</script>

<section
  aria-labelledby="{uid}-title"
  class="flex w-full flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
  data-testid="expression"
>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
    <div class="flex flex-col">
      <h2 id="{uid}-title" class="m-0 text-[15px] font-semibold">{copy.title}</h2>
      <span class="text-[12.5px] text-subtle">{copy.sub}</span>
    </div>
    <label class="ml-auto inline-flex min-h-11 cursor-pointer items-center gap-2 text-[13px]">
      <input
        type="checkbox"
        checked={x.connected}
        onchange={(e) => pedal.connectExpression(e.currentTarget.checked)}
        class="size-4 accent-[var(--color-stage-mod)]"
      />
      {copy.plug}
    </label>
  </div>

  {#if !x.connected}
    <p class="m-0 text-[13px] leading-normal text-muted">{copy.unplugged}</p>
  {:else}
    <p class="m-0 text-xs text-subtle">{copy.plugged}</p>
    <div class="flex flex-wrap items-start gap-4">
      <svg
        viewBox="0 0 120 120"
        width="120"
        height="120"
        class="rocker shrink-0 cursor-ns-resize rounded-xl bg-[#0d1115]"
        role="slider"
        tabindex="0"
        aria-label={copy.rocker}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position * 100)}
        aria-valuetext={copy.position(position)}
        onpointerdown={pointerDown}
        onpointermove={pointerMove}
        onpointerup={() => (dragging = false)}
        onpointercancel={() => (dragging = false)}
        onkeydown={keyDown}
      >
        <g aria-hidden="true">
          <rect x="14" y="84" width="92" height="14" rx="4" fill="#2a3038" />
          <circle cx="60" cy="80" r="6" fill="#3a4450" />
          <g transform="rotate({tilt} 60 74)">
            <rect x="12" y="64" width="96" height="12" rx="5" fill="#4a525c" />
            <rect x="18" y="62" width="84" height="4" rx="2" fill="#6b7480" />
          </g>
          <text x="16" y="112" font-size="10" fill="var(--color-faint)">HEEL</text>
          <text x="104" y="112" font-size="10" fill="var(--color-faint)" text-anchor="end">TOE</text
          >
          <rect x="16" y="22" width="88" height="6" rx="3" fill="#1e252d" />
          <rect
            x="16"
            y="22"
            width={88 * position}
            height="6"
            rx="3"
            fill="var(--color-stage-mod)"
          />
          <text x="60" y="15" font-size="11" fill="#c9d1d9" text-anchor="middle"
            >{Math.round(position * 100)}%</text
          >
        </g>
      </svg>

      <div class="flex min-w-[180px] flex-1 flex-col gap-2">
        <div role="group" aria-label={copy.editLabel} class="flex gap-1">
          <span class="self-center pr-1 text-[12.5px] text-muted">{copy.editLabel}</span>
          {#each ['heel', 'toe'] as const as target (target)}
            <button
              type="button"
              aria-pressed={x.editing === target}
              onclick={() => {
                stopSweep()
                pedal.editExpression(target)
              }}
              class={[
                'min-h-10 flex-1 cursor-pointer rounded-[9px] border px-3 text-[13px] font-semibold',
                x.editing === target
                  ? 'border-[#5a3a4d] bg-[rgba(238,123,184,0.14)] text-stage-mod'
                  : 'border-line text-muted hover:text-text',
              ]}>{target === 'heel' ? copy.heel : copy.toe}</button
            >
          {/each}
        </div>
        <p class="m-0 text-xs leading-normal text-subtle" aria-live="polite">
          {x.editing === 'toe' ? copy.editToeHint : copy.editHeelHint}
        </p>
        <button
          type="button"
          onclick={() => (sweeping ? stopSweep() : startSweep())}
          aria-pressed={sweeping}
          disabled={rows.length === 0}
          class="min-h-10 cursor-pointer self-start rounded-[9px] border border-line bg-raised px-3 text-[13px] font-medium disabled:cursor-default disabled:opacity-50"
          >{sweeping ? copy.stopSweep : copy.sweep}</button
        >
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <h3 class="m-0 text-[13px] font-semibold text-muted">{copy.morphs}</h3>
      {#if rows.length === 0}
        <p class="m-0 text-[13px] text-subtle">{copy.none}</p>
      {:else}
        <ul class="m-0 flex list-none flex-col gap-2.5 p-0" data-testid="expression-morphs">
          {#each rows as r (r.id)}
            {@const lo = Math.min(r.heel, r.toe)}
            {@const hi = Math.max(r.heel, r.toe)}
            <li
              class="flex flex-col gap-1"
              aria-label={copy.row(r.p.label, clockLabel(r.heel), clockLabel(r.toe))}
            >
              <div class="flex items-baseline justify-between gap-2 text-[12.5px]">
                <span class="font-semibold">{r.p.label}</span>
                <span class="font-mono text-[11.5px] text-muted"
                  >{clockLabel(r.heel)} → {clockLabel(r.toe)} · now {formatValue(r.id, r.now)}</span
                >
              </div>
              <div class="relative h-2 rounded-full bg-[#1e252d]" aria-hidden="true">
                <div
                  class="absolute inset-y-0 rounded-full opacity-35"
                  style:left={pct(lo)}
                  style:width={pct(hi - lo)}
                  style:background={stageColors[r.p.stage]}
                ></div>
                <div
                  class="absolute top-1/2 size-2.5 -translate-1/2 rounded-full border-2 bg-surface"
                  style:left={pct(r.heel)}
                  style:border-color={stageColors[r.p.stage]}
                ></div>
                <div
                  class="absolute top-1/2 size-2.5 -translate-1/2 rounded-full"
                  style:left={pct(r.toe)}
                  style:background={stageColors[r.p.stage]}
                ></div>
                <div
                  class="absolute top-1/2 h-4 w-1 -translate-1/2 rounded-full bg-text"
                  style:left={pct(r.now)}
                ></div>
              </div>
            </li>
          {/each}
        </ul>
        <button
          type="button"
          onclick={() => pedal.clearToe()}
          class="min-h-10 cursor-pointer self-start rounded-[9px] border border-line px-3 text-[13px] text-muted hover:text-text"
          >{copy.clear}</button
        >
      {/if}
    </div>
    <p class="m-0 text-xs leading-normal text-subtle">{copy.honesty}</p>
  {/if}
</section>

<style>
  .rocker {
    touch-action: none;
  }
</style>
