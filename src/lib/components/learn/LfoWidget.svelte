<script lang="ts">
  import { formatHz } from '../../content/viz'
  import { learnCopy } from '../../content/learn'
  import { lfoView } from '../../learn/lfo'
  import { pedal } from '../../state.svelte'
  import { freqPos } from '../../viz/analysis'
  import { scheduler } from '../../viz/scheduler'

  /** Chapter 10: a dot riding the LFO's sine, wired to a wobbling cutoff marker. */
  const c = learnCopy.lfo
  const uid = $props.id()
  const W = 800
  const H = 180
  const WAVE_W = 420
  let seconds = $state(0)

  const mod = $derived(pedal.valueOf('mod'))
  const blend = $derived(pedal.valueOf('modBlend'))
  const cutoff = $derived(pedal.valueOf('cutoff'))
  const view = $derived(lfoView(mod, blend, cutoff, seconds))
  const moving = $derived(mod > 0.005)

  const reduced =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

  $effect(() => {
    if (!moving || reduced) return
    const start = performance.now() - seconds * 1000
    return scheduler().add((now) => {
      seconds = (now - start) / 1000
    })
  })

  const mid = H / 2
  const amp = 58
  const sine = Array.from({ length: 121 }, (_, i) => {
    const t = i / 120
    return `${i ? 'L' : 'M'}${(20 + t * WAVE_W).toFixed(1)} ${(mid - amp * Math.sin(2 * Math.PI * t)).toFixed(1)}`
  }).join('')
  const dotX = $derived(20 + view.phase * WAVE_W)
  const dotY = $derived(mid - amp * view.value * (moving ? 1 : 0))

  // Cutoff scale on the right, log frequency 20 Hz – 12 kHz.
  const X0 = 500
  const X1 = W - 20
  const fx = (hz: number) => X0 + (X1 - X0) * freqPos(hz)
  const text = $derived(
    !moving
      ? c.off
      : view.depthOct === 0
        ? c.chorusOnly
        : c.readout(
            `${view.rateHz.toFixed(1)} times a second`,
            `${view.depthOct.toFixed(1)} octaves (${formatHz(view.cutoffMin)} – ${formatHz(view.cutoffMax)})`,
          ),
  )
</script>

<section
  aria-labelledby="{uid}-title"
  class="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-[18px]"
  data-testid="lfo-widget"
>
  <h2 id="{uid}-title" class="m-0 text-[15px] font-semibold">{c.title}</h2>
  <svg
    viewBox="0 0 {W} {H}"
    class="block h-auto w-full rounded-[10px] bg-[#0b0e12]"
    role="img"
    aria-labelledby="{uid}-readout"
  >
    <path d="M20 {mid} H{20 + WAVE_W}" stroke="var(--color-line)" stroke-width="1.2" />
    <path
      d={sine}
      fill="none"
      stroke="var(--color-stage-mod)"
      stroke-width="2.2"
      opacity={moving ? 1 : 0.35}
    />
    <circle cx={dotX} cy={dotY} r="9" fill="var(--color-stage-mod)" opacity={moving ? 1 : 0.35} />
    <text x="20" y="22" fill="var(--color-faint)" font-size="14">{c.dot}</text>
    <!-- the wire from the dot to the cutoff marker -->
    {#if moving && view.depthOct > 0}
      <path
        d="M{dotX} {dotY} C {WAVE_W + 60} {dotY}, {fx(view.cutoffNow) - 40} {mid}, {fx(
          view.cutoffNow,
        )} {mid}"
        fill="none"
        stroke="var(--color-stage-mod)"
        stroke-width="1.2"
        stroke-dasharray="3 4"
        opacity="0.6"
      />
      <rect
        x={fx(view.cutoffMin)}
        y={mid - 26}
        width={Math.max(2, fx(view.cutoffMax) - fx(view.cutoffMin))}
        height="52"
        fill="var(--color-stage-filter)"
        opacity="0.1"
      />
    {/if}
    <path d="M{X0} {mid} H{X1}" stroke="var(--color-axis)" stroke-width="1.2" />
    <path
      d="M{fx(view.cutoffNow)} {mid - 34} V{mid + 34}"
      stroke="var(--color-stage-filter)"
      stroke-width="3"
    />
    <text x={X0} y="22" fill="var(--color-faint)" font-size="14"
      >{c.cutoff} · {formatHz(view.cutoffNow)}</text
    >
  </svg>
  <p id="{uid}-readout" class="m-0 font-mono text-xs text-[#c9d1d9]" data-testid="lfo-readout">
    {text}
  </p>
</section>
