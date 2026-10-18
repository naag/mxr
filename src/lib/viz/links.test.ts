import { describe, expect, it } from 'vitest'
import { PARAMS } from '../pedal/params'
import { BLOCKS, knobsForViz, linksFor, PARAM_LINKS, VIZ_IDS } from './links'

describe('linked highlighting', () => {
  it('links every parameter to at least one visual and one chain block', () => {
    for (const p of PARAMS) {
      expect(PARAM_LINKS[p.id].viz.length, p.id).toBeGreaterThan(0)
      for (const b of PARAM_LINKS[p.id].blocks) expect(BLOCKS).toContain(b)
    }
  })

  it('follows the active layer', () => {
    expect(linksFor('cutoff', 'main').viz[0]).toBe('spectrum')
    expect(linksFor('cutoff', 'main').curve).toBe(true)
    expect(linksFor('resonance', 'voice').viz).toEqual(['pitch'])
    expect(linksFor('mix', 'shape').blocks).toEqual(['dyn'])
    expect(linksFor(null, 'main').viz).toEqual([])
    expect(linksFor('shape', 'main').blocks).toEqual(['osc'])
  })

  it('finds the knobs that change a visual', () => {
    expect(knobsForViz('pitch', 'voice')).toEqual(['resonance'])
    expect(knobsForViz('spectrum', 'main')).toEqual(['cutoff', 'envelope', 'sub', 'resonance'])
    expect(knobsForViz(null, 'main')).toEqual([])
    // Every visual is reachable from some knob in some layer.
    for (const v of VIZ_IDS) {
      const all = (['main', 'voice', 'shape'] as const).flatMap((l) => knobsForViz(v, l))
      expect(all.length, v).toBeGreaterThan(0)
    }
  })
})
