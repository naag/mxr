<script lang="ts">
  import { untrack } from 'svelte'
  import ControlCaption from '../lib/components/pedal/ControlCaption.svelte'
  import LayerKeys from '../lib/components/pedal/LayerKeys.svelte'
  import LayerToggle from '../lib/components/pedal/LayerToggle.svelte'
  import Pedal from '../lib/components/pedal/Pedal.svelte'
  import { chapterCopy, learnCopy } from '../lib/content/learn'
  import AdditiveDemo from '../lib/learn/AdditiveDemo.svelte'
  import { CHAPTERS, setupPatch } from '../lib/learn/chapters'
  import LfoWidget from '../lib/learn/LfoWidget.svelte'
  import { observe, startObservation } from '../lib/learn/observe'
  import Pipeline from '../lib/learn/Pipeline.svelte'
  import { loadProgress, saveProgress } from '../lib/learn/progress'
  import RichText from '../lib/learn/RichText.svelte'
  import { browserStorage } from '../lib/pedal/storage'
  import { hrefFor, LAST_CHAPTER } from '../lib/router'
  import { audio, pedal, viz } from '../lib/state.svelte'
  import EnvelopeGraph from '../lib/viz/EnvelopeGraph.svelte'
  import LevelMeter from '../lib/viz/LevelMeter.svelte'
  import PitchGraph from '../lib/viz/PitchGraph.svelte'
  import Scope from '../lib/viz/Scope.svelte'
  import SignalChain from '../lib/viz/SignalChain.svelte'
  import Spectrum from '../lib/viz/Spectrum.svelte'

  let { chapter }: { chapter: number } = $props()

  const storage = browserStorage()
  const def = $derived(CHAPTERS[chapter])
  const copy = $derived(chapterCopy[chapter])

  let doneChapters = $state<number[]>(loadProgress(storage))
  let obs = $state.raw(startObservation(pedal.state))
  /** Steps stay ticked once reached, even if the knob moves on. */
  let ticked = $state<boolean[]>([])

  function restart() {
    obs = startObservation(pedal.state)
    ticked = def.steps.map(() => false)
  }

  // New chapter: fresh experiment, and point the visuals where the chapter looks.
  $effect(() => {
    const d = def
    untrack(() => {
      restart()
      if (d.scopeTap) viz.setTap(d.scopeTap)
      viz.setLayers(d.scopeLayers ?? false)
      if (audio.riffId !== d.riff && !audio.playing) audio.setRiff(d.riff)
    })
  })

  // Watch what the learner does and tick the steps it completes.
  $effect(() => {
    const state = pedal.state
    const note = audio.telemetry?.note ?? null
    untrack(() => {
      obs = observe(obs, state, note)
      const ctx = { state, obs }
      const next = def.steps.map((check, i) => ticked[i] || check(ctx))
      if (next.some((v, i) => v !== ticked[i])) ticked = next
      if (next.every(Boolean) && !doneChapters.includes(chapter)) {
        doneChapters = [...doneChapters, chapter]
        saveProgress(storage, doneChapters)
      }
    })
  })

  const complete = $derived(ticked.length > 0 && ticked.every(Boolean))
  const canGoOn = $derived(complete || doneChapters.includes(chapter))

  async function setUp() {
    pedal.dispatch({ type: 'load', patch: setupPatch(def, pedal.state.current) })
    audio.setSource(def.source ?? 'riff')
    if (audio.riffId !== def.riff) audio.setRiff(def.riff)
    restart()
    if ((def.source ?? 'riff') === 'riff') await audio.play()
    else await audio.start()
  }

  const prev = $derived(chapter > 0 ? chapter - 1 : null)
  const next = $derived(chapter < LAST_CHAPTER ? chapter + 1 : null)
  const cards = $derived([
    { label: learnCopy.hear, text: copy.hear, color: 'var(--color-stage-osc)' },
    { label: learnCopy.see, text: copy.see, color: 'var(--color-stage-filter)' },
    { label: learnCopy.do, text: copy.do, color: 'var(--color-stage-dyn)' },
  ])
