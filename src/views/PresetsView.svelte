<script lang="ts">
  import { tick } from 'svelte'
  import { riffById } from '../lib/audio/riffs'
  import MiniKnobs from '../lib/components/presets/MiniKnobs.svelte'
  import { shapeNames } from '../lib/content/controls'
  import { presetRecipes, presetsCopy as copy, recipeKeyLabel } from '../lib/content/presets'
  import { views } from '../lib/content/site'
  import { PARAM } from '../lib/pedal/params'
  import { FACTORY_PRESETS, PRESET_INFO, toeChanges } from '../lib/pedal/presets'
  import { clockLabel } from '../lib/pedal/knob'
  import { hrefFor } from '../lib/router'
  import { audio, pedal } from '../lib/state.svelte'

  /** `#/presets/r2` opens with that card in view. */
  let { item = null }: { item?: string | null } = $props()

  const cards = PRESET_INFO.map((info, i) => {
    const patch = FACTORY_PRESETS[i]
    const recipe = presetRecipes[i]
    return {
      ...info,
      ...recipe,
      number: i + 1,
      slug: info.code.toLowerCase(),
      patch,
      riffName: riffById(recipe.riff).name,
      toe: toeChanges(patch).map((id) => ({
        label: PARAM[id].label,
        heel: clockLabel(patch.values[id]),
        toe: clockLabel(patch.toe![id]!),
      })),
    }
  })

  $effect(() => {
    if (!item) return
    void tick().then(() => {
      const el = document.getElementById(`preset-${item}`)
      el?.scrollIntoView({ block: 'start' })
      el?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
    })
  })

  async function listen(n: number, riff: string) {
    const playingThis = audio.playing && audio.riffId === riff && pedal.state.preset === n
    if (playingThis) {
      audio.stop()
      return
    }
    pedal.select(n)
    audio.setSource('riff')
    if (audio.riffId !== riff) audio.setRiff(riff)
    await audio.play()
  }
</script>

<div class="flex flex-col gap-6">
  <header class="flex max-w-3xl flex-col gap-1.5">
    <span class="text-xs font-semibold tracking-[0.12em] text-stage-osc uppercase"
      >{views.presets.kicker}</span
    >
    <h1 class="m-0 text-2xl leading-tight font-[650] tracking-tight">{views.presets.title}</h1>
    <p class="m-0 text-[15px] leading-normal text-[#b7c0c9]">{views.presets.lede}</p>
    <p class="m-0 text-[13px] text-subtle">{copy.draft}</p>
  </header>

  <ul
    class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,400px),1fr))] gap-4 p-0"
    aria-label={copy.galleryLabel}
    data-testid="preset-gallery"
  >
    {#each cards as card (card.code)}
      {@const current = pedal.state.preset === card.number}
      {@const playing = audio.playing && audio.riffId === card.riff && current}
      <li
        id="preset-{card.slug}"
        class={[
          'flex scroll-mt-6 flex-col gap-3.5 rounded-2xl border bg-surface p-5',
          current ? 'border-[#2f7f86]' : 'border-line',
        ]}
        aria-labelledby="preset-{card.slug}-title"
        data-current={current}
      >
        <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span
            class="size-3 rounded-full"
            style:background={card.number <= 4 ? 'var(--color-led-green)' : 'var(--color-led-red)'}
            style:box-shadow="0 0 8px {card.number <= 4
              ? 'var(--color-led-green)'
              : 'var(--color-led-red)'}"
            aria-hidden="true"
          ></span>
          <span class="font-mono text-xs text-muted"
            >{card.code} · {card.number <= 4 ? copy.bank.green : copy.bank.red}</span
          >
          <span class="ml-auto text-xs tracking-[0.06em] text-subtle uppercase">{card.era}</span>
          <h2
            id="preset-{card.slug}-title"
            tabindex="-1"
            class="m-0 w-full text-lg font-semibold tracking-tight outline-none"
          >
            {card.name}
            {#if current && pedal.modified}<span class="text-xs font-normal text-stage-osc">
                · {copy.edited}</span
              >{/if}
          </h2>
          <p class="m-0 w-full text-[13.5px] text-muted">
            <span class="text-subtle">{copy.inspiredBy}</span>
            {card.inspiration}
          </p>
        </div>

        <div class="flex flex-col gap-2 rounded-xl bg-[#0d1115] p-3">
          <span class="text-xs text-subtle"
            >{copy.shapeVoice(shapeNames[card.patch.shape], card.patch.voiceOn)}</span
          >
          <MiniKnobs patch={card.patch} label="{copy.knobs}: {card.name}" />
        </div>

        <div class="flex flex-col gap-1.5">
          <h3 class="m-0 text-[13px] font-semibold text-[#c9d1d9]">{copy.whyTitle}</h3>
          <p class="m-0 text-sm leading-relaxed text-[#c9d1d9]">{card.explain}</p>
        </div>

        <div class="flex flex-col gap-1.5">
          <h3 class="m-0 text-[13px] font-semibold text-[#c9d1d9]">{copy.ingredients}</h3>
          <ul class="m-0 flex list-none flex-wrap gap-1.5 p-0">
            {#each card.keys as k (k.control)}
              <li>
                <a
                  href={hrefFor({ name: 'learn', chapter: k.chapter })}
                  class="inline-flex min-h-8 items-center gap-1 rounded-full border border-[#343d48] px-2.5 text-xs text-[#c9d1d9] no-underline hover:border-[#2f7f86]"
                  >{recipeKeyLabel(k, card.patch)}
                  <span class="text-subtle">→ {copy.chapter(k.chapter)}</span></a
                >
              </li>
            {/each}
          </ul>
        </div>

        {#if card.expression}
          <div class="flex flex-col gap-1 rounded-xl border border-[#3a2a35] p-3">
            <h3 class="m-0 text-[13px] font-semibold text-stage-mod">{copy.expression}</h3>
            <p class="m-0 text-[13px] text-[#c9d1d9]">{card.expression}</p>
            <ul class="m-0 list-none p-0 font-mono text-xs text-muted">
              {#each card.toe as t (t.label)}
                <li>{t.label}: {t.heel} → {t.toe}</li>
              {/each}
            </ul>
          </div>
        {/if}

        <div class="mt-auto flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={current}
            onclick={() => pedal.select(card.number)}
            class="min-h-10 cursor-pointer rounded-[10px] border border-line bg-raised px-3.5 text-[13px] font-medium hover:text-text"
            >{copy.load(card.code, card.name)}</button
          >
          <button
            type="button"
            onclick={() => listen(card.number, card.riff)}
            class="min-h-10 cursor-pointer rounded-[10px] bg-[rgba(242,169,59,0.16)] px-3.5 text-[13px] font-semibold text-[#f7c77a]"
            >{playing ? copy.stop : copy.listen(card.riffName)}</button
          >
        </div>
      </li>
    {/each}
  </ul>
</div>
