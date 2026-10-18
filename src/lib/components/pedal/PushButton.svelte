<script lang="ts">
  import { url, type DefIds } from './defs'
  import { pressable } from './press'

  interface Props {
    x: number
    y: number
    r: number
    name: string
    ids: DefIds
    /** Set for toggle buttons; omit for momentary ones. */
    pressed?: boolean
    /** Ring shown while `pressed` is true. */
    ringColor?: string
    /** Colour wash over the cap while its layer is active (the manual's blue / green). */
    tint?: string | null
    /** Cap style: light grey (VOICE, SHAPE) or the small dark-red PRESETS cap. */
    look?: 'grey' | 'preset'
    ondown: () => void
    onup: () => void
    onactive?: (active: boolean) => void
  }

  let {
    x,
    y,
    r,
    name,
    ids,
    pressed,
    ringColor = '#5EC8FF',
    tint = null,
    look = 'grey',
    ondown,
    onup,
    onactive,
  }: Props = $props()

  let down = $state(false)
</script>

<g
  class="push"
  transform="translate({x} {y})"
  role="button"
  tabindex="0"
  aria-label={name}
  aria-pressed={pressed}
  {@attach pressable(() => ({ ondown, onup, onactive, onpressed: (p) => (down = p) }))}
>
  <circle r={r + 14} fill="transparent" />
  {#if look === 'grey'}
    <circle r={r + 16} fill={ringColor} opacity={pressed ? 0.45 : 0} filter={url(ids.glow)} />
    <circle cx="4" cy="10" r={r + 4} fill="#000" opacity="0.5" filter={url(ids.blur6)} />
    <circle r={r + 6} fill="#1C1E21" />
    <circle r={r + 10} fill="none" stroke={ringColor} stroke-width="3" opacity={pressed ? 1 : 0} />
    <g class="cap" class:down>
      <circle {r} fill={url(ids.cap)} />
      <circle {r} fill={tint ?? 'transparent'} opacity={tint ? 0.85 : 0} class="tint" />
      <ellipse cx={-r * 0.3} cy={-r * 0.33} rx={r * 0.43} ry={r * 0.27} fill={url(ids.spec)} />
    </g>
  {:else}
    <circle r={r + 4} fill="#111214" />
    <g class="cap" class:down>
      <circle {r} fill="#4B2B27" />
      <ellipse
        cx={-r * 0.28}
        cy={-r * 0.35}
        rx={r * 0.43}
        ry={r * 0.28}
        fill="#fff"
        opacity="0.25"
      />
    </g>
  {/if}
</g>

<style>
  .push {
    cursor: pointer;
    outline: none;
    touch-action: none;
  }
  .cap {
    transition: transform 0.08s ease;
  }
  .cap.down {
    transform: scale(0.94);
  }
  .tint {
    transition: opacity 0.15s ease;
  }
  .push:focus-visible .cap {
    filter: drop-shadow(0 0 6px var(--color-stage-filter));
  }
</style>
