/** Settings shared by all visuals: Simple ⇄ Detailed, the scope's tap, and hover linking. */
import { browserStorage } from '../pedal/storage'
import type { ScopeTap } from './computed'
import { SCOPE_TAPS } from './computed'
import type { VizId } from './links'

const KEY = 'bass-synth-explorer/viz/v1'

interface Stored {
  detailed?: boolean
  tap?: string
  layers?: boolean
}

export class VizStore {
  detailed = $state(false)
  tap = $state<ScopeTap>('filter')
  /** Scope "layers" mode: main, sub, voices and noise drawn separately. */
  layers = $state(false)
  /** The visual the pointer is over, for highlighting its knobs on the pedal. */
  hovered = $state<VizId | null>(null)
  readonly #storage: Storage | null

  constructor(storage: Storage | null = browserStorage()) {
    this.#storage = storage
    try {
      const data = JSON.parse(storage?.getItem(KEY) ?? '{}') as Stored
      if (typeof data.detailed === 'boolean') this.detailed = data.detailed
      if (SCOPE_TAPS.includes(data.tap as ScopeTap)) this.tap = data.tap as ScopeTap
      if (typeof data.layers === 'boolean') this.layers = data.layers
    } catch {
      // Unreadable settings: keep the defaults.
    }
  }

  #save() {
    try {
      this.#storage?.setItem(
        KEY,
        JSON.stringify({ detailed: this.detailed, tap: this.tap, layers: this.layers }),
      )
    } catch {
      // Storage full or blocked: settings just won't stick.
    }
  }

  setDetailed(on: boolean) {
    this.detailed = on
    this.#save()
  }

  setTap(tap: ScopeTap) {
    this.tap = tap
    this.#save()
  }

  setLayers(on: boolean) {
    this.layers = on
    this.#save()
  }
}
