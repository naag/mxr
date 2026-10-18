import { describe, expect, it } from 'vitest'
import type { PedalSettings } from '../audio/dsp/pedal-dsp'
import { PARAMS } from '../pedal/params'
import { initialGlobals, initialLivePatch, type Patch } from '../pedal/presets'
import { BLOCKS } from '../viz/links'
import { flowState, MOD_PARAMS, STAGES } from './stages'

function settings(values: Partial<Patch['values']> = {}, extra: Partial<PedalSettings> = {}) {
  const patch = initialLivePatch()
  return {
    patch: { ...patch, values: { ...patch.values, ...values } },
    globals: initialGlobals(),
    engaged: true,
    frozen: false,
    ...extra,
  } satisfies PedalSettings
}

describe('flow stages', () => {
  it('runs in signal order from IN to OUT, each on a chain block', () => {
    expect(STAGES[0].id).toBe('input')
    expect(STAGES.at(-1)?.id).toBe('out')
    for (const s of STAGES) expect(BLOCKS).toContain(s.block)
  })

  it('places every parameter in a stage or a modulator', () => {
    const placed = new Set([
      ...STAGES.flatMap((s) => s.params),
      ...Object.values(MOD_PARAMS).flat(),
    ])
    for (const p of PARAMS) expect(placed.has(p.id), p.id).toBe(true)
  })

  it('feeds each stage the previous stage’s output', () => {
    for (let i = 2; i < STAGES.length; i++) {
      // The gate and output show the same tap on both sides; everything else chains.
      if (STAGES[i].id === 'out') continue
      expect(STAGES[i].waveIn, STAGES[i].id).toBe(STAGES[i - 1].waveOut)
    }
  })
})

describe('flowState', () => {
  it('greys out the synth path when bypassed', () => {
    const f = flowState(settings({}, { engaged: false }))
    expect(f.stages.filter).toBe('bypassed')
    expect(f.stages.input).toBe('on')
    expect(f.stages.out).toBe('on')
    expect(Object.values(f.mods).some(Boolean)).toBe(false)
  })

  it('turns the chorus and compressor off at minimum', () => {
    const f = flowState(settings({ mod: 0, comp: 0 }))
    expect(f.stages.chorus).toBe('off')
    expect(f.stages.comp).toBe('off')
    const g = flowState(settings({ mod: 0.5, modBlend: 0.2, comp: 0.4 }))
    expect(g.stages.chorus).toBe('on')
    expect(g.stages.comp).toBe('on')
    expect(flowState(settings({ mod: 0.5, modBlend: 1 })).stages.chorus).toBe('off')
  })

  it('knows which modulators are moving something', () => {
    const quiet = flowState(settings({ glide: 0, envelope: 0, mod: 0, ampEnv: 0 }))
    expect(quiet.mods).toEqual({ glide: false, filterEnv: false, lfo: false, ampEnv: false })
    // An envelope with FILTER ENV AMT at noon moves nothing.
    expect(flowState(settings({ envelope: 0.5, envAmount: 0.5 })).mods.filterEnv).toBe(false)
    const busy = flowState(
      settings({ glide: 0.3, envelope: 0.5, envAmount: 0.2, mod: 0.5, modBlend: 0.6, ampEnv: 0.4 }),
    )
    expect(busy.mods).toEqual({ glide: true, filterEnv: true, lfo: true, ampEnv: true })
  })

  it('reports DRY THRU FX and the output mode', () => {
    expect(flowState(settings({ dryThru: 1 })).dryThru).toBe(true)
    const s = settings()
    s.globals = { ...s.globals, outMode: 0.5 }
    expect(flowState(s).outputMode).toBe('wetdry')
    s.globals = { ...s.globals, outMode: 1 }
    expect(flowState(s).outputMode).toBe('stereo')
  })
})
