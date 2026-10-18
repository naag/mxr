<script lang="ts">
  import { tick } from 'svelte'
  import RichText from '../lib/components/learn/RichText.svelte'
  import { buttonCopy, layerColors, paramCopy, stageColors } from '../lib/content/controls'
  import { glossary, glossaryById, glossaryCopy } from '../lib/content/glossary'
  import { referenceCopy } from '../lib/content/reference'
  import { views } from '../lib/content/site'
  import { CHAPTER_FOR_PARAM } from '../lib/learn/chapters'
  import { illustration, ILLUSTRATION_VIEW } from '../lib/learn/illustrations'
  import { KNOBS } from '../lib/pedal/layout'
  import { paramAt, type Layer } from '../lib/pedal/params'
  import { hrefFor } from '../lib/router'

  /** A glossary term to scroll to (`#/reference/cutoff`). */
  let { term = null }: { term?: string | null } = $props()

  const layers: Layer[] = ['main', 'voice', 'shape']
  const rows = (layer: Layer) =>
    KNOBS.map((k) => {
      const p = paramAt(k.id, layer)
      return { p, copy: paramCopy[p.id], chapter: CHAPTER_FOR_PARAM[p.id] }
    })
  const buttons = Object.entries(buttonCopy) as [
    keyof typeof buttonCopy,
    (typeof buttonCopy)[keyof typeof buttonCopy],
  ][]

  // In-page anchors would fight the hash router, so section links scroll instead.
  function jump(id: string) {
    document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }

  $effect(() => {
    if (!term || !glossaryById[term]) return
    void tick().then(() => {
      const el = document.getElementById(`term-${term}`)
      el?.scrollIntoView({ block: 'center' })
      el?.focus({ preventScroll: true })
    })
  })
</script>

