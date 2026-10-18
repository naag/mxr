<script lang="ts">
  import { CanvasView, token } from './canvas.svelte'
  import { drawScope } from './draw/scope'
  import type { FlowTap } from './flow'
  import { scheduler } from './scheduler'
  import { TapReader } from './tap-reader'
  import { computed } from '../state.svelte'

  interface Props {
    tap: FlowTap
    /** Theme color token for the trace, e.g. `stage-filter`. */
    color: string
    live: boolean
    /** Dim the trace (stage not doing anything right now). */
    faded?: boolean
    class?: string
  }

  let { tap, color, live, faded = false, class: cls = '' }: Props = $props()

  const view = new CanvasView()
  const reader = new TapReader()

  function draw() {
    const ctx = view.context()
    if (!ctx) return
    // Read the snapshot here so computed redraws track it.
    void computed.snapshot
    const points = Math.max(80, Math.min(600, Math.round(view.width)))
    const t = reader.read(tap, points, live)
    const trace = token(color)
    drawScope(
      ctx,
      view.size,
      {
        traces: t ? [{ samples: t.samples, color: trace, width: 1.8 }] : [],
        scale: t && t.peak > 1e-3 ? 1 : 0,
        cycles: 1,
        detailed: false,
        highlighted: false,
        cycleLabel: () => '',
      },
      {
        grid: token('grid'),
        axis: token('line'),
        marker: token('marker'),
        text: token('faint'),
        trace,
        ghost: trace,
      },
    )
  }

  $effect(() => {
    if (live && view.visible) return scheduler().add(draw)
    draw()
  })
</script>

<canvas
  {@attach view.attach}
  class={['block rounded-lg bg-[#0b0e12] transition-opacity', faded && 'opacity-50', cls]}
  aria-hidden="true"
  data-tap={tap}
></canvas>
