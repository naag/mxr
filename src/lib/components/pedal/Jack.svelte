<script lang="ts">
  import { url, type DefIds } from './defs'

  interface Props {
    side: 'left' | 'right'
    y: number
    info: string
    ids: DefIds
  }

  let { side, y, info, ids }: Props = $props()
  const x = $derived(side === 'left' ? -22 : 718)
  const tipX = $derived(side === 'left' ? -30 : 754)
</script>

<g class="jack">
  <title>{info}</title>
  <rect {x} {y} width="40" height="60" rx="7" fill={url(ids.chromeV)} />
  <rect x={tipX} y={y + 11} width="12" height="38" rx="3" fill="#596067" />
</g>
