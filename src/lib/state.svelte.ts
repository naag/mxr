/**
 * App-wide singletons. The pedal and the sound live here (not in a view) so audio keeps
 * playing and settings stay put while you move between Play, Learn and the other views.
 */
import { AudioStore } from './audio/audio.svelte'
import { PedalStore } from './pedal/pedal.svelte'
import { patchFromHash } from './pedal/share'
import { ComputedViz } from './viz/computed.svelte'
import { VizStore } from './viz/viz.svelte'

export const pedal = new PedalStore({ patch: patchFromHash(location.hash) })
export const audio = new AudioStore()
export const viz = new VizStore()
/** Offline renders that drive the visuals while the sound is off. */
export const computed = new ComputedViz()

/** The settings the sound engine needs from the pedal. */
export function pedalSettings() {
  const s = pedal.state
  return { patch: pedal.sound, globals: s.globals, engaged: s.engaged, frozen: s.frozen }
}
