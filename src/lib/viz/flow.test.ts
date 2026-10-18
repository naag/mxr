import { describe, expect, it } from 'vitest'
import type { PedalSettings } from '../audio/dsp/pedal-dsp'
import { clock, PARAMS } from '../pedal/params'
import { FACTORY_PRESETS, initialGlobals, initialLivePatch, type Patch } from '../pedal/presets'
import { FLOW_STAGES, flowState, stagesForBlocks } from './flow'
import { BLOCKS } from './links'

function settings(
  values: Partial<Patch['values']> = {},
  extra: Partial<Omit<PedalSettings, 'patch'>> & { voiceOn?: boolean } = {},
): PedalSettings {
  const patch = initialLivePatch()
  return {
    patch: { ...patch, voiceOn: extra.voiceOn ?? false, values: { ...patch.values, ...values } },
    globals: { ...initialGlobals(), ...extra.globals },
    engaged: extra.engaged ?? true,
    frozen: false,
  }
}

describe('flow stages', () => {
  it('run in signal order, each taking in what the one before hands on', () => {
    for (let i = 2; i < FLOW_STAGES.length; i++) {
      expect(FLOW_STAGES[i].inTap, FLOW_STAGES[i].id).toBe(FLOW_STAGES[i - 1].outTap)
    }
  })

  it('cover every parameter and every signal-chain block', () => {
    const params = new Set(
      FLOW_STAGES.flatMap((s) => [...s.params, ...(s.mods ?? []).flatMap((m) => m.params)]),
    )
    for (const p of PARAMS) expect(params.has(p.id), p.id).toBe(true)
    for (const b of BLOCKS) expect(stagesForBlocks([b]).length, b).toBeGreaterThan(0)
  })
})

describe('flowState', () => {
  it('greys out chorus and compressor when their knobs are at minimum', () => {
    const f = flowState(settings({ mod: 0, comp: 0 }))
    expect(f.stages.chorus).toBe('modOff')
    expect(f.stages.comp).toBe('compOff')
    expect(f.mods.lfo).toBe('modOff')
    expect(f.stages.filter).toBeNull()
  })

  it('splits MOD between chorus and LFO with MOD BLEND', () => {
    expect(flowState(settings({ mod: 0.5, modBlend: 0 })).mods.lfo).toBe('allChorus')
    expect(flowState(settings({ mod: 0.5, modBlend: 1 })).stages.chorus).toBe('allLfo')
    const both = flowState(settings({ mod: 0.5, modBlend: 0.5 }))
    expect(both.stages.chorus).toBeNull()
    expect(both.mods.lfo).toBeNull()
  })

  it('shows the filter envelope idle when ENVELOPE is off or the amount is at noon', () => {
    expect(flowState(settings({ envelope: 0 })).mods.filterEnv).toBe('envOff')
    expect(flowState(settings({ envelope: 0.5, envAmount: 0.5 })).mods.filterEnv).toBe('envZero')
    expect(flowState(settings({ envelope: 0.5, envAmount: 0.2 })).mods.filterEnv).toBeNull()
  })

  it('lists the oscillators you can hear', () => {
    expect(flowState(settings({ sub: 0, noise: 0 })).sources).toEqual(['main'])
    const all = flowState(settings({ sub: 0.5, noise: 0.3, voiceMix: 0.6 }, { voiceOn: true }))
    expect(all.sources).toEqual(['main', 'voices', 'sub', 'noise'])
    expect(flowState(settings({ sub: 1, noise: 0 })).sources).toEqual(['sub'])
  })

  it('routes the clean bass per MIX and OUTPUT MODE', () => {
    expect(flowState(settings({ mix: 0.5 })).dry).toBe('mix')
    expect(flowState(settings({ mix: 1 })).dry).toBe('muted')
    const wetDry = flowState(
      settings({ mix: 0.5 }, { globals: { ...initialGlobals(), outMode: 0.5 } }),
    )
    expect(wetDry.outMode).toBe('wetDry')
    expect(wetDry.dry).toBe('right')
    expect(wetDry.stages.mix).toBe('wetDry')
    const stereo = flowState(settings({}, { globals: { ...initialGlobals(), outMode: 1 } }))
    expect(stereo.outMode).toBe('stereo')
  })

  it('sends the clean bass through the effects with DRY THRU FX on', () => {
    expect(flowState(settings({ dryThru: 0 })).dryThru).toBe(false)
    expect(flowState(settings({ dryThru: 1 })).dryThru).toBe(true)
  })

  it('bypass leaves only the clean path', () => {
    const f = flowState(settings({ mod: clock(14), comp: clock(12) }, { engaged: false }))
    expect(f.dry).toBe('bypass')
    expect(f.dryThru).toBe(false)
    for (const s of FLOW_STAGES) {
      expect(f.stages[s.id]).toBe(s.id === 'input' || s.id === 'out' ? null : 'bypassed')
    }
    expect(Object.values(f.mods).every((m) => m === 'bypassed')).toBe(true)
  })

  it('has every stage busy in at least one factory preset', () => {
    const busy = new Set<string>()
    for (const patch of FACTORY_PRESETS) {
      const f = flowState({ patch, globals: initialGlobals(), engaged: true, frozen: false })
      for (const [id, idle] of Object.entries(f.stages)) if (!idle) busy.add(id)
    }
    expect([...busy].sort()).toEqual(FLOW_STAGES.map((s) => s.id).sort())
  })
})
