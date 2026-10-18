import { describe, expect, it } from 'vitest'
import { riffById, RIFFS } from '../audio/riffs'
import { PARAM, type PresetParamId } from '../pedal/params'
import { FACTORY_PRESETS, initialLivePatch, PRESET_INFO, toeChanges } from '../pedal/presets'
import { LAST_CHAPTER } from '../router'
import { presetRecipes, recipeKeyLabel } from './presets'

const neutral = initialLivePatch()

describe('preset recipe cards', () => {
  it('has a card for every factory preset', () => {
    expect(presetRecipes).toHaveLength(PRESET_INFO.length)
  })

  for (const [i, info] of PRESET_INFO.entries()) {
    const recipe = presetRecipes[i]
    const patch = FACTORY_PRESETS[i]

    it(`${info.code} ${info.name}: explains why, with ingredients that are really in it`, () => {
      // "Done when" (PLAN Phase 8): each card explains why it sounds the way it does.
      expect(recipe.explain.split(/[.!?]\s/).length).toBeGreaterThanOrEqual(3)
      expect(recipe.keys.length).toBeGreaterThanOrEqual(3)
      for (const key of recipe.keys) {
        expect(key.chapter).toBeGreaterThanOrEqual(1)
        expect(key.chapter).toBeLessThanOrEqual(LAST_CHAPTER)
        if (key.control === 'shape' || key.control === 'voice') continue
        expect(PARAM[key.control].global).toBe(false)
        // An ingredient worth naming sits at least an hour away from the neutral sound.
        const id = key.control as PresetParamId
        expect(Math.abs(patch.values[id] - neutral.values[id])).toBeGreaterThan(0.09)
      }
      if (recipe.keys.some((k) => k.control === 'voice')) expect(patch.voiceOn).toBe(true)
      expect(RIFFS.map((r) => r.id)).toContain(recipe.riff)
      expect(riffById(recipe.riff).id).toBe(recipe.riff)
      // Only presets with a toe sound talk about the expression pedal.
      expect(Boolean(recipe.expression)).toBe(toeChanges(patch).length > 0)
    })
  }

  it('reads chip labels from the preset values', () => {
    const lizard = FACTORY_PRESETS[2]
    expect(recipeKeyLabel({ control: 'resonance', chapter: 6 }, lizard)).toBe('RESONANCE 3 o’clock')
    expect(recipeKeyLabel({ control: 'shape', chapter: 2 }, lizard)).toBe('◿ sawtooth')
    expect(recipeKeyLabel({ control: 'voice', chapter: 3 }, FACTORY_PRESETS[5])).toBe('VOICE on')
  })
})
