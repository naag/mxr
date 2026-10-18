/**
 * Web Audio graph: pedal worklet → master volume → safety limiter → speakers, plus
 * analysers on the output and on every tap point (PLAN §5.4).
 */
import { rms } from './dsp/analysis'
import type { PedalSettings } from './dsp/pedal-dsp'
import {
  PROCESSOR_NAME,
  TAP_CHANNELS,
  type Telemetry,
  type TapName,
  type ToWorklet,
} from './protocol'
import type { Riff } from './riffs'
import workletUrl from './worklets/pedal.worklet.ts?worker&url'

export type EngineStatus = 'off' | 'starting' | 'running' | 'suspended' | 'error'
export type AnalyserName = 'left' | 'right' | TapName

export class AudioEngine {
  ctx: AudioContext | null = null
  #node: AudioWorkletNode | null = null
  #master: GainNode | null = null
  analysers: Partial<Record<AnalyserName, AnalyserNode>> = {}
  #pending: ToWorklet[] = []
  #settings: PedalSettings | null = null
  ontelemetry: ((t: Telemetry) => void) | null = null
  onstatechange: ((s: EngineStatus) => void) | null = null

  get status(): EngineStatus {
    if (!this.ctx) return 'off'
    if (!this.#node) return 'starting'
    return this.ctx.state === 'running' ? 'running' : 'suspended'
  }

  /** Must be called from a user gesture (browsers block audio otherwise). */
  async start(volume: number): Promise<void> {
    if (this.ctx) {
      await this.ctx.resume()
      return
    }
    const ctx = new AudioContext({ latencyHint: 'interactive' })
    this.ctx = ctx
    ctx.onstatechange = () => this.onstatechange?.(this.status)
    this.onstatechange?.('starting')
    // Resume right away, inside the gesture, before awaiting anything.
    const resumed = ctx.resume()
    await ctx.audioWorklet.addModule(workletUrl)
    const node = new AudioWorkletNode(ctx, PROCESSOR_NAME, {
      numberOfInputs: 0,
      numberOfOutputs: 2,
      outputChannelCount: [2, TAP_CHANNELS.length],
    })
    node.port.onmessage = (e: MessageEvent<Telemetry>) => this.ontelemetry?.(e.data)

    const master = ctx.createGain()
    master.gain.value = volume
    // Safety limiter: keeps high resonance and loud presets from ever hitting full scale hard.
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -3
    limiter.knee.value = 0
    limiter.ratio.value = 20
    limiter.attack.value = 0.001
    limiter.release.value = 0.1

    node.connect(master, 0)
    master.connect(limiter)
    limiter.connect(ctx.destination)

    const outSplit = ctx.createChannelSplitter(2)
    limiter.connect(outSplit)
    const tapSplit = ctx.createChannelSplitter(TAP_CHANNELS.length)
    node.connect(tapSplit, 1)
    const analyser = () => {
      const a = ctx.createAnalyser()
      a.fftSize = 4096
      a.smoothingTimeConstant = 0
      return a
    }
    ;(['left', 'right'] as const).forEach((name, i) => {
      const a = analyser()
      outSplit.connect(a, i)
      this.analysers[name] = a
    })
    TAP_CHANNELS.forEach((name, i) => {
      const a = analyser()
      tapSplit.connect(a, i)
      this.analysers[name] = a
    })

    this.#node = node
    this.#master = master
    if (this.#settings) this.#post({ type: 'settings', settings: this.#settings })
    for (const msg of this.#pending) this.#post(msg)
    this.#pending = []
    await resumed
    this.onstatechange?.(this.status)
  }

  async suspend() {
    await this.ctx?.suspend()
  }

  setVolume(gain: number) {
    if (this.#master && this.ctx)
      this.#master.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.02)
  }

  #post(msg: ToWorklet) {
    if (this.#node) this.#node.port.postMessage(msg)
    else if (msg.type !== 'settings') this.#pending.push(msg)
  }

  setSettings(settings: PedalSettings) {
    this.#settings = settings
    if (this.#node) this.#post({ type: 'settings', settings })
  }

  noteOn(midi: number, velocity = 0.8) {
    this.#post({ type: 'noteOn', midi, velocity })
  }

  noteOff(midi: number) {
    this.#post({ type: 'noteOff', midi })
  }

  playRiff(riff: Riff, bpm: number) {
    this.#post({ type: 'riff', riff, bpm })
  }

  setTempo(bpm: number) {
    this.#post({ type: 'tempo', bpm })
  }

  stop() {
    this.#post({ type: 'stop' })
  }

  /** RMS of every analyser's latest window, for meters and tests. */
  levels(): Partial<Record<AnalyserName, number>> {
    const out: Partial<Record<AnalyserName, number>> = {}
    for (const [name, a] of Object.entries(this.analysers) as [AnalyserName, AnalyserNode][]) {
      const buf = new Float32Array(a.fftSize)
      a.getFloatTimeDomainData(buf)
      out[name] = rms(buf)
    }
    return out
  }
}
