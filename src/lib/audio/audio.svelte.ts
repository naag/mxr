import type { PedalSettings } from './dsp/pedal-dsp'
import { AudioEngine, type EngineStatus } from './engine'
import type { Telemetry } from './protocol'
import { RIFFS, riffById } from './riffs'

export type Source = 'riff' | 'fretboard' | 'keyboard'

export const MIN_BPM = 50
export const MAX_BPM = 160

/** Reactive state of the sound engine and the note sources. */
export class AudioStore {
  readonly engine = new AudioEngine()
  status = $state<EngineStatus>('off')
  error = $state<string | null>(null)
  /** 0–1 slider position; the gain is its square, which sounds more even. */
  volume = $state(0.6)
  muted = $state(false)
  source = $state<Source>('riff')
  riffId = $state(RIFFS[0].id)
  bpm = $state(RIFFS[0].bpm)
  playing = $state(false)
  telemetry = $state.raw<Telemetry | null>(null)

  constructor() {
    this.engine.onstatechange = (s) => (this.status = s)
    this.engine.ontelemetry = (t) => (this.telemetry = t)
  }

  get riff() {
    return riffById(this.riffId)
  }

  get gain() {
    return this.muted ? 0 : this.volume * this.volume
  }

  async start() {
    if (this.status === 'running') return
    this.error = null
    try {
      await this.engine.start(this.gain)
      this.status = this.engine.status
    } catch (e) {
      this.status = 'error'
      this.error = e instanceof Error ? e.message : String(e)
    }
  }

  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v))
    this.engine.setVolume(this.gain)
  }

  toggleMute() {
    this.muted = !this.muted
    this.engine.setVolume(this.gain)
  }

  setSettings(settings: PedalSettings) {
    this.engine.setSettings(settings)
  }

  async play() {
    await this.start()
    this.engine.playRiff(this.riff, this.bpm)
    this.playing = true
  }

  stop() {
    this.engine.stop()
    this.playing = false
  }

  setRiff(id: string) {
    this.riffId = id
    this.bpm = this.riff.bpm
    if (this.playing) this.engine.playRiff(this.riff, this.bpm)
  }

  setBpm(bpm: number) {
    this.bpm = Math.round(Math.min(MAX_BPM, Math.max(MIN_BPM, bpm)))
    this.engine.setTempo(this.bpm)
  }

  setSource(source: Source) {
    if (source !== 'riff' && this.playing) this.stop()
    this.source = source
  }

  /** Plays a note from the fretboard or keyboard (starts the sound if needed). */
  async noteOn(midi: number, velocity = 0.8) {
    if (this.playing) this.stop()
    if (this.status !== 'running') await this.start()
    this.engine.noteOn(midi, velocity)
  }

  noteOff(midi: number) {
    this.engine.noteOff(midi)
  }
}