<div class="flex flex-col gap-8">
  <section class="flex max-w-3xl flex-col gap-3">
    <span class="text-xs tracking-[0.1em] text-subtle uppercase">{views.reference.kicker}</span>
    <h1 class="m-0 text-3xl leading-tight font-[650] tracking-tight sm:text-4xl">
      {views.reference.title}
    </h1>
    <p class="m-0 text-base leading-relaxed text-[#b7c0c9] sm:text-lg">{views.reference.lede}</p>
    <nav aria-label={referenceCopy.onThisPage} class="flex flex-wrap gap-2 text-sm">
      {#each layers as layer (layer)}
        <button
          type="button"
          onclick={() => jump(`ref-${layer}`)}
          class="cursor-pointer rounded-full border border-line px-3 py-1.5 text-[#c9d1d9] hover:text-text"
          >{referenceCopy.layers[layer].title}</button
        >
      {/each}
      <button
        type="button"
        onclick={() => jump('ref-buttons')}
        class="cursor-pointer rounded-full border border-line px-3 py-1.5 text-[#c9d1d9] hover:text-text"
        >{referenceCopy.buttons}</button
      >
      <button
        type="button"
        onclick={() => jump('ref-glossary')}
        class="cursor-pointer rounded-full border border-line px-3 py-1.5 text-[#c9d1d9] hover:text-text"
        >{glossaryCopy.title}</button
      >
    </nav>
  </section>

  {#each layers as layer (layer)}
    <section
      id="ref-{layer}"
      aria-labelledby="ref-{layer}-title"
      class="flex scroll-mt-4 flex-col gap-3"
    >
      <div class="flex flex-col gap-1">
        <h2
          id="ref-{layer}-title"
          class="m-0 text-xl font-semibold"
          style:color={layer === 'main' ? undefined : layerColors[layer]}
        >
          {referenceCopy.layers[layer].title}
        </h2>
        <p class="m-0 max-w-3xl text-sm text-[#b7c0c9]">{referenceCopy.layers[layer].text}</p>
      </div>
      <ul class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3 p-0">
        {#each rows(layer) as r (r.p.id)}
          <li class="flex flex-col gap-1.5 rounded-2xl border border-line bg-surface px-4 py-3.5">
            <div class="flex items-center gap-2">
              <span
                class="size-2 rounded-full"
                style:background={stageColors[r.p.stage]}
                aria-hidden="true"
              ></span>
              <h3 class="m-0 text-[15px] font-semibold tracking-wide">{r.p.label}</h3>
              <span class="ml-auto font-mono text-[11.5px] text-subtle"
                >{referenceCopy.knob(paramAt(r.p.knob, 'main').label)}{r.p.global
                  ? ` · ${referenceCopy.global}`
                  : ''}</span
              >
            </div>
            <p class="m-0 text-sm leading-relaxed text-[#c9d1d9]">{r.copy.oneLiner}</p>
            {#if r.p.steps}
              <p class="m-0 font-mono text-xs text-muted">{r.p.steps.join(' · ')}</p>
            {:else if r.copy.left && r.copy.right}
              <p class="m-0 flex justify-between gap-3 text-xs text-subtle">
                <span>← {r.copy.left}</span><span>{r.copy.right} →</span>
              </p>
            {/if}
            <a
              href={hrefFor({ name: 'learn', chapter: r.chapter })}
              class="text-[13px] text-[#7fd8df]">{referenceCopy.learn(r.chapter)}</a
            >
          </li>
        {/each}
      </ul>
    </section>
  {/each}

  <section
    id="ref-buttons"
    aria-labelledby="ref-buttons-title"
    class="flex scroll-mt-4 flex-col gap-3"
  >
    <h2 id="ref-buttons-title" class="m-0 text-xl font-semibold">{referenceCopy.buttons}</h2>
    <ul class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3 p-0">
      {#each buttons as [id, b] (id)}
        <li class="flex flex-col gap-1.5 rounded-2xl border border-line bg-surface px-4 py-3.5">
          <h3 class="m-0 flex items-center gap-2 text-[15px] font-semibold tracking-wide">
            <span
              class="size-2 rounded-full"
              style:background={stageColors[b.stage]}
              aria-hidden="true"
            ></span>{b.label}
          </h3>
          <p class="m-0 text-sm leading-relaxed text-[#c9d1d9]">{b.oneLiner}</p>
        </li>
      {/each}
    </ul>
  </section>

  <section
    id="ref-glossary"
    aria-labelledby="ref-glossary-title"
    class="flex scroll-mt-4 flex-col gap-3"
  >
    <div class="flex flex-col gap-1">
      <h2 id="ref-glossary-title" class="m-0 text-xl font-semibold">{glossaryCopy.title}</h2>
      <p class="m-0 text-sm text-[#b7c0c9]">{glossaryCopy.lede}</p>
    </div>
    <dl class="m-0 grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3">
      {#each glossary as g (g.id)}
        <div
          id="term-{g.id}"
          tabindex="-1"
          data-term={g.id}
          data-current={term === g.id}
          class={[
            'flex scroll-mt-4 flex-col gap-2 rounded-2xl border bg-surface px-4 py-3.5 outline-none',
            term === g.id ? 'border-stage-filter' : 'border-line',
          ]}
        >
          <dt class="flex items-start gap-3 text-[15px] font-semibold">
            <span class="flex-1">{g.term}</span>
            {#if g.illustration}
              <svg
                viewBox="0 0 {ILLUSTRATION_VIEW.width} {ILLUSTRATION_VIEW.height}"
                class="h-10 w-[100px] shrink-0 rounded-md bg-[#0b0e12]"
                aria-hidden="true"
              >
                {#each illustration(g.illustration) as path, i (i)}
                  <path
                    d={path.d}
                    fill="none"
                    stroke={path.tone === 'main'
                      ? 'var(--color-stage-filter)'
                      : 'var(--color-marker)'}
                    stroke-width={path.tone === 'main' ? 1.8 : 1.2}
                    stroke-linejoin="round"
                  />
                {/each}
              </svg>
            {/if}
          </dt>
          <dd class="m-0 flex flex-col gap-1.5 text-sm leading-relaxed text-[#c9d1d9]">
            <span><RichText text={g.definition} /></span>
            {#if g.related?.length}
              <span class="text-xs text-subtle"
                >{glossaryCopy.related}
                {#each g.related as r, i (r)}<a
                    href={hrefFor({ name: 'reference', item: r })}
                    class="text-[#7fd8df] underline decoration-dotted underline-offset-2"
                    >{glossaryById[r].term}</a
                  >{i < g.related.length - 1 ? ', ' : ''}{/each}</span
              >
            {/if}
            {#if g.chapter !== undefined}
              <a
                href={hrefFor({ name: 'learn', chapter: g.chapter })}
                class="text-[13px] text-[#7fd8df]">{glossaryCopy.see(g.chapter)}</a
              >
            {/if}
          </dd>
        </div>
      {/each}
    </dl>
  </section>
</div>
