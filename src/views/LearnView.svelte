<script lang="ts">
  import AdditiveDemo from '../lib/components/learn/AdditiveDemo.svelte'
  import LfoWidget from '../lib/components/learn/LfoWidget.svelte'
  import MiniFlow from '../lib/components/learn/MiniFlow.svelte'
  import PresetRecipes from '../lib/components/learn/PresetRecipes.svelte'
  import RichText from '../lib/components/learn/RichText.svelte'
  import ControlCaption from '../lib/components/pedal/ControlCaption.svelte'
  import { holdKeyHandlers } from '../lib/components/pedal/hold-keys'
  import LayerToggle from '../lib/components/pedal/LayerToggle.svelte'
  import Pedal from '../lib/components/pedal/Pedal.svelte'
  import { chapterCopy, learnCopy } from '../lib/content/learn'
  import { riffById } from '../lib/audio/riffs'
  import { CHAPTERS, requiredSteps, setupPatch } from '../lib/learn/chapters'
  import { observe } from '../lib/learn/goals'
  import { learnProgress } from '../lib/learn/progress.svelte'
  import { hrefFor } from '../lib/router'
  import { audio, pedal, viz } from '../lib/state.svelte'
  import EnvelopeGraph from '../lib/viz/EnvelopeGraph.svelte'
  import LevelMeter from '../lib/viz/LevelMeter.svelte'
  import { knobsForViz, linksFor } from '../lib/viz/links'
  import { isLive } from '../lib/viz/live.svelte'
  import PitchGraph from '../lib/viz/PitchGraph.svelte'
  import Scope from '../lib/viz/Scope.svelte'
  import SignalFlow from '../lib/viz/SignalFlow.svelte'
  import { stagesForBlocks } from '../lib/viz/flow'
  import Spectrum from '../lib/viz/Spectrum.svelte'

  let { chapter }: { chapter: number } = $props()

  const progress = learnProgress()
  const keys = holdKeyHandlers(pedal)
  const def = $derived(CHAPTERS[chapter])
  const copy = $derived(chapterCopy[chapter])
  const total = CHAPTERS.length

  // Check the chapter's goals against whatever the pedal and the sound do right now.
  $effect(() => {
    const sound = {
      note: audio.status === 'running' ? (audio.telemetry?.note ?? null) : null,
      riff: audio.playing ? audio.riffId : null,
    }
    progress.observe(chapter, observe(pedal.state, sound))
  })

  const done = $derived(progress.steps[chapter])
  const required = $derived(requiredSteps(def))
  const complete = $derived(progress.isDone(chapter))
  const nextStep = $derived(copy.steps[Math.min(done, copy.steps.length - 1)])
  const setup = $derived(setupPatch(def))
  const riff = $derived(riffById(def.riff))
  const playingThis = $derived(audio.playing && audio.riffId === def.riff)
  const highlight = $derived(knobsForViz(viz.hovered, pedal.layer))
  const live = $derived(isLive())
  const lit = $derived(stagesForBlocks(linksFor(pedal.focused, pedal.layer).blocks))

  function playRiff() {
    if (playingThis) return audio.stop()
    if (audio.riffId !== def.riff) audio.setRiff(def.riff)
    audio.setSource('riff')
    void audio.play()
  }

  function applySetup() {
    if (!setup) return
    pedal.load(setup)
    if (audio.riffId !== def.riff) audio.setRiff(def.riff)
  }

  const cards = $derived([
    {
      id: 'hear',
      label: learnCopy.hear,
      text: copy.hear,
      color: 'var(--color-stage-osc)',
      icon: 'M3 14v-2a9 9 0 0 1 18 0v2M3 14h4v6H5a2 2 0 0 1-2-2v-4zM21 14h-4v6h2a2 2 0 0 0 2-2v-4z',
    },
    {
      id: 'see',
      label: learnCopy.see,
      text: copy.see,
      color: 'var(--color-stage-filter)',
      icon: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    },
    {
      id: 'do',
      label: learnCopy.do,
      text: copy.do,
      color: 'var(--color-stage-dyn)',
      icon: 'M9 11V6a2 2 0 1 1 4 0v5M13 10a2 2 0 1 1 4 0v3a7 7 0 0 1-7 7H9a5 5 0 0 1-5-5v-2a2 2 0 1 1 4 0',
    },
  ])
