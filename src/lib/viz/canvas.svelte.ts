/**
 * A canvas that tracks its CSS size (scaled for devicePixelRatio) and whether it's on
 * screen, so visuals only draw what is visible.
 */
import type { Attachment } from 'svelte/attachments'

export class CanvasView {
  width = $state(0)
  height = $state(0)
  visible = $state(true)
  #canvas: HTMLCanvasElement | null = null
  #dpr = 1

  attach: Attachment<HTMLCanvasElement> = (node) => {
    this.#canvas = node
    const resize = () => {
      const rect = node.getBoundingClientRect()
      this.#dpr = window.devicePixelRatio || 1
      node.width = Math.max(1, Math.round(rect.width * this.#dpr))
      node.height = Math.max(1, Math.round(rect.height * this.#dpr))
      this.width = rect.width
      this.height = rect.height
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(node)
    let io: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((entries) => {
        this.visible = entries.some((e) => e.isIntersecting)
      })
      io.observe(node)
    }
    return () => {
      ro.disconnect()
      io?.disconnect()
      this.#canvas = null
    }
  }

  get size() {
    return { width: this.width, height: this.height }
  }

  /** The 2D context in CSS pixels, or null before the canvas has a size. */
  context(): CanvasRenderingContext2D | null {
    const ctx = this.#canvas?.getContext('2d')
    if (!ctx || this.width <= 0) return null
    ctx.setTransform(this.#dpr, 0, 0, this.#dpr, 0, 0)
    return ctx
  }
}

/** Reads a color token from the theme (canvas can't use CSS variables directly). */
export function token(name: string): string {
  if (typeof document === 'undefined') return '#888'
  return (
    getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim() || '#888'
  )
}
