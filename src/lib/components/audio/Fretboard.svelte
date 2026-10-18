<script lang="ts">
  import { FRETS, noteName, STRINGS } from '../../audio/notes'

  interface Props {
    /** The note sounding now, for highlighting. */
    active: number | null
    onnoteon: (midi: number) => void
    onnoteoff: (midi: number) => void
  }

  let { active, onnoteon, onnoteoff }: Props = $props()

  // Real fret spacing: fret n sits at 1 − 2^(−n/12) of the scale length.
  const NUT = 44
  const SCALE = (636 - NUT) / (1 - 2 ** (-FRETS / 12))
  const fretX = (n: number) => (n === 0 ? NUT : NUT + SCALE * (1 - 2 ** (-n / 12)))
  const stringY = (s: number) => 102 - 27 * s
  const cellLeft = (n: number) => (n === 0 ? 0 : fretX(n - 1))
  const markers = [3, 5, 7, 9]

  const cells = STRINGS.flatMap((str, s) =>
    Array.from({ length: FRETS + 1 }, (_, fret) => ({
      key: `${s}-${fret}`,
      s,
      fret,
      midi: str.open + fret,
      label: `${str.name} string, ${fret === 0 ? 'open' : `fret ${fret}`}: ${noteName(str.open + fret)}`,
      x: cellLeft(fret),
      w: fretX(fret) - cellLeft(fret),
      cx: fret === 0 ? NUT / 2 : (cellLeft(fret) + fretX(fret)) / 2,
    })),
  )

  // Roving focus: one tab stop for the whole fretboard, arrow keys move between frets.
  let focus = $state({ s: 1, fret: 0 })
  let down: number | null = null
  /** The cell you pressed; the same note exists on several strings. */
  let pressedKey = $state<string | null>(null)

  // Light one position: the pressed cell, or for riff and keyboard notes the lowest fret.
  const lit = $derived.by(() => {
    if (active === null) return null
    const pressed = cells.find((c) => c.key === pressedKey)
    if (pressed?.midi === active) return pressed.key
    const options = cells.filter((c) => c.midi === active)
    return options.sort((a, b) => a.fret - b.fret)[0]?.key ?? null
  })
  const nodes: Record<string, SVGElement> = {}

  function press(midi: number, key: string) {
    if (down !== null) onnoteoff(down)
    down = midi
    pressedKey = key
    onnoteon(midi)
  }
  function release() {
    if (down === null) return
    onnoteoff(down)
    down = null
  }

  function keydown(e: KeyboardEvent, s: number, fret: number, midi: number, key: string) {
    const moves: Record<string, [number, number]> = {
      ArrowRight: [0, 1],
      ArrowLeft: [0, -1],
      ArrowUp: [1, 0],
      ArrowDown: [-1, 0],
    }
    if (e.key in moves) {
      e.preventDefault()
      const [ds, df] = moves[e.key]
      focus = {
        s: Math.min(STRINGS.length - 1, Math.max(0, s + ds)),
        fret: Math.min(FRETS, Math.max(0, fret + df)),
      }
      nodes[`${focus.s}-${focus.fret}`]?.focus()
    } else if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
      e.preventDefault()
      press(midi, key)
    }
  }
</script>

<svg
  viewBox="0 0 640 124"
  class="block h-auto w-full select-none"
  role="group"
  aria-label="Fretboard"
>
  <rect x="0" y="6" width="640" height="112" rx="8" fill="#1a1714" />
  <rect x={NUT - 6} y="6" width="6" height="112" fill="#d8d2c4" />
  <g stroke="#5d5850" stroke-width="2">
    {#each Array.from({ length: FRETS }, (_, i) => i + 1) as n (n)}
      <line x1={fretX(n)} y1="6" x2={fretX(n)} y2="118" />
    {/each}
  </g>
  <g fill="#3a3630">
    {#each markers as m (m)}
      <circle cx={(fretX(m - 1) + fretX(m)) / 2} cy="62" r="5" />
    {/each}
    <circle cx={(fretX(11) + fretX(12)) / 2} cy="35" r="5" />
    <circle cx={(fretX(11) + fretX(12)) / 2} cy="89" r="5" />
  </g>
  {#each STRINGS as str, s (str.name)}
    <line
      x1="0"
      y1={stringY(s)}
      x2="640"
      y2={stringY(s)}
      stroke="#b8b0a0"
      stroke-width={1.4 + s * 0.5}
    />
    <text
      x="8"
      y={stringY(s) + 4}
      font-size="11"
      fill="#8f99a3"
      style="font-family: var(--font-mono)">{str.name}</text
    >
  {/each}
  {#each cells as c (c.key)}
    <g
      class="cell"
      role="button"
      tabindex={focus.s === c.s && focus.fret === c.fret ? 0 : -1}
      aria-label={c.label}
      aria-pressed={lit === c.key}
      bind:this={nodes[c.key]}
      onpointerdown={(e) => {
        ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
        focus = { s: c.s, fret: c.fret }
        press(c.midi, c.key)
      }}
      onpointerup={release}
      onpointercancel={release}
      onkeydown={(e) => keydown(e, c.s, c.fret, c.midi, c.key)}
      onkeyup={(e) => (e.key === 'Enter' || e.key === ' ') && release()}
      onblur={release}
    >
      <rect x={c.x} y={stringY(c.s) - 13.5} width={c.w} height="27" fill="transparent" />
      {#if lit === c.key}
        <circle cx={c.cx} cy={stringY(c.s)} r="10" fill="var(--color-stage-osc)" />
        <text
          x={c.cx}
          y={stringY(c.s) + 3.5}
          font-size="9.5"
          text-anchor="middle"
          fill="#1a1206"
          style="font-family: var(--font-mono); font-weight: 600">{noteName(c.midi)}</text
        >
      {/if}
    </g>
  {/each}
</svg>

<style>
  .cell {
    cursor: pointer;
    outline: none;
    touch-action: none;
  }
  .cell:hover rect {
    fill: rgb(255 255 255 / 0.04);
  }
  .cell:focus-visible rect {
    fill: rgb(67 198 207 / 0.18);
    stroke: var(--color-stage-filter);
    stroke-width: 1.5;
  }
</style>
