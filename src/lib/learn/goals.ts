/**
 * Live goal checks for Learn chapters (PLAN Phase 7). A chapter's experiment is a list of
 * steps; each step is a predicate on what the pedal and the sound are doing right now. Steps
 * complete in order and stay done, so "turn CUTOFF down, then back up" is just two simple
 * checks, and nothing needs timers.
 */
import type { MachineState } from '../pedal/machine'
import { activeLayer } from '../pedal/machine'
import type { Layer, PresetParamId } from '../pedal/params'
import type { Globals, Shape } from '../pedal/presets'

export interface Observation {
  shape: Shape
  voiceOn: boolean
  values: Record<PresetParamId, number>
  globals: Globals
  engaged: boolean
  /** 0 = live mode, 1–8 = presets. */
  preset: number
  layer: Layer
  /** MIDI note the synth plays right now, or null. */
  note: number | null
  /** Id of the riff that is playing, or null. */
  riff: string | null
}

export type Check = (o: Observation) => boolean

export function observe(
  s: MachineState,
  sound: { note: number | null; riff: string | null },
): Observation {
  return {
    shape: s.current.shape,
    voiceOn: s.current.voiceOn,
    values: s.current.values,
    globals: s.globals,
    engaged: s.engaged,
    preset: s.preset,
    layer: activeLayer(s),
    note: sound.note,
    riff: sound.riff,
  }
}

/** How many steps are done after this observation (steps complete in order). */
export function advance(checks: readonly Check[], done: number, o: Observation): number {
  let n = Math.max(0, Math.min(done, checks.length))
  while (n < checks.length && checks[n](o)) n++
  return n
}
