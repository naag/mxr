import { describe, expect, it } from 'vitest'
import { initialState, reduce } from './machine'
import { patchesEqual } from './presets'
import { loadPedal, savePedal } from './storage'

class MemoryStorage {
  data = new Map<string, string>()
  getItem(k: string) {
    return this.data.get(k) ?? null
  }
  setItem(k: string, v: string) {
    this.data.set(k, v)
  }
}

const asStorage = (m: object) => m as unknown as Storage

describe('pedal storage', () => {
  it('round-trips saved patches and globals', () => {
    const mem = new MemoryStorage()
    let s = initialState()
    s = reduce(s, { type: 'turn', knob: 'mix', value: 0.2 }, 0)
    s = reduce(s, { type: 'setLayer', layer: 'shape' }, 0)
    s = reduce(s, { type: 'turn', knob: 'mod', value: 1 }, 0)
    savePedal(asStorage(mem), s.saved, s.globals)
    const back = loadPedal(asStorage(mem))!
    expect(back.globals.outMode).toBe(1)
    expect(back.saved.every((p, i) => patchesEqual(p, s.saved[i]))).toBe(true)
  })

  it('remembers expression toe states', () => {
    const mem = new MemoryStorage()
    let s = initialState()
    s = reduce(s, { type: 'expressionConnect', on: true }, 0)
    s = reduce(s, { type: 'expressionEdit', target: 'toe' }, 0)
    s = reduce(s, { type: 'turn', knob: 'cutoff', value: 0.95 }, 0)
    savePedal(asStorage(mem), s.saved, s.globals)
    expect(loadPedal(asStorage(mem))!.saved[0].toe).toEqual({ cutoff: 0.95 })
    expect(loadPedal(asStorage(mem))!.saved[6].toe).toEqual(s.saved[6].toe)
  })

  it('returns null for missing or corrupt data', () => {
    expect(loadPedal(null)).toBeNull()
    const mem = new MemoryStorage()
    expect(loadPedal(asStorage(mem))).toBeNull()
    mem.setItem('bass-synth-explorer/pedal/v1', '{not json')
    expect(loadPedal(asStorage(mem))).toBeNull()
    mem.setItem('bass-synth-explorer/pedal/v1', JSON.stringify({ saved: ['x'], globals: {} }))
    expect(loadPedal(asStorage(mem))).toBeNull()
  })

  it('survives storage that throws', () => {
    const broken = asStorage({
      getItem() {
        throw new Error('blocked')
      },
      setItem() {
        throw new Error('blocked')
      },
    })
    expect(loadPedal(broken)).toBeNull()
    expect(() => savePedal(broken, initialState().saved, initialState().globals)).not.toThrow()
  })
})
