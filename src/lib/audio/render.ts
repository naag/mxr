/**
 * Offline rendering: runs the pedal DSP for a list of notes and returns every tap as a
 * buffer. Used by tests now and by the "computed" visuals later (PLAN §5.5).
 */
import { emptyFrame, PedalDSP, type PedalFrame, type PedalSettings } from './dsp/pedal-dsp'

export interface NoteEvent {
  /** Start time in seconds. */
  at: number
  midi: number
  /** Length in seconds; the string is damped when it ends. */
  length: number
  velocity?: number
}

export type Tap = Exclude<keyof PedalFrame, never>

export type Render = Record<Tap, Float32Array> & { sampleRate: number }

export function renderOffline(
  settings: PedalSettings,
  notes: NoteEvent[],
  seconds: number,
  sampleRate = 48000,
  seed = 1,
): Render {
  const dsp = new PedalDSP(sampleRate, seed)
  dsp.set(settings)
  const n = Math.round(seconds * sampleRate)
  const frame = emptyFrame()
  const keys = Object.keys(frame) as Tap[]
  const out = Object.fromEntries(keys.map((k) => [k, new Float32Array(n)])) as Record<
    Tap,
    Float32Array
  >

  const events = notes
    .flatMap((note) => [
      { at: Math.round(note.at * sampleRate), on: true, note },
      { at: Math.round((note.at + note.length) * sampleRate), on: false, note },
    ])
    .sort((a, b) => a.at - b.at || Number(a.on) - Number(b.on))

  let next = 0
  for (let i = 0; i < n; i++) {
    while (next < events.length && events[next].at <= i) {
      const e = events[next++]
      if (e.on) dsp.noteOn(e.note.midi, e.note.velocity ?? 0.8)
      else dsp.noteOff()
    }
    dsp.tick(frame)
    for (const k of keys) out[k][i] = frame[k]
  }
  return Object.assign(out, { sampleRate })
}
