/** Messages between the main thread and the pedal AudioWorklet. */
import type { PedalSettings } from './dsp/pedal-dsp'
import type { Riff } from './riffs'

export type ToWorklet =
  | { type: 'settings'; settings: PedalSettings }
  | { type: 'noteOn'; midi: number; velocity: number }
  | { type: 'noteOff'; midi: number }
  | { type: 'riff'; riff: Riff; bpm: number }
  | { type: 'tempo'; bpm: number }
  | { type: 'stop' }

export interface Telemetry {
  type: 'telemetry'
  /** MIDI note sounding now, or null. */
  note: number | null
  cutoffHz: number
  pitch: number
  gainReductionDb: number
  /** Seconds since the synth started the current note, or null before the first. */
  noteAge: number | null
  /** Amp-stage gain (string level × AMP ENV), 0–1.5. */
  level: number
  /** Peak output level since the last message, 0–1+. */
  peakLeft: number
  peakRight: number
  playing: boolean
}

export type FromWorklet = Telemetry

export const PROCESSOR_NAME = 'mxr-pedal'

/** Channels of the second output, in order. */
export const TAP_CHANNELS = ['dry', 'osc', 'filter', 'amp', 'fx'] as const
export type TapName = (typeof TAP_CHANNELS)[number]
