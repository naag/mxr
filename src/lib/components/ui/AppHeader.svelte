<script lang="ts">
  import { appName, appTagline, navItems } from '../../content/site'
  import type { Snippet } from 'svelte'
  import type { RouteName } from '../../router'
  import BrandMark from './BrandMark.svelte'

  let { current, end }: { current: RouteName; end?: Snippet } = $props()
</script>

<header
  class="flex flex-wrap items-center gap-x-7 gap-y-3 border-b border-[#1b2229] px-4 py-3.5 sm:px-7"
>
  <a href="#/" class="flex items-center gap-3 text-text no-underline">
    <BrandMark />
    <span class="flex flex-col">
      <span class="text-base font-[650] tracking-tight">{appName}</span>
      <span class="text-xs text-subtle">{appTagline}</span>
    </span>
  </a>
  <nav aria-label="Main" class="flex flex-wrap gap-1">
    {#each navItems as item (item.name)}
      <a
        href={item.href}
        aria-current={item.name === current ? 'page' : undefined}
        class={[
          'rounded-lg px-3 py-2 text-sm no-underline transition-colors',
          item.name === current
            ? 'bg-[#1a2129] font-semibold text-text'
            : 'font-medium text-muted hover:text-text',
        ]}>{item.label}</a
      >
    {/each}
  </nav>
  {#if end}
    <div class="ml-auto">{@render end()}</div>
  {/if}
</header>
