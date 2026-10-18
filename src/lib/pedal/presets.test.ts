import { describe, expect, it } from 'vitest'
import { clock, PARAM, normalize, PRESET_PARAM_IDS } from './params'
import {
  bankOf,
  clonePatch,
  FACTORY_PRESETS,
  initialLivePatch,
  morphPatch,
  patchesEqual,
  PRESET_COUNT,
  PRESET_INFO,
  presetInfo,
  SHAPES,
  toeChanges,
} from './presets'

describe('factory presets', () => {
  it('has four green and four red presets', () => {
    expect(FACTORY_PRESETS).toHaveLength(PRESET_COUNT)
    expect(PRESET_INFO.map((p) => p.code)).toEqual(['G1', 'G2', 'G3', 'G4', 'R1', 'R2', 'R3', 'R4'])
    expect(bankOf(0)).toBeNull()
    expect(bankOf(4)).toBe('green')
    expect(bankOf(5)).toBe('red')
  })

  it('stores every preset parameter, inside its range and on a detent if stepped', () => {
    for (const patch of FACTORY_PRESETS) {
      expect(SHAPES).toContain(patch.shape)
      expect(Object.keys(patch.values).sort()).toEqual([...PRESET_PARAM_IDS].sort())
      for (const id of PRESET_PARAM_IDS) {
        expect(patch.values[id]).toBe(normalize(PARAM[id], patch.values[id]))
      }
    }
  })

  it('follows the draft recipes', () => {
    const lizard = FACTORY_PRESETS[2]
    expect(presetInfo(3)?.name).toBe('Lizard Synth')
    expect(lizard.shape).toBe('saw')
    expect(lizard.values.cutoff).toBe(clock(10))
    expect(lizard.values.resonance).toBe(clock(15))
    const synthmau5 = FACTORY_PRESETS[7]
    expect(synthmau5.values.envAmount).toBeLessThan(0.5)
    expect(FACTORY_PRESETS[5].voiceOn).toBe(true)
  })

  it('differ from each other', () => {
    for (let i = 0; i < FACTORY_PRESETS.length; i++) {
      for (let j = i + 1; j < FACTORY_PRESETS.length; j++) {
        expect(patchesEqual(FACTORY_PRESETS[i], FACTORY_PRESETS[j])).toBe(false)
      }
    }
  })
})

describe('patch helpers', () => {
  it('clones without sharing values', () => {
    const a = initialLivePatch()
    const b = clonePatch(a)
    b.values.mix = 0
    expect(a.values.mix).not.toBe(0)
    expect(patchesEqual(a, clonePatch(a))).toBe(true)
    expect(patchesEqual(a, b)).toBe(false)
  })
})

describe('expression toe state', () => {
  const army = FACTORY_PRESETS[5]

  it('gives ARMY OF SYNTH a toe state (manual: "use expression for intensity")', () => {
    expect(presetInfo(6)?.name).toBe('Army of Synth')
    expect(toeChanges(army)).toEqual(['cutoff', 'resonance'])
    expect(army.toe?.cutoff).toBe(clock(15))
    for (const [i, p] of FACTORY_PRESETS.entries()) if (i !== 5) expect(toeChanges(p)).toEqual([])
  })

  it('morphs linearly from heel to toe and leaves other parameters alone', () => {
    expect(morphPatch(army, 0)).toBe(army)
    const half = morphPatch(army, 0.5)
    expect(half.values.cutoff).toBeCloseTo((clock(10) + clock(15)) / 2, 9)
    expect(morphPatch(army, 1).values.resonance).toBe(clock(14))
    expect(morphPatch(army, 7).values.resonance).toBe(clock(14))
    expect(half.values.mix).toBe(army.values.mix)
    expect(half.shape).toBe(army.shape)
  })

  it('counts the toe state in equality and clones it', () => {
    const copy = clonePatch(army)
    expect(patchesEqual(copy, army)).toBe(true)
    copy.toe!.cutoff = 0.2
    expect(army.toe?.cutoff).toBe(clock(15))
    expect(patchesEqual(copy, army)).toBe(false)
    // A toe value equal to the heel value is the same as none.
    const plain = initialLivePatch()
    expect(patchesEqual({ ...plain, toe: { mix: plain.values.mix } }, plain)).toBe(true)
  })
})
