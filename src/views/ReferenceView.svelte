<script lang="ts">
  import { tick } from 'svelte'
  import { paramCopy } from '../lib/content/controls'
  import { GLOSSARY, glossaryCopy } from '../lib/content/glossary'
  import { chapterCopy } from '../lib/content/learn'
  import { views } from '../lib/content/site'
  import GlossaryArt from '../lib/learn/GlossaryArt.svelte'
  import { PARAM, PARAMS, type Layer, type ParamId } from '../lib/pedal/params'
  import { hrefFor } from '../lib/router'

  let { term }: { term?: string } = $props()

  const layers: Layer[] = ['main', 'voice', 'shape']
  const knobName: Record<string, string> = {
    mix: 'MIX',
    cutoff: 'CUTOFF',
    envelope: 'ENVELOPE',
    sub: 'SUB MIX',
    resonance: 'RESONANCE',
    mod: 'MOD',
  }
  const controlLabel = (c: string) => (c in PARAM ? PARAM[c as ParamId].label : c.toUpperCase())

  // Deep links (#/reference/cutoff) scroll to the entry.
  $effect(() => {
    const t = term
    if (!t) return
    tick().then(() => {
      const el = document.getElementById(`term-${t}`)
      el?.scrollIntoView({ block: 'center' })
      el?.focus({ preventScroll: true })
    })
  })
</script>

<div class="flex flex-col gap-10">
  <header class="flex max-w-3xl flex-col gap-2">
    <span class="text-xs tracking-[0.1em] text-subtle uppercase">{views.reference.kicker}</span>
    <h1 class="m-0 text-3xl leading-tight font-[650] tracking-tight">{views.reference.title}</h1>
    <p class="m-0 text-base leading-relaxed text-[#b7c0c9]">{views.reference.lede}</p>
  </header>

  <section aria-labelledby="controls-title" class="flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <h2 id="controls-title" class="m-0 text-xl font-[650]">{glossaryCopy.controlsTitle}</h2>
      <p class="m-0 text-sm text-muted">{glossaryCopy.controlsLede}</p>
    </div>
    <div class="grid gap-4 xl:grid-cols-3">
      {#each layers as layer (layer)}
        <div class="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table class="w-full border-collapse text-left text-[13.5px]">
            <caption class="px-4 pt-3 pb-1 text-left text-[13px] font-semibold text-[#cff3f5]"
              >{glossaryCopy.layers[layer]}</caption
            >
            <thead>
              <tr class="text-[11.5px] tracking-[0.06em] text-subtle uppercase">
                <th scope="col" class="px-4 py-2 font-medium">{glossaryCopy.control}</th>
                <th scope="col" class="px-4 py-2 font-medium">{glossaryCopy.what}</th>
              </tr>
            </thead>
            <tbody>
              {#each PARAMS.filter((p) => p.layer === layer) as p (p.id)}
                <tr class="border-t border-line align-top">
                  <th scope="row" class="px-4 py-2.5 font-semibold whitespace-nowrap">
                    {p.label}
                    {#if layer !== 'main'}<span
                        class="block font-mono text-[11px] font-normal text-subtle"
                        >{glossaryCopy.knob}: {knobName[p.knob]}</span
                      >{/if}
                  </th>
                  <td class="px-4 py-2.5 text-[#c9d1d9]">
                    {paramCopy[p.id].oneLiner}
                    {#if paramCopy[p.id].left}<span class="mt-1 block text-xs text-subtle"
                        >{paramCopy[p.id].left} → {paramCopy[p.id].right}</span
                      >{/if}
                    {#if p.global}<span class="mt-1 block text-xs text-[#f7c77a]"
                        >{glossaryCopy.shared}</span
                      >{/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/each}
    </div>
  </section>

  <section aria-labelledby="glossary-title" class="flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <h2 id="glossary-title" class="m-0 text-xl font-[650]">{glossaryCopy.title}</h2>
      <p class="m-0 text-sm text-muted">{glossaryCopy.lede}</p>
    </div>
    <ul class="m-0 grid list-none gap-3 p-0 md:grid-cols-2 2xl:grid-cols-3">
      {#each GLOSSARY as g (g.id)}
        <li
          id="term-{g.id}"
          tabindex="-1"
          data-current={g.id === term}
          class={[
            'flex gap-4 rounded-2xl border bg-surface p-4 outline-none',
            g.id === term ? 'border-stage-filter' : 'border-line',
          ]}
        >
          {#if g.art}<GlossaryArt id={g.art} />{/if}
          <div class="flex min-w-0 flex-col gap-1">
            <h3 class="m-0 text-[15px] font-semibold">{g.term}</h3>
            <p class="m-0 text-[14px] leading-relaxed text-[#c9d1d9]">{g.def}</p>
            {#if g.chapter !== undefined || g.control}
              <p class="m-0 flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
                {#if g.chapter !== undefined}
                  <a
                    href={hrefFor({ name: 'learn', chapter: g.chapter })}
                    class="text-[#7fd8df] hover:text-[#b5ecf0]"
                    >{glossaryCopy.chapterLink(g.chapter, chapterCopy[g.chapter].title)}</a
                  >
                {/if}
                {#if g.control}
                  <span class="text-subtle"
                    >{glossaryCopy.onPedal}
                    <span class="font-mono text-xs text-[#c9d1d9]">{controlLabel(g.control)}</span
                    ></span
                  >
                {/if}
              </p>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  </section>
</div>
