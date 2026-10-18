/**
 * Web Worker for the computed visuals: renders the preview note and the riff off the main
 * thread, so turning a knob never stutters while the DSP runs.
 */
import { computeSnapshot, type Snapshot } from './computed'
import type { PedalSettings } from '../audio/dsp/pedal-dsp'
import type { Riff } from '../audio/riffs'

export interface SnapshotRequest {
  id: number
  settings: PedalSettings
  riff: Riff
  bpm: number
}

export interface SnapshotResponse {
  id: number
  snapshot: Snapshot
}

/** Buffers to move (not copy) back to the main thread. */
export function transferables(s: Snapshot): ArrayBuffer[] {
  return [...Object.values(s.taps), s.envelope.cutoffHz, s.envelope.level, s.pitch.pitch].map(
    (a) => a.buffer as ArrayBuffer,
  )
}

interface WorkerScope {
  onmessage: ((e: MessageEvent<SnapshotRequest>) => void) | null
  postMessage(message: SnapshotResponse, transfer: Transferable[]): void
}

const scope = self as unknown as WorkerScope
scope.onmessage = (e) => {
  const { id, settings, riff, bpm } = e.data
  const snapshot = computeSnapshot(settings, riff, bpm)
  scope.postMessage({ id, snapshot }, transferables(snapshot))
}