</script>

<LayerKeys {pedal} />

<div class="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
  <nav aria-label={learnCopy.chaptersLabel} class="flex flex-col gap-2">
    <p class="m-0 text-xs text-subtle" data-testid="learn-progress">
      {learnCopy.progress(doneChapters.length, CHAPTERS.length)}
    </p>
    <ol class="m-0 flex list-none flex-wrap gap-1 p-0 lg:flex-col">
      {#each chapterCopy as c, i (i)}
        <li>
          <a
            href={hrefFor({ name: 'learn', chapter: i })}
            aria-current={i === chapter ? 'page' : undefined}
            class={[
              'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] no-underline',
              i === chapter ? 'bg-raised font-semibold text-text' : 'text-muted hover:text-text',
            ]}
          >
            <span
              class={[
                'flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[10.5px]',
                doneChapters.includes(i)
                  ? 'bg-stage-dyn text-[#0d1014]'
                  : 'border border-[#3a4450] text-muted',
              ]}
              >{#if doneChapters.includes(i)}✓<span class="sr-only">({learnCopy.chapterDone})</span
                >{:else}{i}{/if}</span
            >
            <span class="lg:truncate">{c.title}</span>
          </a>
        </li>
      {/each}
    </ol>
  </nav>

  <article class="flex min-w-0 flex-col gap-6" data-chapter={chapter}>
    <header class="flex max-w-3xl flex-col gap-2">
      <span class="text-xs tracking-[0.1em] text-subtle uppercase"
        >{learnCopy.kicker(chapter, copy.topic)}</span
      >
      <h1 class="m-0 text-3xl leading-tight font-[650] tracking-tight">{copy.title}</h1>
      <p class="m-0 text-base leading-relaxed text-[#c9d1d9]"><RichText text={copy.intro} /></p>
    </header>

    <div class="grid gap-3 sm:grid-cols-3">
      {#each cards as card (card.label)}
        <div class="flex flex-col gap-1 rounded-2xl border border-line bg-surface px-4 py-3">
          <span class="text-[11.5px] font-semibold tracking-[0.08em]" style:color={card.color}
            >{card.label.toUpperCase()}</span
          >
          <span class="text-[14px] leading-relaxed text-[#d8dee4]"
            ><RichText text={card.text} /></span
          >
        </div>
      {/each}
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onclick={setUp}
        class="flex min-h-10 cursor-pointer items-center gap-2 rounded-full bg-stage-filter px-4 text-[13.5px] font-semibold text-[#071012]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
          ><path d="M7 4v16l13-8z" /></svg
        >{learnCopy.setup}</button
      >
      <span class="text-[13px] text-muted">{learnCopy.setupHint}</span>
    </div>

    <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <div class="mx-auto flex w-full max-w-[400px] flex-col items-center gap-3">
        <Pedal {pedal} focus={def.focus} />
        <LayerToggle {pedal} />
        <ControlCaption {pedal} />
        {#if def.focus.length}<p class="m-0 text-xs text-subtle">{learnCopy.focusHint}</p>{/if}
      </div>
      <div class="flex min-w-0 flex-col gap-4">
        {#each def.visuals as v (v)}
          {#if v === 'pipeline'}<Pipeline />
          {:else if v === 'chain'}<SignalChain />
          {:else if v === 'scope'}<Scope />
          {:else if v === 'spectrum'}<Spectrum />
          {:else if v === 'envelope'}<EnvelopeGraph />
          {:else if v === 'pitch'}<PitchGraph />
          {:else if v === 'meter'}<LevelMeter />
          {:else if v === 'additive'}<AdditiveDemo />
          {:else if v === 'lfo'}<LfoWidget />{/if}
        {/each}
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <section
        aria-labelledby="experiment-title"
        class="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-[18px]"
      >
        <h2 id="experiment-title" class="m-0 text-[15px] font-semibold">{learnCopy.experiment}</h2>
        <ol class="m-0 flex list-none flex-col gap-2.5 p-0" data-testid="steps">
          {#each copy.steps as step, i (i)}
            <li class="flex items-start gap-3" data-done={ticked[i] ?? false}>
              <span
                class={[
                  'mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full',
                  ticked[i] ? 'bg-stage-dyn' : 'border-2 border-[#3a4450]',
                ]}
                aria-hidden="true"
              >
                {#if ticked[i]}<svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0d1014"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"><path d="M5 12l5 5 9-10" /></svg
                  >{/if}
              </span>
              <span class="flex flex-col">
                <span class="text-[14.5px]">{step}</span>
                <span class={['text-xs', ticked[i] ? 'text-stage-dyn' : 'text-subtle']}
                  >{ticked[i] ? learnCopy.stepDone : learnCopy.stepTodo}</span
                >
              </span>
            </li>
          {/each}
        </ol>
      </section>
      <aside class="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-[18px]">
        {#if copy.analogy}
          <span class="text-[11.5px] tracking-[0.08em] text-subtle uppercase"
            >{learnCopy.analogy}</span
          >
          <p class="m-0 text-[14.5px] leading-relaxed text-[#d8dee4]">{copy.analogy}</p>
        {/if}
        {#if copy.more}
          <details class="rounded-[10px] border border-line bg-[#0d1115] px-3 py-2">
            <summary class="cursor-pointer text-[13.5px] font-semibold text-[#cff3f5]"
              >{copy.more.title}</summary
            >
            <p class="mt-2 mb-1 text-[14px] leading-relaxed text-[#c9d1d9]">
              <RichText text={copy.more.text} />
            </p>
          </details>
        {/if}
        {#if copy.honesty}
          <p class="m-0 text-[13.5px] text-muted">
            <strong class="text-[#f7c77a]">{learnCopy.honesty}</strong>
            {copy.honesty}
          </p>
        {/if}
      </aside>
    </div>

    <div
      class="flex items-start gap-3 rounded-2xl border border-[#2c5a5e] bg-[rgba(67,198,207,0.06)] p-4"
    >
      <p class="m-0 text-[15px] leading-relaxed">
        <strong class="text-[#7fd8df]">{learnCopy.takeaway}</strong>
        <RichText text={copy.takeaway} />
      </p>
    </div>

    <nav aria-label="Chapter navigation" class="flex flex-wrap items-center justify-between gap-3">
      {#if prev !== null}
        <a
          href={hrefFor({ name: 'learn', chapter: prev })}
          class="flex min-h-10 items-center rounded-full border border-[#2a313a] bg-raised px-4 text-[13.5px] text-text no-underline"
          >← {learnCopy.previous(chapterCopy[prev].title)}</a
        >
      {:else}<span></span>{/if}
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-[13px] text-muted" aria-live="polite"
          >{canGoOn ? learnCopy.nextReady : learnCopy.nextLocked}</span
        >
        {#if canGoOn}
          <a
            href={next !== null
              ? hrefFor({ name: 'learn', chapter: next })
              : hrefFor({ name: 'presets' })}
            class="flex min-h-10 items-center rounded-full bg-stage-dyn px-4 text-[13.5px] font-semibold text-[#0d1014] no-underline"
            >{next !== null ? learnCopy.next(chapterCopy[next].title) : learnCopy.finish} →</a
          >
        {:else}
          <button
            type="button"
            disabled
            class="min-h-10 rounded-full border border-[#2a313a] px-4 text-[13.5px] text-muted opacity-60"
            >{next !== null ? learnCopy.next(chapterCopy[next].title) : learnCopy.finish} →</button
          >
        {/if}
      </div>
    </nav>
  </article>
</div>
