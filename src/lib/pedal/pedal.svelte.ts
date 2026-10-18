import type { KnobId } from './layout'
import {
  activeLayer,
  initialState,
  isModified,
  leds,
  needsTick,
  reduce,
  valueOf,
  type Button,
  type MachineEvent,
  type MachineState,
} from './machine'
import { paramAt, type Layer, type ParamDef } from './params'
import { bankOf, presetInfo, type Patch } from './presets'
import { browserStorage, loadPedal, savePedal } from './storage'

export type ControlId = KnobId | 'voice' | 'shape' | 'footswitch' | 'presets'

const TICK_MS = 100

export interface PedalStoreOptions {
  /** Where to remember live mode and saved presets. `null` disables persistence. */
  storage?: Storage | null
  now?: () => number
  /** A shared patch to start with (loaded into live mode). */
  patch?: Patch | null
}

/** Reactive wrapper around the pure pedal state machine (`machine.ts`). */
export class PedalStore {
  state = $state.raw<MachineState>(initialState())
  /** The control the user is pointing at or has focused, for the explanation card. */
  focused = $state<ControlId | null>(null)

  readonly #storage: Storage | null
  readonly #now: () => number
  #timer: ReturnType<typeof setInterval> | null = null

  constructor(options: PedalStoreOptions = {}) {
    this.#storage = options.storage === undefined ? browserStorage() : options.storage
    this.#now = options.now ?? (() => performance.now())
    const stored = loadPedal(this.#storage)
    if (stored) this.state = initialState(stored.saved, stored.globals)
    if (options.patch) this.dispatch({ type: 'load', patch: options.patch })
  }

  dispatch(event: MachineEvent) {
    const before = this.state
    const after = reduce(before, event, this.#now())
    this.state = after
    if (after.saved !== before.saved || after.globals !== before.globals) {
      savePedal(this.#storage, after.saved, after.globals)
    }
    this.#syncClock()
  }

  #syncClock() {
    const needed = needsTick(this.state)
    if (needed && !this.#timer) {
      this.#timer = setInterval(() => this.dispatch({ type: 'tick' }), TICK_MS)
    } else if (!needed && this.#timer) {
      clearInterval(this.#timer)
      this.#timer = null
    }
  }

  destroy() {
    if (this.#timer) clearInterval(this.#timer)
    this.#timer = null
  }

  // --- Convenience for components ---

  get layer(): Layer {
    return activeLayer(this.state)
  }

  /** The parameter a knob controls right now. */
  paramFor(knob: KnobId): ParamDef {
    return paramAt(knob, this.layer)
  }

  knobValue(knob: KnobId): number {
    return valueOf(this.state, this.paramFor(knob))
  }

  get leds() {
    return leds(this.state)
  }

  get modified(): boolean {
    return isModified(this.state)
  }

  get preset() {
    const n = this.state.preset
    return { number: n, info: presetInfo(n), bank: bankOf(n) }
  }

  turn = (knob: KnobId, value: number) => this.dispatch({ type: 'turn', knob, value })
  resetKnob = (knob: KnobId) => this.dispatch({ type: 'resetKnob', knob })
  down = (button: Button) => this.dispatch({ type: 'down', button })
  up = (button: Button) => this.dispatch({ type: 'up', button })
  setLayer = (layer: Layer) => this.dispatch({ type: 'setLayer', layer })
  select = (preset: number) => this.dispatch({ type: 'select', preset })
}
