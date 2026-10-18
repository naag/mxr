import type { Riff } from './riffs'

export interface NoteEventOut {
  type: 'on' | 'off'
  midi: number
  velocity: number
}

/**
 * Sample-accurate loop player. Runs inside the audio thread: call `at(frame)` once per sample
 * frame and it returns the events that fall exactly on that frame.
 */
export class Sequencer {
  #events: { frame: number; event: NoteEventOut; wrapped?: boolean }[] = []
  #firstPass = true
  #loopFrames = 0
  #loopStart = 0
  #index = 0
  #playing = false
  #riff: Riff | null = null
  #bpm = 0

  constructor(readonly sampleRate: number) {}

  get playing() {
    return this.#playing
  }

  start(riff: Riff, bpm: number, frame: number) {
    this.#riff = riff
    this.#bpm = bpm
    this.#build()
    this.#loopStart = frame
    this.#index = 0
    this.#firstPass = true
    this.#playing = true
  }

  /** Changes the tempo, keeping the current position in the loop. */
  setTempo(bpm: number, frame: number) {
    if (!this.#riff || bpm === this.#bpm) return
    const progress = this.#playing
      ? ((frame - this.#loopStart) % this.#loopFrames) / this.#loopFrames
      : 0
    this.#bpm = bpm
    this.#build()
    this.#loopStart = frame - Math.round(progress * this.#loopFrames)
    this.#index = this.#events.findIndex((e) => e.frame >= frame - this.#loopStart)
    if (this.#index < 0) this.#index = this.#events.length
  }

  stop() {
    this.#playing = false
  }

  #build() {
    const riff = this.#riff!
    const framesPerBeat = (60 / this.#bpm) * this.sampleRate
    this.#loopFrames = Math.round(riff.beats * framesPerBeat)
    this.#events = riff.notes
      .flatMap((n) => [
        {
          frame: Math.round(n.beat * framesPerBeat),
          event: { type: 'on' as const, midi: n.midi, velocity: n.velocity ?? 0.8 },
        },
        {
          frame: Math.round((n.beat + n.length) * framesPerBeat),
          event: { type: 'off' as const, midi: n.midi, velocity: 0 },
        },
      ])
      // A note-off at (or past) the loop end belongs to the start of the next loop.
      .map((e) =>
        e.frame >= this.#loopFrames
          ? { ...e, frame: e.frame % this.#loopFrames, wrapped: true }
          : e,
      )
      // Note-offs first when they coincide with the next note-on.
      .sort((a, b) => a.frame - b.frame || (a.event.type === 'off' ? -1 : 1))
  }

  at(frame: number): NoteEventOut[] | null {
    if (!this.#playing || this.#events.length === 0) return null
    let pos = frame - this.#loopStart
    if (pos >= this.#loopFrames) {
      this.#loopStart += this.#loopFrames * Math.floor(pos / this.#loopFrames)
      pos = frame - this.#loopStart
      this.#index = 0
      this.#firstPass = false
    }
    let out: NoteEventOut[] | null = null
    while (this.#index < this.#events.length && this.#events[this.#index].frame <= pos) {
      const e = this.#events[this.#index++]
      // A wrapped note-off ends a note from the previous loop; there is none on the first pass.
      if (!(e.wrapped && this.#firstPass)) (out ??= []).push(e.event)
    }
    return out
  }
}
