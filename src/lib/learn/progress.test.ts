import { describe, expect, it } from 'vitest'
import { initialState } from '../pedal/machine'
import { CHAPTERS } from './chapters'
import { observe } from './goals'
import { LearnProgress } from './progress.svelte'

function memoryStorage(): Storage {
  const m = new Map<string, string>()
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() {
      return m.size
    },
  }
}

describe('LearnProgress', () => {
  it('records steps and remembers them', () => {
    const storage = memoryStorage()
    const p = new LearnProgress(storage)
    const off = { ...initialState(), engaged: false }
    p.observe(0, observe(off, { note: null, riff: null }))
    expect(p.steps[0]).toBe(1)
    expect(p.isDone(0)).toBe(false)
    p.observe(0, observe(initialState(), { note: null, riff: null }))
    expect(p.isDone(0)).toBe(true)
    expect(p.doneCount).toBe(1)
    expect(new LearnProgress(storage).isDone(0)).toBe(true)
  })

  it('ignores broken storage and clamps stored values', () => {
    const storage = memoryStorage()
    storage.setItem('bass-synth-explorer/learn/v1', JSON.stringify({ steps: [99, -3, 'x'] }))
    const p = new LearnProgress(storage)
    expect(p.steps[0]).toBe(CHAPTERS[0].checks.length)
    expect(p.steps[1]).toBe(0)
    expect(p.steps[2]).toBe(0)
    storage.setItem('bass-synth-explorer/learn/v1', '{oops')
    expect(new LearnProgress(storage).doneCount).toBe(0)
    const throwing = {
      ...memoryStorage(),
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    } as Storage
    const q = new LearnProgress(throwing)
    q.observe(0, observe({ ...initialState(), engaged: false }, { note: null, riff: null }))
    expect(q.steps[0]).toBe(1)
  })

  it('resets', () => {
    const p = new LearnProgress(memoryStorage())
    p.observe(0, observe({ ...initialState(), engaged: false }, { note: null, riff: null }))
    p.reset()
    expect(p.steps.every((n) => n === 0)).toBe(true)
  })
})
