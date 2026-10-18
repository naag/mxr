<script lang="ts">
  import { learnCopy } from '../../content/learn'
  import { presetRecipes, recipeKeyLabel } from '../../content/presets'
  import { FACTORY_PRESETS, PRESET_INFO } from '../../pedal/presets'
  import { hrefFor } from '../../router'
  import { pedal } from '../../state.svelte'

  /** Chapter 13: each preset as a recipe, its key knobs tagged with the chapter behind them. */
  const cards = PRESET_INFO.map((info, i) => ({ ...info, number: i + 1, ...presetRecipes[i] }))
</script>

<ul
  class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3 p-0"
  data-testid="preset-recipes"
>
  {#each cards as card (card.code)}
    {@const current = pedal.state.preset === card.number}
    <li
      class={[
        'flex flex-col gap-2 rounded-2xl border bg-surface p-4',
        current ? 'border-[#2f7f86]' : 'border-line',
      ]}
    >
      <div class="flex items-center gap-2">
        <span
          class="size-2.5 rounded-full"
          style:background={card.number <= 4 ? 'var(--color-led-green)' : 'var(--color-led-red)'}
          aria-hidden="true"
        ></span>
        <span class="font-mono text-xs text-muted">{card.code}</span>
        <span class="text-[15px] font-semibold">{card.name}</span>
      </div>
      <span class="text-xs tracking-[0.06em] text-subtle uppercase">{card.era}</span>
      <p class="m-0 text-sm leading-normal text-[#c9d1d9]">{card.why}</p>
      <ul class="m-0 flex list-none flex-wrap gap-1.5 p-0">
        {#each card.keys as k (k.control)}
          <li>
            <a
              href={hrefFor({ name: 'learn', chapter: k.chapter })}
              class="inline-flex items-center gap-1 rounded-full border border-[#343d48] px-2 py-0.5 text-xs text-[#c9d1d9] no-underline hover:border-[#2f7f86]"
              >{recipeKeyLabel(k, FACTORY_PRESETS[card.number - 1])}
              <span class="text-subtle">→ {learnCopy.recipeChapter(k.chapter)}</span></a
            >
          </li>
        {/each}
      </ul>
      <button
        type="button"
        aria-pressed={current}
        onclick={() => pedal.select(card.number)}
        class="mt-auto min-h-10 cursor-pointer rounded-[10px] border border-line bg-raised px-3 text-[13px] font-medium hover:text-text"
        >{learnCopy.recipeLoad(card.code, card.name)}</button
      >
    </li>
  {/each}
</ul>
