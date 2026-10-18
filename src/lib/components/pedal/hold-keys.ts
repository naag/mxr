/** Hold V or S on the keyboard to reach the VOICE or SHAPE layer (PLAN §6). */
import type { Button } from '../../pedal/machine'
import type { PedalStore } from '../../pedal/pedal.svelte'

const holdKeys: Record<string, Button> = { v: 'voice', s: 'shape' }

const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))

/** `keydown` / `keyup` handlers for `<svelte:window>` in views that show the pedal. */
export function holdKeyHandlers(pedal: PedalStore) {
  return {
    keydown(e: KeyboardEvent) {
      const button = holdKeys[e.key.toLowerCase()]
      if (!button || e.repeat || e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return
      pedal.down(button)
    },
    keyup(e: KeyboardEvent) {
      const button = holdKeys[e.key.toLowerCase()]
      if (button) pedal.up(button)
    },
  }
}
