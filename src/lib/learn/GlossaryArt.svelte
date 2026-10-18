<script lang="ts">
  import { art, ART_H, ART_W, type ArtId } from './art'

  let { id }: { id: ArtId } = $props()
  const paths = $derived(art(id))
</script>

<svg
  viewBox="0 0 {ART_W} {ART_H}"
  width={ART_W}
  height={ART_H}
  class="block shrink-0 rounded-lg border border-line bg-[#0d1115]"
  aria-hidden="true"
>
  {#each paths as p, i (i)}
    <path
      d={p.d}
      fill={p.tone === 'fill' ? 'var(--color-stage-mod)' : 'none'}
      stroke={p.tone === 'fill' ? 'none' : 'var(--color-stage-filter)'}
      stroke-opacity={p.tone === 'soft' ? 0.35 : 1}
      stroke-width="2"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
  {/each}
</svg>
