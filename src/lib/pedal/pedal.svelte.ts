import { clamp01 } from './knob'
import { DEFAULT_KNOBS, type KnobId } from './layout'

export type Shape = 'triangle' | 'saw' | 'square'
export const SHAPES: Shape[] = ['triangle', 'saw', 'square']

export type ControlId = KnobId | 'voice' | 'shape' | 'footswitch' | 'presets'

/** Number of factory presets; preset 0 is live mode. */
export const PRESET_COUNT = 8

/**
 * Front-panel state for Phase 1 (visual and interaction only). Phase 2 replaces the
 * knob record and the PRESETS behavior with the full parameter model and state machine.
 */
export class PedalState {
  knobs = $state<Record<KnobId, number>>({ ...DEFAULT_KNOBS })
  shape = $state<Shape>('saw')
  voiceOn = $state(false)
  engaged = $state(true)
  /** 0 = live mode, 1–4 = green bank, 5–8 = red bank. */
  preset = $state(0)
  /** The control the user is pointing at or has focused, for the explanation card. */
  focused = $state<ControlId | null>(null)

  setKnob(id: KnobId, value: number) {
    this.knobs[id] = clamp01(value)
  }

  resetKnob(id: KnobId) {
    this.knobs[id] = DEFAULT_KNOBS[id]
  }

  nextShape() {
    this.shape = SHAPES[(SHAPES.indexOf(this.shape) + 1) % SHAPES.length]
  }

  toggleVoice() {
    this.voiceOn = !this.voiceOn
  }

  toggleEngaged() {
    this.engaged = !this.engaged
  }

  nextPreset() {
    this.preset = (this.preset + 1) % (PRESET_COUNT + 1)
  }
}
