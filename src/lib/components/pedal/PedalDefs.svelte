<script lang="ts">
  import { SCALLOP_PATH, type DefIds } from './defs'

  let { ids }: { ids: DefIds } = $props()

  type Stop = [offset: number, color: string, opacity?: number]
  const radial = (stops: Stop[]) => stops

  const domeStops: Record<'orange' | 'teal', Stop[]> = {
    orange: [
      [0, '#FFB27A'],
      [0.5, '#F77A22'],
      [1, '#D05507'],
    ],
    teal: [
      [0, '#C2F1F4'],
      [0.5, '#70C7CF'],
      [1, '#47A0A9'],
    ],
  }
  const skirtStops: Record<'orange' | 'teal', Stop[]> = {
    orange: [
      [0, '#FF8C40'],
      [0.74, '#F26A10'],
      [1, '#B44705'],
    ],
    teal: [
      [0, '#8ED7DE'],
      [0.74, '#5BB5BE'],
      [1, '#3A8A93'],
    ],
  }
  const leds: [string, Stop[]][] = $derived([
    [
      ids.ledOff,
      radial([
        [0, '#4C555B'],
        [1, '#1C2326'],
      ]),
    ],
    [
      ids.ledFrost,
      radial([
        [0, '#DCDFD5'],
        [0.6, '#A6AA9E'],
        [1, '#6F7369'],
      ]),
    ],
    [
      ids.ledBlue,
      radial([
        [0, '#E6F8FF'],
        [0.45, '#49B9F0'],
        [1, '#0A5A8B'],
      ]),
    ],
    [
      ids.ledGreen,
      radial([
        [0, '#EDFFE8'],
        [0.5, '#5FD35A'],
        [1, '#2A7F28'],
      ]),
    ],
    [
      ids.ledAmber,
      radial([
        [0, '#FFF3D6'],
        [0.5, '#F2A51F'],
        [1, '#9E5E09'],
      ]),
    ],
    [
      ids.ledRed,
      radial([
        [0, '#FFDCDE'],
        [0.5, '#E5484D'],
        [1, '#85181E'],
      ]),
    ],
  ])
</script>

{#snippet stops(list: Stop[])}
  {#each list as [offset, color, opacity] (offset)}
    <stop {offset} stop-color={color} stop-opacity={opacity ?? 1} />
  {/each}
{/snippet}

<defs>
  <linearGradient id={ids.body} x1="0" y1="0" x2="1" y2="1">
    {@render stops([
      [0, '#4A4F56'],
      [0.45, '#3C4046'],
      [1, '#2C2F34'],
    ])}
  </linearGradient>
  <radialGradient id={ids.spot} cx="0.3" cy="0.14" r="0.8">
    {@render stops([
      [0, '#FFFFFF', 0.11],
      [1, '#FFFFFF', 0],
    ])}
  </radialGradient>
  <filter id={ids.grain} x="0" y="0" width="1" height="1">
    <feTurbulence
      type="fractalNoise"
      baseFrequency="0.9"
      numOctaves="2"
      stitchTiles="stitch"
      result="n"
    />
    <feColorMatrix in="n" type="saturate" values="0" result="g" />
    <feComponentTransfer in="g" result="a"
      ><feFuncA type="table" tableValues="0 0.18" /></feComponentTransfer
    >
    <feComposite in="a" in2="SourceGraphic" operator="in" />
  </filter>
  <filter id={ids.blur6} x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="6" />
  </filter>
  <filter id={ids.blur14} x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="14" />
  </filter>
  <filter id={ids.glow} x="-100%" y="-100%" width="300%" height="300%">
    <feGaussianBlur stdDeviation="9" />
  </filter>
  <radialGradient id={ids.orangeSkirt} cx="0.5" cy="0.5" r="0.5">
    {@render stops(skirtStops.orange)}
  </radialGradient>
  <radialGradient id={ids.orangeDome} cx="0.4" cy="0.32" r="0.75">
    {@render stops(domeStops.orange)}
  </radialGradient>
  <radialGradient id={ids.tealSkirt} cx="0.5" cy="0.5" r="0.5">
    {@render stops(skirtStops.teal)}
  </radialGradient>
  <radialGradient id={ids.tealDome} cx="0.4" cy="0.32" r="0.75">
    {@render stops(domeStops.teal)}
  </radialGradient>
  <linearGradient id={ids.light} x1="0.15" y1="0.1" x2="0.85" y2="0.9">
    {@render stops([
      [0, '#FFFFFF', 0.22],
      [0.5, '#FFFFFF', 0],
      [1, '#000000', 0.3],
    ])}
  </linearGradient>
  <radialGradient id={ids.spec} cx="0.5" cy="0.5" r="0.5">
    {@render stops([
      [0, '#FFFFFF', 0.7],
      [1, '#FFFFFF', 0],
    ])}
  </radialGradient>
  <radialGradient id={ids.cap} cx="0.4" cy="0.35" r="0.7">
    {@render stops([
      [0, '#F4F4F0'],
      [0.55, '#C8C9C4'],
      [1, '#989A94'],
    ])}
  </radialGradient>
  <linearGradient id={ids.chrome} x1="0" y1="0" x2="1" y2="1">
    {@render stops([
      [0, '#F5F6F7'],
      [0.3, '#A0A6AC'],
      [0.52, '#E8EBEE'],
      [0.76, '#6C727A'],
      [1, '#CDD1D6'],
    ])}
  </linearGradient>
  <linearGradient id={ids.chromeV} x1="0" y1="0" x2="0" y2="1">
    {@render stops([
      [0, '#DDE1E5'],
      [0.5, '#8A9096'],
      [1, '#C9CDD2'],
    ])}
  </linearGradient>
  <radialGradient id={ids.fsCap} cx="0.42" cy="0.38" r="0.7">
    {@render stops([
      [0, '#E6E9EC'],
      [0.6, '#ABB0B6'],
      [1, '#7B8188'],
    ])}
  </radialGradient>
  {#each leds as [id, list] (id)}
    <radialGradient {id} cx="0.4" cy="0.35" r="0.65">{@render stops(list)}</radialGradient>
  {/each}
  <path id={ids.scallop} d={SCALLOP_PATH} />
</defs>
