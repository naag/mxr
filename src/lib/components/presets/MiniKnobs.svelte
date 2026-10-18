<script lang="ts">
  import { angleFor } from '../../pedal/knob'
  import { KNOBS } from '../../pedal/layout'
  import { PARAM, describe } from '../../pedal/params'
  import type { Patch } from '../../pedal/presets'

  /** The six printed knobs of a patch at a glance, for recipe cards. */
  let { patch, label }: { patch: Patch; label: string } = $props()

  const knobs = $derived(
    KNOBS.map((k) => {
      const p = PARAM[k.id]
      const v = patch.values[k.id]
      return {
        id: k.id,
        color: k.color,
        label: p.label,
        angle: angleFor(v),
        text: describe(k.id, v),
      }
    }),
  )
</script>

<ul class="m-0 grid list-none grid-cols-3 gap-x-2 gap-y-2.5 p-0" aria-label={label}>
  {#each knobs as k (k.id)}
    <li class="flex items-center gap-2" aria-label="{k.label}: {k.text}">
      <svg viewBox="-20 -20 40 40" width="30" height="30" aria-hidden="true" class="shrink-0">
        <circle
          r="16"
          fill={k.color === 'orange' ? 'var(--color-knob-orange)' : 'var(--color-knob-teal)'}
        />
        <circle r="16" fill="none" stroke="#000" stroke-opacity="0.25" />
        <g transform="rotate({k.angle})">
          <rect x="-1.6" y="-15" width="3.2" height="9" rx="1.6" fill="#fbfaf6" />
        </g>
      </svg>
      <span class="flex min-w-0 flex-col leading-tight">
        <span class="text-[10.5px] font-semibold tracking-[0.04em] text-muted">{k.label}</span>
        <span class="truncate font-mono text-[11px] text-[#c9d1d9]">{k.text.split(',')[0]}</span>
      </span>
    </li>
  {/each}
</ul>
