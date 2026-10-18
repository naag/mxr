/**
 * Keeps the computed snapshot (see computed.ts) in step with the pedal. Requests are
 * debounced (PLAN §5.5: about 30 ms) and coalesced: while the worker renders, only the
 * newest request waits. Without Worker support it renders on the main thread instead.
 */
import { computeSnapshot, type Snapshot } from './computed'
import type { SnapshotRequest, SnapshotResponse } from './offline.worker'

const DEBOUNCE_MS = 30

type Input = Omit<SnapshotRequest, 'id'>

export class ComputedViz {
  snapshot = $state.raw<Snapshot | null>(null)
  #worker: Worker | null | undefined
  #id = 0
  #busy = false
  #queued: Input | null = null
  #inflight: Input | null = null
  #lastKey = ''
  #timer: ReturnType<typeof setTimeout> | null = null

  request(input: Input) {
    const key = JSON.stringify(input.settings) + input.riff.id + input.bpm
    if (key === this.#lastKey) return
    this.#lastKey = key
    // Snapshot plain data now: callers may hand in reactive state.
    this.#queued = $state.snapshot(input) as Input
    if (this.#timer) clearTimeout(this.#timer)
    this.#timer = setTimeout(() => {
      this.#timer = null
      this.#pump()
    }, DEBOUNCE_MS)
  }

  #pump() {
    if (this.#busy || !this.#queued) return
    const input = this.#queued
    this.#queued = null
    const worker = this.#getWorker()
    if (!worker) {
      this.snapshot = computeSnapshot(input.settings, input.riff, input.bpm)
      return
    }
    this.#busy = true
    this.#inflight = input
    worker.postMessage({ id: ++this.#id, ...input } satisfies SnapshotRequest)
  }

  #getWorker(): Worker | null {
    if (this.#worker !== undefined) return this.#worker
    try {
      // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a one-off module URL, not state
      const w = new Worker(new URL('./offline.worker.ts', import.meta.url), { type: 'module' })
      w.onmessage = (e: MessageEvent<SnapshotResponse>) => {
        this.#busy = false
        if (e.data.id === this.#id) this.snapshot = e.data.snapshot
        this.#pump()
      }
      w.onerror = () => {
        // Fall back to rendering here if the worker can't run.
        w.terminate()
        this.#worker = null
        this.#busy = false
        this.#queued ??= this.#inflight
        this.#pump()
      }
      this.#worker = w
    } catch {
      this.#worker = null
    }
    return this.#worker
  }
}
