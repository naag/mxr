/**
 * AudioWorklet processor: runs the pure-TypeScript pedal DSP on the audio thread.
 * Output 0 is the stereo pedal output; output 1 carries the tap points for the visuals.
 */
import { emptyFrame, PedalDSP } from '../dsp/pedal-dsp'
import { PROCESSOR_NAME, type Telemetry, type ToWorklet } from '../protocol'
import { Sequencer } from '../sequencer'

// AudioWorkletGlobalScope isn't in the DOM type library; declare the parts used here.
declare const sampleRate: number
declare const currentFrame: number
declare class AudioWorkletProcessor {
  readonly port: MessagePort
}
declare function registerProcessor(name: string, ctor: unknown): void

const TELEMETRY_FRAMES = 1024

class PedalProcessor extends AudioWorkletProcessor {
  #dsp = new PedalDSP(sampleRate)
  #seq = new Sequencer(sampleRate)
  #frame = emptyFrame()
  #note: number | null = null
  #since = 0
  #peakL = 0
  #peakR = 0

  constructor() {
    super()
    this.port.onmessage = (e: MessageEvent<ToWorklet>) => this.#receive(e.data)
  }

  #receive(msg: ToWorklet) {
    switch (msg.type) {
      case 'settings':
        this.#dsp.set(msg.settings)
        break
      case 'noteOn':
        this.#noteOn(msg.midi, msg.velocity)
        break
      case 'noteOff':
        this.#noteOff(msg.midi)
        break
      case 'riff':
        this.#seq.start(msg.riff, msg.bpm, currentFrame)
        break
      case 'tempo':
        this.#seq.setTempo(msg.bpm, currentFrame)
        break
      case 'stop':
        this.#seq.stop()
        if (this.#note !== null) this.#noteOff(this.#note)
        break
    }
  }

  #noteOn(midi: number, velocity: number) {
    this.#dsp.noteOn(midi, velocity)
    this.#note = midi
  }

  /** Monophonic, last-note priority: only releasing the sounding note stops it. */
  #noteOff(midi: number) {
    if (midi !== this.#note) return
    this.#dsp.noteOff()
    this.#note = null
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const [left, right] = outputs[0]
    const taps = outputs[1]
    const f = this.#frame
    const n = left.length
    for (let i = 0; i < n; i++) {
      const events = this.#seq.at(currentFrame + i)
      if (events) {
        for (const e of events) {
          if (e.type === 'on') this.#noteOn(e.midi, e.velocity)
          else this.#noteOff(e.midi)
        }
      }
      this.#dsp.tick(f)
      left[i] = f.left
      right[i] = f.right
      if (taps.length >= 5) {
        taps[0][i] = f.dry
        taps[1][i] = f.osc
        taps[2][i] = f.filter
        taps[3][i] = f.amp
        taps[4][i] = f.fx
      }
      this.#peakL = Math.max(this.#peakL, Math.abs(f.left))
      this.#peakR = Math.max(this.#peakR, Math.abs(f.right))
    }
    this.#since += n
    if (this.#since >= TELEMETRY_FRAMES) {
      const t: Telemetry = {
        type: 'telemetry',
        note: this.#note,
        cutoffHz: f.cutoffHz,
        pitch: f.pitch,
        gainReductionDb: f.gainReductionDb,
        peakLeft: this.#peakL,
        peakRight: this.#peakR,
        playing: this.#seq.playing,
      }
      this.port.postMessage(t)
      this.#since = 0
      this.#peakL = 0
      this.#peakR = 0
    }
    return true
  }
}

registerProcessor(PROCESSOR_NAME, PedalProcessor)
