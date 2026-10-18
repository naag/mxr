<script lang="ts">
  import { MAX_BPM, MIN_BPM, type Source } from '../../audio/audio.svelte'
  import { noteForKey, noteName } from '../../audio/notes'
  import { RIFFS } from '../../audio/riffs'
  import { audioCopy } from '../../content/audio'
  import { audio } from '../../state.svelte'
  import Fretboard from './Fretboard.svelte'

  const sources: Source[] = ['riff', 'fretboard', 'keyboard']
  const note = $derived(audio.telemetry?.note ?? null)
  const ios =
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

  // Which note keys are down; bookkeeping only, nothing renders from it.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const held = new Set<string>()
  const typing = (t: EventTarget | null) =>
    t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))

  function keydown(e: KeyboardEvent) {
    if (audio.source !== 'keyboard' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
    if (typing(e.target)) return
    const midi = noteForKey(e.code)
    if (midi === null) return
    e.preventDefault()
    held.add(e.code)
    audio.noteOn(midi)
  }
  function keyup(e: KeyboardEvent) {
    const midi = noteForKey(e.code)
    if (midi === null || !held.delete(e.code)) return
    audio.noteOff(midi)
  }
</script>

<svelte:window onkeydown={keydown} onkeyup={keyup} />

<section
  aria-label={audioCopy.sourceLabel}
  class="z-10 border-t border-[#1b2229] bg-[#0f1318]/95 backdrop-blur sm:sticky sm:bottom-0"
>
  <div class="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-3 sm:px-7">
    <div class="flex flex-wrap items-center gap-x-5 gap-y-3">
      <div
        role="group"
        aria-label={audioCopy.sourceLabel}
        class="flex gap-0.5 rounded-[10px] border border-line bg-[#0d1115] p-[3px]"
      >
        {#each sources as s (s)}
          <button
            type="button"
            aria-pressed={audio.source === s}
            onclick={() => audio.setSource(s)}
            class={[
              'min-h-[34px] cursor-pointer rounded-[7px] px-3 text-[13px]',
              audio.source === s
                ? 'bg-[rgba(242,169,59,0.16)] font-semibold text-[#f7c77a]'
                : 'text-muted hover:text-text',
            ]}>{audioCopy.sources[s]}</button
          >
        {/each}
      </div>

      {#if audio.source === 'riff'}
        <button
          type="button"
          aria-label={audio.playing ? audioCopy.stop : audioCopy.play}
          onclick={() => (audio.playing ? audio.stop() : audio.play())}
          class="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-stage-osc text-[#1a1206]"
        >
          {#if audio.playing}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
              ><rect x="6" y="5" width="4" height="14" rx="1" /><rect
                x="14"
                y="5"
                width="4"
                height="14"
                rx="1"
              /></svg
            >
          {:else}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
              ><path d="M7 4v16l13-8z" /></svg
            >
          {/if}
        </button>
        <label class="flex min-w-0 items-center gap-2 text-[13px] text-muted">
          {audioCopy.riff}
          <select
            value={audio.riffId}
            onchange={(e) => audio.setRiff(e.currentTarget.value)}
            class="min-h-[38px] min-w-0 rounded-[9px] border border-[#2a313a] bg-raised px-2.5 text-[13.5px] text-text"
          >
            {#each RIFFS as r (r.id)}
              <option value={r.id}>{r.name}</option>
            {/each}
          </select>
        </label>
        <span class="hidden text-[12.5px] text-subtle lg:inline">{audio.riff.shows}</span>
        <div class="flex items-center gap-1.5 text-[13px] text-muted">
          <span>{audioCopy.tempo}</span>
          <button
            type="button"
            aria-label={audioCopy.slower}
            disabled={audio.bpm <= MIN_BPM}
            onclick={() => audio.setBpm(audio.bpm - 4)}
            class="size-8 cursor-pointer rounded-lg border border-[#2a313a] bg-raised text-base text-[#c9d1d9] disabled:opacity-40"
            >−</button
          >
          <span class="min-w-16 text-center font-mono text-text" data-testid="tempo"
            >{audio.bpm} BPM</span
          >
          <button
            type="button"
            aria-label={audioCopy.faster}
            disabled={audio.bpm >= MAX_BPM}
            onclick={() => audio.setBpm(audio.bpm + 4)}
            class="size-8 cursor-pointer rounded-lg border border-[#2a313a] bg-raised text-base text-[#c9d1d9] disabled:opacity-40"
            >+</button
          >
        </div>
      {:else}
        <p class="m-0 max-w-xl text-[12.5px] text-subtle">
          {audio.source === 'keyboard' ? audioCopy.keyboardHint : audioCopy.fretboardHint}
        </p>
      {/if}

      <p
        class="m-0 ml-auto font-mono text-[12.5px] text-[#c9d1d9]"
        aria-live="polite"
        data-testid="now-playing"
      >
        {note !== null ? `${audioCopy.nowPlaying} ${noteName(note)}` : ''}
      </p>
    </div>

    {#if audio.source === 'fretboard'}
      <div class="max-w-[720px]">
        <Fretboard
          active={note}
          onnoteon={(m) => audio.noteOn(m)}
          onnoteoff={(m) => audio.noteOff(m)}
        />
      </div>
    {/if}
    {#if ios && audio.status === 'running'}
      <p class="m-0 text-xs text-subtle">{audioCopy.iosHint}</p>
    {/if}
  </div>
</section>
