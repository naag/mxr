import { describe, expect, it } from 'vitest'
import { RIFFS, riffById, type Riff } from './riffs'
import { Sequencer, type NoteEventOut } from './sequencer'

const SR = 48000
const riff: Riff = {
  id: 't',
  name: 'Test',
  shows: '',
  bpm: 120,
  beats: 2,
  notes: [
    { beat: 0, midi: 33, length: 0.5 },
    { beat: 1, midi: 36, length: 1, velocity: 0.3 },
  ],
}

function run(seq: Sequencer, from: number, frames: number) {
  const events: { frame: number; e: NoteEventOut }[] = []
  for (let f = from; f < from + frames; f++)
    for (const e of seq.at(f) ?? []) events.push({ frame: f, e })
  return events
}

describe('Sequencer', () => {
  it('plays notes on exact sample frames', () => {
    const seq = new Sequencer(SR)
    seq.start(riff, 120, 1000)
    const events = run(seq, 1000, SR)
    // 120 BPM: a beat is 0.5 s = 24000 frames.
    expect(events).toEqual([
      { frame: 1000, e: { type: 'on', midi: 33, velocity: 0.8 } },
      { frame: 1000 + 12000, e: { type: 'off', midi: 33, velocity: 0 } },
      { frame: 1000 + 24000, e: { type: 'on', midi: 36, velocity: 0.3 } },
    ])
  })

  it('loops, with the last note-off landing on the loop point before the next note-on', () => {
    const seq = new Sequencer(SR)
    seq.start(riff, 120, 0)
    const events = run(seq, 0, SR * 2)
    const atLoop = events.filter((x) => x.frame === SR)
    expect(atLoop.map((x) => x.e.type)).toEqual(['off', 'on'])
    expect(events.filter((x) => x.e.type === 'on')).toHaveLength(4)
  })

  it('keeps its place in the loop when the tempo changes', () => {
    const seq = new Sequencer(SR)
    seq.start(riff, 120, 0)
    run(seq, 0, 6000)
    seq.setTempo(60, 6000)
    const events = run(seq, 6000, SR * 2)
    // 1/8 of the way into the loop (now 2 s long, 96000 frames): position 12000.
    // The first note-off (beat 0.5 = 24000) is 12000 frames away, the next note-on 36000.
    expect(events[0]).toEqual({ frame: 18000, e: { type: 'off', midi: 33, velocity: 0 } })
    expect(events[1].frame).toBe(42000)
  })

  it('is silent when stopped', () => {
    const seq = new Sequencer(SR)
    seq.start(riff, 120, 0)
    seq.stop()
    expect(run(seq, 0, SR)).toEqual([])
  })
})

describe('built-in riffs', () => {
  it('have unique ids, stay inside their loop and use bass-range notes', () => {
    expect(new Set(RIFFS.map((r) => r.id)).size).toBe(RIFFS.length)
    for (const r of RIFFS) {
      expect(r.notes.length).toBeGreaterThan(0)
      for (const n of r.notes) {
        expect(n.beat).toBeGreaterThanOrEqual(0)
        expect(n.beat + n.length).toBeLessThanOrEqual(r.beats)
        expect(n.midi).toBeGreaterThanOrEqual(28)
        expect(n.midi).toBeLessThanOrEqual(55)
      }
    }
  })

  it('fall back to the first riff for unknown ids', () => {
    expect(riffById('nope').id).toBe('funk-drop')
  })
})
