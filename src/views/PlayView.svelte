<script lang="ts">
  import { onDestroy } from 'svelte'
  import ControlCaption from '../lib/components/pedal/ControlCaption.svelte'
  import LayerToggle from '../lib/components/pedal/LayerToggle.svelte'
  import Pedal from '../lib/components/pedal/Pedal.svelte'
  import PresetBar from '../lib/components/pedal/PresetBar.svelte'
  import ShareButton from '../lib/components/pedal/ShareButton.svelte'
  import ViewPlaceholder from '../lib/components/ui/ViewPlaceholder.svelte'
  import { views } from '../lib/content/site'
  import type { Button } from '../lib/pedal/machine'
  import { PedalStore } from '../lib/pedal/pedal.svelte'
  import { patchFromHash } from '../lib/pedal/share'

  const pedal = new PedalStore({ patch: patchFromHash(location.hash) })
  onDestroy(() => pedal.destroy())

  // Hold V or S on the keyboard to reach the VOICE or SHAPE layer.
  const holdKeys: Record<string, Button> = { v: 'voice', s: 'shape' }
  const typing = (t: EventTarget | null) =>
    t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))

  function keydown(e: KeyboardEvent) {
    const button = holdKeys[e.key.toLowerCase()]
    if (!button || e.repeat || e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return
    pedal.down(button)
  }
  function keyup(e: KeyboardEvent) {
    const button = holdKeys[e.key.toLowerCase()]
    if (button) pedal.up(button)
  }
</script>

<svelte:window onkeydown={keydown} onkeyup={keyup} />

<div class="flex flex-wrap items-start gap-8">
  <div class="mx-auto flex w-full max-w-[440px] flex-col items-center gap-4">
    <PresetBar {pedal} />
    <div
      class="w-full rounded-3xl bg-[radial-gradient(ellipse_70%_55%_at_50%_42%,#1a2128_0%,transparent_72%)] py-2"
    >
      <Pedal {pedal} />
    </div>
    <LayerToggle {pedal} />
    <ControlCaption {pedal} />
    <ShareButton {pedal} />
  </div>
  <div class="min-w-0 flex-[999_1_420px]">
    <ViewPlaceholder {...views.play} />
  </div>
</div>
