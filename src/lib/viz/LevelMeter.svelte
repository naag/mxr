<script lang="ts">
  import { formatDb, meterReadout, vizCopy } from '../content/viz'
  import { audio, computed, pedal } from '../state.svelte'
  import { dB } from './analysis'
  import { linksFor } from './links'
  import { isLive } from './live.svelte'
  import VizPanel from './VizPanel.svelte'

  let { class: cls = '' }: { class?: string } = $props()

  const FLOOR = -60
  const live = $derived(isLive())
  const highlighted = $derived(linksFor(pedal.focused, pedal.layer).viz.includes('meter'))

  const levels = $derived.by(() => {
    const t = audio.telemetry
    if (live && t) return { left: t.peakLeft, right: t.peakRight, gr: t.gainReductionDb }
    const m = computed.snapshot?.meter
    return m ? { left: m.peakLeft, right: m.peakRight, gr: m.gainReductionDb } : null
  })
  const rows = $derived(
    levels
      ? [
          {
            id: 'left',
            label: vizCopy.meter.left,
            name: vizCopy.meter.leftName,
            db: Math.max(FLOOR, dB(levels.left)),
          },
          {
            id: 'right',
            label: vizCopy.meter.right,
            name: vizCopy.meter.rightName,
            db: Math.max(FLOOR, dB(levels.right)),
          },
        ]
      : [],
  )
  const gr = $derived(Math.min(24, Math.max(0, levels?.gr ?? 0)))
  const readout = $derived(
    levels ? meterReadout({ left: rows[0].db, right: rows[1].db, grDb: gr }) : '',
  )
  const pos = (db: number) => Math.max(0, Math.min(1, (db - FLOOR) / -FLOOR))
  const color = (db: number) =>
    db > -1 ? 'var(--color-led-red)' : db > -6 ? '#d9c85a' : 'var(--color-stage-dyn)'
</script>

<VizPanel
  id="meter"
  title={vizCopy.meter.title}
  sub={vizCopy.meter.sub}
  {live}
  {highlighted}
  {readout}
  class={cls}
>
  <div class="flex flex-col gap-3 py-1">
    {#each rows as r (r.id)}
      <div class="grid grid-cols-[64px_1fr_64px] items-center gap-3 text-[12.5px]">
        <span class="text-muted">{r.label}</span>
        <div
          class="h-2.5 overflow-hidden rounded-full bg-[#1a2027]"
          role="meter"
          aria-label={r.name}
          aria-valuemin={FLOOR}
          aria-valuemax={0}
          aria-valuenow={Math.round(r.db)}
          aria-valuetext={formatDb(r.db)}
        >
          <div
            class="h-full rounded-full transition-[width] duration-75"
            style:width="{pos(r.db) * 100}%"
            style:background={color(r.db)}
          ></div>
        </div>
        <span class="text-right font-mono text-[#c9d1d9]"
          >{r.db <= FLOOR ? '−∞' : formatDb(r.db)}</span
        >
      </div>
    {/each}
    <div class="grid grid-cols-[64px_1fr_64px] items-center gap-3 text-[12.5px]">
      <span class="text-muted">{vizCopy.meter.gr}</span>
      <div
        class="flex h-2.5 justify-end overflow-hidden rounded-full bg-[#1a2027]"
        role="meter"
        aria-label={vizCopy.meter.grName}
        aria-valuemin={0}
        aria-valuemax={24}
        aria-valuenow={Math.round(gr)}
        aria-valuetext={gr >= 0.5 ? `−${gr.toFixed(0)} dB` : '0 dB'}
      >
        <div
          class="h-full rounded-full bg-stage-mod transition-[width] duration-75"
          style:width="{(gr / 24) * 100}%"
        ></div>
      </div>
      <span class="text-right font-mono text-[#c9d1d9]"
        >{gr >= 0.5 ? `−${gr.toFixed(0)}` : '0'} dB</span
      >
    </div>
  </div>
</VizPanel>
