/**
 * Reads analyser taps for the live visuals, once per animation frame however many visuals
 * ask for the same tap.
 */
import type { AnalyserName, AudioEngine } from '../audio/engine'
import type { TapId } from './computed'
import { WINDOW } from './computed'

const ANALYSER: Record<TapId, AnalyserName> = {
  dry: 'dry',
  osc: 'osc',
  filter: 'filter',
  amp: 'amp',
  chorus: 'chorus',
  fx: 'fx',
  out: 'left',
}

const buffers = new Map<TapId, { frame: number; data: Float32Array<ArrayBuffer> }>()

/** The newest WINDOW samples of a tap, or null before the engine runs. */
export function readLiveTap(engine: AudioEngine, tap: TapId, frame: number): Float32Array | null {
  let entry = buffers.get(tap)
  if (!entry) {
    entry = { frame: -1, data: new Float32Array(WINDOW) }
    buffers.set(tap, entry)
  }
  if (entry.frame !== frame) {
    if (!engine.readTap(ANALYSER[tap], entry.data)) return null
    entry.frame = frame
  }
  return entry.data
}
