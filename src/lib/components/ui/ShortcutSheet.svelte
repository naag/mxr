<script lang="ts">
  import { shortcutsCopy as copy } from '../../content/shortcuts'

  /** Modal list of keyboard shortcuts (native `<dialog>`: focus trap and Escape for free). */
  let { open = $bindable(false) }: { open?: boolean } = $props()

  let dialog: HTMLDialogElement | undefined = $state()
  const uid = $props.id()

  $effect(() => {
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  })
</script>

<dialog
  bind:this={dialog}
  aria-labelledby="{uid}-title"
  onclose={() => (open = false)}
  onclick={(e) => e.target === dialog && dialog?.close()}
  class="m-auto w-[min(560px,calc(100%-32px))] rounded-2xl border border-line bg-surface p-0 text-text backdrop:bg-black/60"
>
  <div class="flex flex-col gap-4 p-5">
    <div class="flex items-center gap-3">
      <h2 id="{uid}-title" class="m-0 text-lg font-semibold">{copy.title}</h2>
      <button
        type="button"
        onclick={() => dialog?.close()}
        class="ml-auto min-h-10 cursor-pointer rounded-[9px] border border-line px-3 text-[13px] text-muted hover:text-text"
        >{copy.close}</button
      >
    </div>
    {#each copy.groups as group (group.title)}
      <section class="flex flex-col gap-1.5">
        <h3 class="m-0 text-[13px] font-semibold text-muted">{group.title}</h3>
        <dl class="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          {#each group.rows as row (row.text)}
            <dt class="flex flex-wrap gap-1">
              {#each row.keys as k (k)}<kbd
                  class="rounded-md border border-[#343d48] bg-raised px-1.5 py-0.5 font-mono text-xs"
                  >{k}</kbd
                >{/each}
            </dt>
            <dd class="m-0 text-sm text-[#c9d1d9]">{row.text}</dd>
          {/each}
        </dl>
      </section>
    {/each}
    <p class="m-0 text-xs text-subtle">{copy.note}</p>
  </div>
</dialog>
