/**
 * One shared requestAnimationFrame loop for every visual (PLAN §3). Visuals subscribe while
 * they have something live to draw; the loop stops when nobody is subscribed and pauses while
 * the tab is hidden.
 */
export type FrameCallback = (now: number) => void

export interface SchedulerHost {
  requestAnimationFrame(cb: (now: number) => void): number
  cancelAnimationFrame(id: number): void
  /** True while the page is hidden. */
  hidden(): boolean
  onVisibilityChange(cb: () => void): void
}

export class FrameScheduler {
  readonly #host: SchedulerHost
  readonly #callbacks = new Set<FrameCallback>()
  #frame: number | null = null

  constructor(host: SchedulerHost) {
    this.#host = host
    host.onVisibilityChange(() => this.#sync())
  }

  get running() {
    return this.#frame !== null
  }

  get size() {
    return this.#callbacks.size
  }

  /** Calls `cb` once per frame until the returned function is called. */
  add(cb: FrameCallback): () => void {
    this.#callbacks.add(cb)
    this.#sync()
    return () => {
      this.#callbacks.delete(cb)
      this.#sync()
    }
  }

  #sync() {
    const wanted = this.#callbacks.size > 0 && !this.#host.hidden()
    if (wanted && this.#frame === null) {
      this.#frame = this.#host.requestAnimationFrame(this.#tick)
    } else if (!wanted && this.#frame !== null) {
      this.#host.cancelAnimationFrame(this.#frame)
      this.#frame = null
    }
  }

  #tick = (now: number) => {
    this.#frame = null
    for (const cb of [...this.#callbacks]) {
      try {
        cb(now)
      } catch (e) {
        // One broken visual must not stop the others.
        console.error(e)
      }
    }
    this.#sync()
  }
}

const browserHost: SchedulerHost = {
  requestAnimationFrame: (cb) => requestAnimationFrame(cb),
  cancelAnimationFrame: (id) => cancelAnimationFrame(id),
  hidden: () => document.visibilityState === 'hidden',
  onVisibilityChange: (cb) => document.addEventListener('visibilitychange', cb),
}

let shared: FrameScheduler | null = null

/** The app-wide scheduler (created on first use, browser only). */
export function scheduler(): FrameScheduler {
  shared ??= new FrameScheduler(browserHost)
  return shared
}
