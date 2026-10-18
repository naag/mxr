<script lang="ts">
  import { url, type DefIds } from './defs'

  interface Props {
    x: number
    y: number
    engaged: boolean
    ids: DefIds
    onpress: () => void
    onactive?: (active: boolean) => void
  }

  let { x, y, engaged, ids, onpress, onactive }: Props = $props()
  let down = $state(false)

  const hex = (r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const t = ((30 + 60 * i) * Math.PI) / 180
      return `${(r * Math.cos(t)).toFixed(1)},${(r * Math.sin(t)).toFixed(1)}`
    }).join(' ')

  function keyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onpress()
    }
  }
</script>

<g
  class="footswitch"
  transform="translate({x} {y})"
  role="button"
  tabindex="0"
  aria-label="Footswitch: synth {engaged ? 'on' : 'bypassed'}"
  aria-pressed={engaged}
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
  <ellipse cx="13" cy="22" rx="98" ry="92" fill="#000" opacity="0.55" filter={url(ids.blur14)} />
  <polygon points={hex(92)} fill={url(ids.chrome)} />
  <polygon points={hex(92)} fill="none" stroke="#3A3F45" stroke-opacity="0.6" stroke-width="2" />
  <circle r="72" fill={url(ids.chromeV)} stroke="#565C63" stroke-width="1.5" />
  <circle r="62" fill="#2A2E33" />
  <g class="cap" class:down>
    <circle r="57" fill={url(ids.fsCap)} />
    <g fill="none" stroke="#fff" stroke-width="1.4">
      <circle r="49" opacity="0.14" />
      <circle r="40" opacity="0.11" />
      <circle r="31" opacity="0.09" />
      <circle r="22" opacity="0.07" />
    </g>
    <ellipse
      cx="-21"
      cy="-22"
      rx="26"
      ry="12"
      transform="rotate(-32 -21 -22)"
      fill={url(ids.spec)}
      opacity="0.6"
    />
  </g>
</g>

<style>
  .footswitch {
    cursor: pointer;
    outline: none;
  }
  .cap {
    transition: transform 0.08s ease;
  }
  .cap.down {
    transform: scale(0.95);
  }
  .footswitch:focus-visible .cap {
    filter: drop-shadow(0 0 8px var(--color-stage-filter));
  }
</style>