</script>

<svelte:window onkeydown={keys.keydown} onkeyup={keys.keyup} />

<div class="flex flex-wrap items-start gap-7">
  <nav
    aria-label={learnCopy.chaptersLabel}
    class="flex w-full min-w-0 flex-col gap-3.5 lg:sticky lg:top-4 lg:w-[260px] lg:shrink-0"
  >
    <div class="flex flex-col gap-2">
      <span class="text-xs tracking-[0.1em] text-subtle">{learnCopy.progress}</span>
      <div
        class="h-1.5 overflow-hidden rounded-full bg-[#1c232b]"
        role="progressbar"
        aria-label={learnCopy.progress}
        aria-valuemin="0"
        aria-valuemax={total}
        aria-valuenow={progress.doneCount}
      >
        <div
          class="h-full rounded-full bg-stage-filter transition-[width] duration-300"
          style:width="{(100 * progress.doneCount) / total}%"
        ></div>
      </div>
      <span class="text-[13px] text-muted" data-testid="learn-progress"
        >{learnCopy.progressText(progress.doneCount, total)}</span
      >
    </div>
    <ol class="m-0 flex list-none gap-0.5 p-0 max-lg:flex-wrap max-lg:gap-1.5 lg:flex-col">
      {#each chapterCopy as c, i (i)}
        {@const current = i === chapter}
        {@const finished = progress.isDone(i)}
        <li>
          <a
            href={hrefFor({ name: 'learn', chapter: i })}
            aria-current={current ? 'page' : undefined}
            data-done={finished}
            class={[
              'flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-sm no-underline max-lg:min-h-11 max-lg:px-1.5',
              current
                ? 'bg-[rgba(67,198,207,0.12)] font-semibold text-text'
                : finished
                  ? 'font-medium text-[#c9d1d9] hover:bg-raised'
                  : 'font-medium text-subtle hover:bg-raised hover:text-text',
            ]}
          >
            <span
              class={[
                'flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px]',
                current
                  ? 'border-stage-filter bg-stage-filter text-[#071012]'
                  : finished
                    ? 'border-[#2f7f86] bg-[rgba(67,198,207,0.16)] text-[#7fd8df]'
                    : 'border-[#2e3640]',
              ]}
              aria-hidden="true">{finished && !current ? '✓' : i}</span
            >
            <span class="max-lg:sr-only">{c.short}</span>
            {#if finished}<span class="sr-only">(done)</span>{/if}
          </a>
        </li>
      {/each}
    </ol>
  </nav>

  <div class="flex min-w-0 flex-[999_1_640px] flex-col gap-[22px]" data-chapter={chapter}>
    <div class="flex max-w-[820px] flex-col gap-2.5">
      <span class="text-xs tracking-[0.1em] text-[#7fd8df] uppercase"
        >{learnCopy.chapter(chapter)} · {copy.concept}</span
      >
      <h1 class="m-0 text-3xl leading-tight font-[650] tracking-tight sm:text-[38px]">
        {copy.title}
      </h1>
      <p class="m-0 text-[17px] leading-relaxed text-[#b7c0c9]"><RichText text={copy.intro} /></p>
    </div>

    <div class="flex flex-wrap gap-3">
      {#each cards as card (card.id)}
        <div
          class="flex flex-[1_1_220px] gap-3 rounded-[14px] border border-line bg-surface px-4 py-3.5"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke={card.color}
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="shrink-0"
            aria-hidden="true"><path d={card.icon} /></svg
          >
          <div>
            <div class="text-xs tracking-[0.08em] text-subtle">{card.label}</div>
            <div class="mt-0.5 text-[14.5px] leading-snug">{card.text}</div>
          </div>
        </div>
      {/each}
    </div>

    <div class="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onclick={playRiff}
        aria-pressed={playingThis}
        class="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#5c4a26] bg-[rgba(242,169,59,0.12)] px-4 text-sm font-semibold text-[#f7c77a]"
        >{playingThis ? learnCopy.stopRiff : learnCopy.playRiff(riff.name)}</button
      >
      {#if setup}
        <button
          type="button"
          onclick={applySetup}
          title={learnCopy.setupHint}
          class="min-h-11 cursor-pointer rounded-xl border border-line bg-raised px-4 text-sm font-medium hover:text-text"
          >{learnCopy.setup}</button
        >
        <span class="text-xs text-subtle">{learnCopy.setupHint}</span>
      {/if}
    </div>

    <div class="flex flex-wrap items-start gap-5">
      <section
        aria-label={learnCopy.pedal}
        class="mx-auto flex w-full max-w-[360px] flex-col items-center gap-3"
      >
        <div
          class="w-full rounded-3xl bg-[radial-gradient(ellipse_70%_55%_at_50%_42%,#1a2128_0%,transparent_72%)] py-1"
        >
          <Pedal {pedal} {highlight} focus={def.focus} />
        </div>
        {#if def.focus.length > 0}<p class="m-0 text-center text-xs text-subtle">
            {learnCopy.pedalHint}
          </p>{/if}
        <LayerToggle {pedal} />
        <ControlCaption {pedal} />
      </section>
      <div class="flex min-w-0 flex-[999_1_420px] flex-col gap-4">
        {#each def.visuals as visual (visual)}
          {#if visual === 'scope'}
            <Scope fixedTap="filter" />
          {:else if visual === 'scope-osc'}
            <Scope fixedTap="osc" />
          {:else if visual === 'scope-layers'}
            <Scope fixedTap="osc" fixedLayers />
          {:else if visual === 'scope-amp'}
            <Scope fixedTap="amp" />
          {:else if visual === 'scope-out'}
            <Scope fixedTap="out" />
          {:else if visual === 'spectrum'}
            <Spectrum />
          {:else if visual === 'envelope'}
            <EnvelopeGraph />
          {:else if visual === 'pitch'}
            <PitchGraph />
          {:else if visual === 'meter'}
            <LevelMeter />
          {:else if visual === 'additive'}
            <AdditiveDemo />
          {:else if visual === 'lfo'}
            <LfoWidget />
          {:else if visual === 'mini-flow'}
            <MiniFlow />
          {:else if visual === 'flow'}
            <div class="rounded-2xl border border-line bg-surface p-3">
              <SignalFlow compact {live} {lit} />
              <a href={hrefFor({ name: 'flow' })} class="mt-2 inline-block text-sm text-[#7fd8df]"
                >{learnCopy.flowLink} →</a
              >
            </div>
          {:else if visual === 'recipes'}
            <PresetRecipes />
          {/if}
        {/each}
      </div>
    </div>

    <div class="flex flex-wrap items-stretch gap-4">
      <section
        aria-labelledby="experiment-title"
        class="flex min-w-0 flex-[1_1_380px] flex-col gap-3 rounded-[18px] border border-line bg-surface px-5 py-[18px]"
      >
        <h2 id="experiment-title" class="m-0 text-[15px] font-semibold">{learnCopy.experiment}</h2>
        <ol class="m-0 flex list-none flex-col gap-2.5 p-0" data-testid="goal-steps">
          {#each copy.steps as s, i (i)}
            {@const ok = i < done}
            <li class="flex items-start gap-3" data-done={ok}>
              <span
                class={[
                  'flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px]',
                  ok ? 'border-stage-filter bg-stage-filter' : 'border-[#3a4450]',
                ]}
                aria-hidden="true"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0d1014"
                  stroke-width="3.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  opacity={ok ? 1 : 0}><path d="M5 12l5 5 9-10" /></svg
                >
              </span>
              <span class="flex flex-col gap-0.5">
                <span class={['text-[14.5px]', ok ? 'text-text' : 'text-[#c9d1d9]']}
                  >{s.text}{#if i >= required}<span class="ml-1 text-subtle"
                      >({learnCopy.optional})</span
                    >{/if}<span class="sr-only">{ok ? ' ✓' : ''}</span></span
                >
                <span class="text-[12.5px] text-subtle" aria-live="polite"
                  >{ok ? s.done : i === done ? learnCopy.stepNow : ''}</span
                >
              </span>
            </li>
          {/each}
        </ol>
      </section>
      {#if copy.analogy || copy.more}
        <aside
          class="flex min-w-0 flex-[1_1_300px] flex-col gap-2.5 rounded-[18px] border border-[#2b3540] px-5 py-[18px]"
        >
          {#if copy.analogy}
            <span class="text-xs tracking-[0.08em] text-stage-osc">{learnCopy.analogy}</span>
            <p class="m-0 text-[15px] leading-relaxed text-[#c9d1d9]">{copy.analogy}</p>
          {/if}
          {#if copy.more}
            <details class="mt-1 border-t border-line pt-2.5">
              <summary class="min-h-8 cursor-pointer text-sm font-semibold"
                >{copy.more.title}</summary
              >
              <p class="mt-2 mb-0 text-sm leading-relaxed text-[#b7c0c9]">
                <RichText text={copy.more.text} />
              </p>
            </details>
          {/if}
        </aside>
      {/if}
    </div>

    {#if copy.honesty}
      <div
        class="flex flex-col gap-1 rounded-2xl border border-dashed border-[#343d48] px-5 py-3.5"
      >
        <span class="text-xs tracking-[0.08em] text-subtle">{learnCopy.honesty}</span>
        <p class="m-0 text-sm leading-normal text-[#c9d1d9]">{copy.honesty}</p>
      </div>
    {/if}

    <div
      class="flex flex-wrap items-center gap-3 rounded-2xl border border-[#1f3a3d] bg-[#10181b] px-5 py-4"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-stage-filter)"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        ><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" /></svg
      >
      <p class="m-0 flex-[1_1_320px] text-[15px] leading-normal text-[#cfe9eb]">
        <strong class="text-text">{learnCopy.takeaway}</strong>
        <RichText text={copy.takeaway} />
      </p>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
      {#if chapter > 0}
        <a
          href={hrefFor({ name: 'learn', chapter: chapter - 1 })}
          class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#2a313a] bg-raised px-4 text-sm font-medium text-text no-underline"
          ><svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg
          >{learnCopy.previous(chapter - 1, chapterCopy[chapter - 1].short)}</a
        >
      {/if}
      <div class="ml-auto flex flex-wrap items-center gap-3">
        <span class="text-[13px] text-subtle" data-testid="next-hint"
          >{complete ? learnCopy.nextHintDone : learnCopy.nextHint(nextStep.text)}</span
        >
        {#if chapter < total - 1}
          {@const label = learnCopy.next(chapterCopy[chapter + 1].short)}
          {#if complete}
            <a
              href={hrefFor({ name: 'learn', chapter: chapter + 1 })}
              class="inline-flex min-h-11 items-center gap-2 rounded-xl bg-stage-filter px-[18px] text-sm font-[650] text-[#071012] no-underline"
              >{label}<svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg
              ></a
            >
          {:else}
            <button
              type="button"
              disabled
              class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#2a313a] bg-raised px-[18px] text-sm font-semibold text-[#6f7a86]"
              >{label}</button
            >
          {/if}
        {:else if complete}
          <a
            href={hrefFor({ name: 'play' })}
            class="inline-flex min-h-11 items-center rounded-xl bg-stage-filter px-[18px] text-sm font-[650] text-[#071012] no-underline"
            >{learnCopy.toPlay}</a
          >
        {/if}
      </div>
    </div>
  </div>
</div>
