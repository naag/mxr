/**
 * What the learner has done since a chapter started: shapes tried, footswitch taps, notes
 * played, how far each knob went. Learn chapters check their goals against this plus the
 * current pedal state. Pure, so every goal check is unit-tested.
 */
import { valueOf, type MachineState } from '../pedal/machine'
import { PARAMS, type ParamId } from '../pedal/params'
import type { Shape } from '../pedal/presets'

export interface Observation {
  shapes: Shape[]
  presets: number[]
  /** Times the footswitch turned the synth on or off. */
  engagedToggles: number
  voiceToggles: number
  /** Distinct MIDI notes heard. */
  notes: number[]
  /** Values when the chapter started, and the lowest and highest since. */
  start: Record<ParamId, number>
  min: Record<ParamId, number>
  max: Record<ParamId, number>
  last: { engaged: boolean; voiceOn: boolean }
}

const values = (s: MachineState) =>
  Object.fromEntries(PARAMS.map((p) => [p.id, valueOf(s, p)])) as Record<ParamId, number>

export function startObservation(s: MachineState): Observation {
  const v = values(s)
  return {
    shapes: [s.current.shape],
    presets: [s.preset],
    engagedToggles: 0,
    voiceToggles: 0,
    notes: [],
    start: v,
    min: { ...v },
    max: { ...v },
    last: { engaged: s.engaged, voiceOn: s.current.voiceOn },
  }
}

const add = <T>(list: T[], item: T) => (list.includes(item) ? list : [...list, item])

/** Folds the current state (and the note sounding, if any) into the observation. */
export function observe(o: Observation, s: MachineState, note: number | null = null): Observation {
  const v = values(s)
  const min = { ...o.min }
  const max = { ...o.max }
  let moved = false
  for (const p of PARAMS) {
    if (v[p.id] < min[p.id]) {
      min[p.id] = v[p.id]
      moved = true
    }
    if (v[p.id] > max[p.id]) {
      max[p.id] = v[p.id]
      moved = true
    }
  }
  const next: Observation = {
    ...o,
    shapes: add(o.shapes, s.current.shape),
    presets: add(o.presets, s.preset),
    notes: note === null ? o.notes : add(o.notes, note),
    engagedToggles: o.engagedToggles + (s.engaged !== o.last.engaged ? 1 : 0),
    voiceToggles: o.voiceToggles + (s.current.voiceOn !== o.last.voiceOn ? 1 : 0),
    min: moved ? min : o.min,
    max: moved ? max : o.max,
    last: { engaged: s.engaged, voiceOn: s.current.voiceOn },
  }
  const same =
    !moved &&
    next.shapes === o.shapes &&
    next.presets === o.presets &&
    next.notes === o.notes &&
    next.engagedToggles === o.engagedToggles &&
    next.voiceToggles === o.voiceToggles
  return same ? o : next
}
