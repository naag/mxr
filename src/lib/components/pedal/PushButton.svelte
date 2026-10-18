<script lang="ts">
  import { url, type DefIds } from './defs'

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
    /** Cap style: light grey (VOICE, SHAPE) or the small dark-red PRESETS cap. */
    look?: 'grey' | 'preset'
    onpress: () => void
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
    look = 'grey',
    onpress,
    onactive,
  }: Props = $props()

  let down = $state(false)

  function keyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onpress()
    }
  }
</script>

<g
  class="push"
  transform="translate({x} {y})"
  role="button"
  tabindex="0"
  aria-label={name}
  aria-pressed={pressed}
  onclick={onpress}
  onkeydown={keyDown}
  onpointerdown={() => (down = true)}
  onpointerup={() => (down = false)}
  onpointerleave={() => {
    down = false
    onactive?.(false)
  }}
  onpointerenter={() => onactive?.(true)}
  onfocus={() => onactive?.(true)}
  onblur={() => onactive?.(false)}
>
  <circle r={r + 14} fill="transparent" />
  {#if look === 'grey'}
    <circle r={r + 16} fill={ringColor} opacity={pressed ? 0.45 : 0} filter={url(ids.glow)} />
    <circle cx="4" cy="10" r={r + 4} fill="#000" opacity="0.5" filter={url(ids.blur6)} />
    <circle r={r + 6} fill="#1C1E21" />
    <circle r={r + 10} fill="none" stroke={ringColor} stroke-width="3" opacity={pressed ? 1 : 0} />
    <g class="cap" class:down>
      <circle {r} fill={url(ids.cap)} />
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
  }
  .cap {
    transition: transform 0.08s ease;
  }
  .cap.down {
    transform: scale(0.94);
  }
  .push:focus-visible .cap {
    filter: drop-shadow(0 0 6px var(--color-stage-filter));
  }
</style>
