<script lang="ts" generics="T extends string">
  interface Props {
    label: string
    options: readonly { value: T; label: string }[]
    value: T
    onchange: (value: T) => void
  }
  let { label, options, value, onchange }: Props = $props()
</script>

<div
  role="group"
  aria-label={label}
  class="flex gap-0.5 rounded-[10px] border border-line bg-[#0d1115] p-[3px]"
>
  {#each options as o (o.value)}
    <button
      type="button"
      aria-pressed={value === o.value}
      onclick={() => onchange(o.value)}
      class={[
        'min-h-[30px] cursor-pointer rounded-[7px] px-2.5 text-[12.5px]',
        value === o.value
          ? 'bg-[rgba(67,198,207,0.16)] font-semibold text-[#bdeff2]'
          : 'text-muted hover:text-text',
      ]}>{o.label}</button
    >
  {/each}
</div>
