<script lang="ts">
  import { url, type DefIds, type LedColor, type LedState } from './defs'

  interface Props {
    x: number
    y: number
    color: LedColor
    state: LedState
    ids: DefIds
    /** Lens radius. */
    r?: number
    /** Unlit look: dark (panel LEDs) or frosted (preset LEDs). */
    unlit?: 'dark' | 'frost'
    /** Kind of LED, for tests and debugging. */
    name?: string
  }

  let { x, y, color, state, ids, r = 7, unlit = 'dark', name }: Props = $props()

  const hex: Record<LedColor, string> = {
    green: '#5FD35A',
    amber: '#F2A51F',
    red: '#E5484D',
    blue: '#3FB5F0',
  }
  const lens = $derived(
    { green: ids.ledGreen, amber: ids.ledAmber, red: ids.ledRed, blue: ids.ledBlue }[color],
  )
</script>

<g
  class="led"
  data-led={name}
  data-state={state}
  data-color={color}
  transform="translate({x} {y})"
  aria-hidden="true"
>
  <g class="lit" opacity={state === 'off' ? 0 : 1}>
    <circle r={r * 2.4} fill={hex[color]} opacity="0.85" filter={url(ids.glow)} />
  </g>
  <circle r={r + 3} fill="#141619" />
  <circle {r} fill={url(unlit === 'frost' ? ids.ledFrost : ids.ledOff)} />
  <g class="lit" opacity={state === 'off' ? 0 : 1}>
    <circle {r} fill={url(lens)} />
  </g>
  <ellipse cx={-r * 0.3} cy={-r * 0.35} rx={r * 0.4} ry={r * 0.27} fill="#fff" opacity="0.4" />
</g>

<style>
  .lit {
    transition: opacity 0.12s ease;
  }
  [data-state='soft'] .lit {
    animation: soft 1.6s ease-in-out infinite;
  }
  [data-state='hard'] .lit {
    animation: hard 0.3s steps(1, end) infinite;
  }
  @keyframes soft {
    50% {
      opacity: 0.3;
    }
  }
  @keyframes hard {
    50% {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    [data-state='soft'] .lit,
    [data-state='hard'] .lit {
      animation: none;
      opacity: 0.55;
    }
  }
</style>
