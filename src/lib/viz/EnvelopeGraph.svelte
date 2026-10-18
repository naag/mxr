<script lang="ts">
  import { envelopeReadout, vizCopy } from '../content/viz'
  import { ampAttackMs, envelopeTimes } from '../pedal/params'
  import { audio, computed, pedal } from '../state.svelte'
  import { ENV_REGIONS, ENV_VIEW, envelopeGeometry } from './draw/envelope'
  import { linksFor } from './links'
  import { isLive } from './live.svelte'
  import VizPanel from './VizPanel.svelte'

  let { class: cls = '' }: { class?: string } = $props()

  // Drawn 1:1 in CSS pixels so labels keep their size at any panel width.
  let W = $state(560)

  const live = $derived(isLive())
  const highlighted = $derived(linksFor(pedal.focused, pedal.layer).viz.includes('envelope'))
  const env = $derived(computed.snapshot?.envelope ?? null)
  const g = $derived(env ? envelopeGeometry(env, W) : null)
  const values = $derived(pedal.sound.values)

  // Live playhead: time since the synth started the note, at the cutoff it has right now.
  const head = $derived.by(() => {
    const t = audio.telemetry
    if (!live || !env || !g || !t || t.noteAge === null) return null
    const at = env.synthOn + t.noteAge
    if (at > env.seconds) return null
    return { x: g.x(at), y: g.yHz(t.cutoffHz), hz: t.cutoffHz }
  })

  const readout = $derived(
    env && g
      ? envelopeReadout({
          knobHz: env.knobHz,
          peakHz: g.peak.hz,
          lowHz: g.low.hz,
          envOn: envelopeTimes(values.envelope) !== null,
          fadeInMs: ampAttackMs(values.ampEnv),
        })
      : '',
  )
  const dips = $derived(g ? g.low.hz < (env?.knobHz ?? 0) / 1.08 : false)
  const V = ENV_REGIONS.volume
</script>

<VizPanel
  id="envelope"
  title={vizCopy.envelope.title}
  sub={vizCopy.envelope.sub}
  {live}
  {highlighted}
  {readout}
  class={cls}
>
  <div bind:clientWidth={W}>
    <svg
      viewBox="0 0 {Math.max(1, W)} {ENV_VIEW.height}"
      class="block h-auto w-full"
      role="img"
      aria-label="{vizCopy.envelope.title}: {readout}"
    >
      {#if g && env}
        <g stroke="var(--color-grid)" stroke-width="1">
          {#each g.ticks as t (t.ms)}<path d="M{t.x} 0 V226" />{/each}
        </g>
        <path d="M0 {g.knobY} H{W}" stroke="#5e6b78" stroke-width="1.2" stroke-dasharray="4 4" />
        <path d={g.above} fill="var(--color-stage-env)" opacity="0.16" />
        <path d={g.below} fill="var(--color-stage-mod)" opacity="0.16" />
        <path
          d={g.cutoff}
          fill="none"
          stroke="var(--color-stage-env)"
          stroke-width={highlighted ? 3.2 : 2.6}
          stroke-linejoin="round"
        />
        <path d="M0 {V.bottom} H{W}" stroke="var(--color-axis)" stroke-width="1" />
        <path d={g.levelArea} fill="var(--color-stage-env)" opacity="0.1" />
        <path d={g.level} fill="none" stroke="#c7b6ff" stroke-width="2" stroke-linejoin="round" />
        <path
          d="M{g.noteOffX} {V.top - 8} V{V.bottom}"
          stroke="#5e6b78"
          stroke-width="1"
          stroke-dasharray="3 4"
        />
        {#if head}
          <path d="M{head.x} 0 V226" stroke="var(--color-text)" opacity="0.55" stroke-width="1.2" />
          <circle
            cx={head.x}
            cy={head.y}
            r="5.5"
            fill="var(--color-stage-filter)"
            stroke="var(--color-bg)"
            stroke-width="2"
            data-testid="envelope-playhead"
          />
        {/if}
        <g font-family="var(--font-sans)" font-size="13" font-weight="600">
          {#if dips}
            <text x={Math.min(g.low.x + 8, W - 120)} y={Math.min(g.low.y + 18, 150)} fill="#f4b3d6"
              >{vizCopy.envelope.dip(g.low.hz)}</text
            >
          {:else if g.peak.hz > env.knobHz * 1.08}
            <text x={Math.min(g.peak.x + 8, W - 120)} y={Math.max(g.peak.y - 8, 14)} fill="#cdbeff"
              >{vizCopy.envelope.peak(g.peak.hz)}</text
            >
          {/if}
          {#if head}
            <text x={Math.min(head.x + 10, W - 100)} y={Math.max(head.y + 22, 30)} fill="#7fd8df"
              >{vizCopy.envelope.now(head.hz)}</text
            >
          {/if}
          <text
            x={W - 6}
            y={Math.max(g.knobY - 6, 14)}
            fill="var(--color-subtle)"
            font-weight="400"
            text-anchor="end">{vizCopy.envelope.knob(env.knobHz)}</text
          >
          <text x={W - 6} y="160" fill="#c7b6ff" text-anchor="end">{vizCopy.envelope.volume}</text>
          <text x={g.noteOffX + 6} y={V.top + 4} fill="var(--color-subtle)" font-weight="400"
            >{vizCopy.envelope.noteEnds}</text
          >
        </g>
        <g font-family="var(--font-mono)" font-size="11" fill="var(--color-subtle)">
          {#each g.ticks as t, i (t.ms)}
            <text
              x={i === 0 ? 2 : t.x}
              y="246"
              text-anchor={i === 0 ? 'start' : i === g.ticks.length - 1 ? 'end' : 'middle'}
              >{vizCopy.envelope.ms(t.ms)}</text
            >
          {/each}
        </g>
      {/if}
    </svg>
  </div>
  {#snippet legend()}
    <span class="inline-flex items-center gap-2"
      ><svg width="22" height="8" aria-hidden="true"
        ><path d="M1 4 H21" stroke="var(--color-stage-env)" stroke-width="3" /></svg
      >{vizCopy.envelope.brightness}</span
    >
    <span class="inline-flex items-center gap-2"
      ><svg width="22" height="8" aria-hidden="true"
        ><path d="M1 4 H21" stroke="#c7b6ff" stroke-width="2" /></svg
      >{vizCopy.envelope.volume}</span
    >
  {/snippet}
</VizPanel>
