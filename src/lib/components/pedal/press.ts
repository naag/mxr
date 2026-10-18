import type { Attachment } from 'svelte/attachments'

export interface PressHandlers {
  ondown: () => void
  onup: () => void
  /** Called with true when pointed at or focused, false when left. */
  onactive?: (active: boolean) => void
  /** Notified when the visual pressed state changes. */
  onpressed?: (pressed: boolean) => void
}

/**
 * Press-and-release behavior for pedal buttons. Pointer and keyboard (Enter, Space) both
 * report a down and an up, so the state machine can tell a tap from a hold. Losing focus
 * or the pointer releases a held button, so it can't get stuck.
 */
export function pressable(get: () => PressHandlers): Attachment<SVGElement> {
  return (node) => {
    let down = false
    const press = () => {
      if (down) return
      down = true
      get().onpressed?.(true)
      get().ondown()
    }
    const release = () => {
      if (!down) return
      down = false
      get().onpressed?.(false)
      get().onup()
    }
    const listeners: [string, (e: Event) => void][] = [
      [
        'pointerdown',
        (e) => {
          const pe = e as PointerEvent
          if (pe.button !== 0) return
          node.setPointerCapture?.(pe.pointerId)
          pe.preventDefault()
          ;(node as SVGElement & HTMLOrSVGElement).focus?.({ preventScroll: true })
          press()
        },
      ],
      ['pointerup', release],
      ['pointercancel', release],
      [
        'keydown',
        (e) => {
          const ke = e as KeyboardEvent
          if (ke.key !== 'Enter' && ke.key !== ' ') return
          ke.preventDefault()
          if (!ke.repeat) press()
        },
      ],
      [
        'keyup',
        (e) => {
          const ke = e as KeyboardEvent
          if (ke.key === 'Enter' || ke.key === ' ') release()
        },
      ],
      [
        'blur',
        () => {
          release()
          get().onactive?.(false)
        },
      ],
      ['focus', () => get().onactive?.(true)],
      ['pointerenter', () => get().onactive?.(true)],
      [
        'pointerleave',
        () => {
          if (!down) get().onactive?.(false)
        },
      ],
    ]
    for (const [type, fn] of listeners) node.addEventListener(type, fn)
    return () => {
      for (const [type, fn] of listeners) node.removeEventListener(type, fn)
    }
  }
}
