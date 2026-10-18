/**
 * Reads one tap point for a small scope: live from the analysers while sound plays, else from
 * the computed snapshot. Returns a triggered window of a couple of cycles, already resampled
 * and scaled to ±1 (with a slow peak hold live, so the trace doesn't jump in size).
 */
import { midiToHz } from '../audio/dsp/analysis'
import type { AnalyserName } from '../audio/engine'
import { audio, computed, pedalSettings } from '../state.svelte'
import { PeakHold, scopeWindow } from './analysis'
import { repeatHz, WINDOW } from './computed'
import type { FlowTap } from './flow'

const ANALYSER: Record<Exclude<FlowTap, 'pitch'>, AnalyserName> = {
  dry: 'dry',
  osc: 'osc',
  filter: 'filter',
  amp: 'amp',
  chorus: 'chorus',
  fx: 'fx',
  out: 'left',
  left: 'left',
  right: 'right',
}

export interface TapTrace {
  samples: Float32Array
  /** Peak before scaling; 0 means silent. */
  peak: number
  cycles: number
}

export class TapReader {
  readonly #buf = new Float32Array(WINDOW)
  readonly #hold = new PeakHold(0.9)

  read(tap: FlowTap, points: number, live: boolean, cycles = 2): TapTrace | null {
    const snap = computed.snapshot
    const isLive = live && audio.engine.ctx !== null
    let midi: number | null
    let sr: number
    if (isLive) {
      midi = audio.telemetry?.pitch ?? null
      sr = audio.engine.ctx!.sampleRate
    } else {
      if (!snap) return null
      midi = snap.midi
      sr = snap.sampleRate
    }
    const pitchHz = midiToHz(midi ?? 33)
    // The tracker hands on a single pitch: draw it as a pure sine.
    if (tap === 'pitch') {
      const samples = new Float32Array(points)
      for (let i = 0; i < points; i++)
        samples[i] = Math.sin((2 * Math.PI * cycles * i) / (points - 1))
      return { samples, peak: midi === null ? 0 : 1, cycles }
    }
    // The oscillator mix repeats more slowly with the sub or the fifth voice on.
    const settings = pedalSettings()
    const rep = tap === 'dry' ? pitchHz : repeatHz(settings, pitchHz)
    let x: Float32Array
    if (isLive) {
      audio.engine.readTap(ANALYSER[tap], this.#buf)
      x = this.#buf
    } else {
      x = snap!.taps[tap]
    }
    const w = scopeWindow(x, sr / rep, points, cycles)
    let peak = 0
    for (const v of w.samples) peak = Math.max(peak, Math.abs(v))
    const scale = isLive ? this.#hold.next(peak) : peak
    if (scale > 1e-4) for (let i = 0; i < w.samples.length; i++) w.samples[i] /= scale
    return { samples: w.samples, peak, cycles: w.cycles }
  }
}
