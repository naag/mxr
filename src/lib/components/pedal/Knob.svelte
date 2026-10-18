<script lang="ts">
  import type { Attachment } from 'svelte/attachments'
  import {
    angleFor,
    arcPath,
    clamp01,
    DRAG_PIXELS,
    FINE_DRAG_FACTOR,
    KEY_STEP,
    PAGE_STEP,
    toDial,
  } from '../../pedal/knob'
  import type { KnobColor } from '../../pedal/layout'
  import { url, type DefIds } from './defs'

  interface Props {
    x: number
    y: number
    color: KnobColor
    /** Accessible name, e.g. "Cutoff". */
    name: string
    value: number
    /** Full value text for screen readers, e.g. "10 o’clock, 211 Hz". */
    valueText: string
    /** Number of detents for stepped controls (keyboard moves one detent per press). */
    steps?: number
    ringColor: string
    ids: DefIds
    onchange: (value: number) => void
    onreset: () => void
    onactive?: (active: boolean) => void
    /** Lit by linked highlighting (pointing at a visual this knob changes). */
    highlighted?: boolean
    /** Expression morph: the heel and toe values, and the value you hear now. */
    morph?: { heel: number; toe: number; now: number } | null
  }

  let {
    x,
    y,
    color,
    name,
    value,
    valueText,
    steps,
    ringColor,
    ids,
    onchange,
    onreset,
    onactive,
    highlighted = false,
    morph = null,
  }: Props = $props()

  let dragging = $state(false)
  let hovered = $state(false)
  let focused = $state(false)
  let dragStart = { y: 0, value: 0 }

  const angle = $derived(angleFor(value))
  const showRing = $derived(dragging || hovered || focused)

  $effect(() => {
    onactive?.(showRing)
  })

  function pointerDown(e: PointerEvent) {
    if (e.button !== 0) return
    const node = e.currentTarget as SVGGElement
    node.setPointerCapture(e.pointerId)
    node.focus({ preventScroll: true })
    dragStart = { y: e.clientY, value }
    dragging = true
    e.preventDefault()
  }

  function pointerMove(e: PointerEvent) {
    if (!dragging) return
    const pixels = e.shiftKey ? DRAG_PIXELS * FINE_DRAG_FACTOR : DRAG_PIXELS
    onchange(clamp01(dragStart.value + (dragStart.y - e.clientY) / pixels))
  }

  function pointerUp() {
    dragging = false
  }

  function keyDown(e: KeyboardEvent) {
    const small = steps ? 1 / (steps - 1) : KEY_STEP
    const big = steps ? small : PAGE_STEP
    const deltas: Record<string, number> = {
      ArrowUp: small,
      ArrowRight: small,
      ArrowDown: -small,
      ArrowLeft: -small,
      PageUp: big,
      PageDown: -big,
    }
    if (e.key in deltas) onchange(clamp01(value + deltas[e.key]))
    else if (e.key === 'Home') onchange(0)
    else if (e.key === 'End') onchange(1)
    else return
    e.preventDefault()
  }

  // Wheel needs a non-passive listener so the page doesn't scroll while turning a knob.
  const wheel: Attachment<SVGGElement> = (node) => {
    const handler = (e: WheelEvent) => {
      if (e.deltaY === 0) return
      e.preventDefault()
      const step = steps ? 1 / (steps - 1) : KEY_STEP
      onchange(clamp01(value - Math.sign(e.deltaY) * step))
    }
    node.addEventListener('wheel', handler, { passive: false })
    return () => node.removeEventListener('wheel', handler)
  }

  const skirt = $derived(color === 'orange' ? ids.orangeSkirt : ids.tealSkirt)
  const dome = $derived(color === 'orange' ? ids.orangeDome : ids.tealDome)
</script>

<g
  class="knob"
  transform="translate({x} {y})"
  role="slider"
  tabindex="0"
  aria-label={name}
  aria-valuemin={0}
  aria-valuemax={10}
  aria-valuenow={toDial(value)}
  aria-valuetext={valueText}
  data-dragging={dragging || undefined}
  data-highlighted={highlighted}
  onpointerdown={pointerDown}
  onpointermove={pointerMove}
  onpointerup={pointerUp}
  onpointercancel={pointerUp}
  onpointerenter={() => (hovered = true)}
  onpointerleave={() => (hovered = false)}
  onfocus={() => (focused = true)}
  onblur={() => (focused = false)}
  onkeydown={keyDown}
  ondblclick={onreset}
  {@attach wheel}
>
  <circle r="104" fill="transparent" />
  <g class="ring" opacity={showRing ? 1 : highlighted ? 0.7 : 0} aria-hidden="true">
    <path
      d={arcPath(101, -150, 150)}
      fill="none"
      stroke="#FFFFFF"
      stroke-opacity="0.13"
      stroke-width="5"
      stroke-linecap="round"
    />
    <path
      d={arcPath(101, -150, angle)}
      fill="none"
      stroke={ringColor}
      stroke-width="5"
      stroke-linecap="round"
    />
  </g>
  {#if morph}
    {@const a = angleFor(Math.min(morph.heel, morph.toe))}
    {@const b = angleFor(Math.max(morph.heel, morph.toe))}
    {@const now = angleFor(morph.now)}
    <g class="morph" aria-hidden="true" data-morph>
      <path
        d={arcPath(112, a, b)}
        fill="none"
        stroke="var(--color-stage-mod)"
        stroke-opacity="0.55"
        stroke-width="6"
        stroke-linecap="round"
      />
      <circle
        cx={112 * Math.sin((now * Math.PI) / 180)}
        cy={-112 * Math.cos((now * Math.PI) / 180)}
        r="8"
        fill="var(--color-stage-mod)"
        stroke="#0d1014"
        stroke-width="2"
      />
    </g>
  {/if}
  <ellipse
    cx="9"
    cy="16"
    rx="84"
    ry="80"
    fill="#000"
    opacity="0.5"
    filter={url(ids.blur6)}
    aria-hidden="true"
  />
  <g class="turn" style:transform="rotate({angle}deg)"
    ><use href="#{ids.scallop}" fill={url(skirt)} /></g
  >
  <circle r="76" fill={url(ids.light)} />
  <circle r="64" fill={url(dome)} />
  <circle r="64.5" fill="none" stroke="#000" stroke-opacity="0.08" stroke-width="2" />
  <g class="turn" style:transform="rotate({angle}deg)">
    <rect x="-4.5" y="-80" width="9" height="50" rx="4.5" fill="#FBFAF6" />
  </g>
  <ellipse
    cx="-20"
    cy="-30"
    rx="26"
    ry="13"
    transform="rotate(-35 -20 -30)"
    fill={url(ids.spec)}
    opacity="0.75"
  />
</g>

<style>
  .knob {
    cursor: ns-resize;
    touch-action: none;
    outline: none;
  }
  .ring {
    transition: opacity 0.15s ease;
  }
  .turn {
    transition: transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .knob[data-dragging] .turn {
    transition: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .turn {
      transition: none;
    }
  }
</style>
