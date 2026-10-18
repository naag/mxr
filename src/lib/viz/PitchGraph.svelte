<script lang="ts">
  import { untrack } from 'svelte'
  import { pitchReadout, vizCopy } from '../content/viz'
  import { glideMs } from '../pedal/params'
  import { audio, computed, pedal, viz } from '../state.svelte'
  import { PITCH_VIEW, pitchGeometry, type PitchPoint } from './draw/pitch'
  import { linksFor } from './links'
  import { isLive } from './live.svelte'
  import VizPanel from './VizPanel.svelte'

  let { class: cls = '' }: { class?: string } = $props()

  // Drawn 1:1 in CSS pixels so labels keep their size at any panel width.
  let W = $state(560)

  /** Seconds of history in the live view. */
  const HISTORY = 4

  const live = $derived(isLive())
  const highlighted = $derived(linksFor(pedal.focused, pedal.layer).viz.includes('pitch'))
  const curve = $derived(computed.snapshot?.pitch ?? null)

  // Live history from telemetry, in seconds on the page clock.
  let history = $state.raw<PitchPoint[]>([])
  $effect(() => {
    const t = audio.telemetry
    if (!t || !live) return
    const now = performance.now() / 1000
    // Silent between notes: break the line instead of drawing a held pitch.
    const midi = t.level > 0.01 ? t.pitch : NaN
    const kept = untrack(() => history).filter((p) => p.t > now - HISTORY)
    history = [...kept, { t: now, midi }]
  })
  $effect(() => {
    if (!live) untrack(() => (history = []))
  })

  const g = $derived.by(() => {
    if (live && history.length > 1) {
      const now = history[history.length - 1].t
      return pitchGeometry(history, [], now - HISTORY, now, W)
    }
    if (!curve) return null
    const step = Math.max(1, Math.floor(curve.pitch.length / 800))
    const points: PitchPoint[] = []
    for (let i = 0; i < curve.pitch.length; i += step)
      points.push({ t: i * curve.dt, midi: curve.pitch[i] })
    const bars = curve.notes.map((n) => ({ ...n, dim: !n.triggered }))
    return pitchGeometry(points, bars, 0, curve.seconds, W)
  })

  const nowMidi = $derived.by(() => {
    if (!live) return null
    const last = history[history.length - 1]
    return last && Number.isFinite(last.midi) ? last.midi : null
  })
  const ignored = $derived(curve && !live ? curve.notes.filter((n) => !n.triggered).length : 0)
  const readout = $derived(
    pitchReadout({
      glideMs: glideMs(pedal.sound.values.glide),
      nowMidi,
      frozen: pedal.state.frozen,
      ignored,
    }),
  )
  const beats = $derived(
    curve && !live && g
      ? Array.from({ length: Math.round(curve.seconds / curve.beat) }, (_, i) => ({
          n: i + 1,
          x: g.x(i * curve.beat),
        }))
      : [],
  )
  const seconds = $derived.by(() => {
    const last = history[history.length - 1]
    if (!live || !g || !last) return []
    return Array.from({ length: HISTORY + 1 }, (_, i) => ({
      s: HISTORY - i,
      x: g.x(last.t - HISTORY + i),
    }))
  })
</script>

<VizPanel
  id="pitch"
  title={vizCopy.pitch.title}
  sub={live ? vizCopy.pitch.sub : vizCopy.pitch.subComputed}
  {live}
  {highlighted}
  {readout}
  class={cls}
>
  <div bind:clientWidth={W}>
    <svg
      viewBox="0 0 {Math.max(1, W)} {PITCH_VIEW.height}"
      class="block h-auto w-full"
      role="img"
      aria-label="{vizCopy.pitch.title}: {readout}"
    >
      {#if g}
        <g stroke="var(--color-grid)" stroke-width="1">
          {#each g.grid as line (line.label)}
            {#if line.natural || viz.detailed}<path d="M{g.left} {line.y} H{W}" />{/if}
          {/each}
          {#each beats as b (b.n)}<path d="M{b.x} 0 V226" stroke="#232b34" />{/each}
        </g>
        <g font-family="var(--font-mono)" font-size="11.5" fill="var(--color-subtle)">
          {#each g.grid as line (line.label)}
            {#if line.natural || viz.detailed}<text x="0" y={line.y + 4}>{line.label}</text>{/if}
          {/each}
        </g>
        <g stroke="var(--color-stage-osc)" stroke-width="1.2">
          {#each g.bars as b, i (i)}
            <rect
              x={b.x}
              y={b.y}
              width={b.width}
              height={b.height}
              rx="4"
              fill="rgba(242, 169, 59, 0.16)"
              opacity={b.dim ? 0.3 : 0.9}
              stroke-dasharray={b.dim ? '3 3' : undefined}
            />
          {/each}
        </g>
        <path
          d={g.path}
          fill="none"
          stroke="var(--color-stage-osc)"
          stroke-width={highlighted ? 3.2 : 2.6}
          stroke-linejoin="round"
          data-testid="pitch-line"
        />
        {#if nowMidi !== null}
          <circle
            cx={W - 4}
            cy={g.y(nowMidi)}
            r="5.5"
            fill="var(--color-stage-osc)"
            stroke="var(--color-bg)"
            stroke-width="2"
          />
          <text
            x={W - 14}
            y={g.y(nowMidi) - 12}
            text-anchor="end"
            font-family="var(--font-sans)"
            font-size="13"
            font-weight="600"
            fill="#f7c77a"
            >{vizCopy.pitch.now(nowMidi)}{pedal.state.frozen
              ? ` · ${vizCopy.pitch.frozen}`
              : ''}</text
          >
        {/if}
        <g font-family="var(--font-mono)" font-size="11" fill="var(--color-subtle)">
          {#each beats as b (b.n)}
            <text x={b.x} y="246" text-anchor={b.n === 1 ? 'start' : 'middle'}
              >{vizCopy.pitch.beat(b.n)}</text
            >
          {/each}
          {#each seconds as s (s.s)}
            <text
              x={s.x}
              y="246"
              text-anchor={s.s === HISTORY ? 'start' : s.s === 0 ? 'end' : 'middle'}
              >{vizCopy.pitch.ago(s.s)}</text
            >
          {/each}
        </g>
      {/if}
    </svg>
  </div>
  {#snippet legend()}
    {#if !live}
      <span class="inline-flex items-center gap-2"
        ><svg width="18" height="10" aria-hidden="true"
          ><rect
            x="1"
            y="1"
            width="16"
            height="8"
            rx="3"
            fill="rgba(242, 169, 59, 0.16)"
            stroke="var(--color-stage-osc)"
          /></svg
        >{vizCopy.pitch.notes}</span
      >
      {#if ignored > 0}
        <span class="inline-flex items-center gap-2"
          ><svg width="18" height="10" aria-hidden="true"
            ><rect
              x="1"
              y="1"
              width="16"
              height="8"
              rx="3"
              fill="none"
              stroke="var(--color-stage-osc)"
              stroke-dasharray="3 3"
            /></svg
          >{vizCopy.pitch.ignored}</span
        >
      {/if}
    {/if}
    <span class="inline-flex items-center gap-2"
      ><svg width="22" height="8" aria-hidden="true"
        ><path d="M1 4 H21" stroke="var(--color-stage-osc)" stroke-width="3" /></svg
      >{vizCopy.pitch.line}</span
    >
  {/snippet}
</VizPanel>
