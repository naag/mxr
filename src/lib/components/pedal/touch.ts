import type { Attachment } from 'svelte/attachments'

/**
 * Keeps a touch that starts on this element from scrolling the page. CSS `touch-action: none`
 * would be the clean way, but browsers ignore it on SVG child elements (the knobs are `<g>`s),
 * so the browser starts scrolling and cancels the drag. Cancelling `touchmove` in a non-passive
 * listener stops that, while taps (and so click and double-click) still work.
 */
export const noTouchScroll: Attachment<Element> = (node) => {
  const stop = (e: Event) => {
    if (e.cancelable) e.preventDefault()
  }
  node.addEventListener('touchmove', stop, { passive: false })
  return () => node.removeEventListener('touchmove', stop)
}

/** Two taps this close together (ms, px) count as a double tap. */
export const DOUBLE_TAP_MS = 350
export const DOUBLE_TAP_PX = 24

/**
 * Double-tap detection for touch and pen, where `dblclick` is unreliable (iOS) or swallowed
 * once the drag handling cancels touches. Pure, so it's unit-tested.
 */
export class DoubleTap {
  #last: { t: number; x: number; y: number } | null = null

  /** Call on each tap (a press released without dragging); true on the second of a pair. */
  tap(t: number, x: number, y: number): boolean {
    const last = this.#last
    const double =
      last !== null &&
      t - last.t <= DOUBLE_TAP_MS &&
      Math.hypot(x - last.x, y - last.y) <= DOUBLE_TAP_PX
    this.#last = double ? null : { t, x, y }
    return double
  }
}
