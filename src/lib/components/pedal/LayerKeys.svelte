<script lang="ts">
  import type { Button } from '../../pedal/machine'
  import type { PedalStore } from '../../pedal/pedal.svelte'

  let { pedal }: { pedal: PedalStore } = $props()

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
