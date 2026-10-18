import { describe as group, expect, it } from 'vitest'
import { KNOBS } from './layout'
import {
  ampAttackMs,
  clock,
  cutoffHz,
  describe,
  envAmountOctaves,
  envelopeTimes,
  formatValue,
  glideMs,
  GLOBAL_PARAM_IDS,
  normalize,
  outGainDb,
  PARAM,
  paramAt,
  PARAMS,
  PRESET_PARAM_IDS,
  stepIndex,
} from './params'

group('parameter table', () => {
  it('has one parameter per knob per layer (6 × 3)', () => {
    expect(PARAMS).toHaveLength(18)
    for (const k of KNOBS) {
      for (const layer of ['main', 'voice', 'shape'] as const) {
        expect(paramAt(k.id, layer).knob).toBe(k.id)
      }
    }
  })

  it('matches the manual’s secondary layout', () => {
    expect(paramAt('mix', 'voice').label).toBe('VOICE MIX')
    expect(paramAt('sub', 'voice').label).toBe('NOISE MIX')
    expect(paramAt('cutoff', 'voice').label).toBe('FILTER ENV AMT')
    expect(paramAt('resonance', 'voice').label).toBe('GLIDE')
    expect(paramAt('envelope', 'voice').label).toBe('AMP ENV')
    expect(paramAt('mod', 'voice').label).toBe('MOD BLEND')
    expect(paramAt('mix', 'shape').label).toBe('COMP')
    expect(paramAt('sub', 'shape').label).toBe('OUTPUT GAIN')
    expect(paramAt('cutoff', 'shape').label).toBe('GATE SENS.')
    expect(paramAt('resonance', 'shape').label).toBe('TRACKING')
    expect(paramAt('envelope', 'shape').label).toBe('DRY THRU FX')
    expect(paramAt('mod', 'shape').label).toBe('OUTPUT MODE')
  })

  it('marks GATE SENS., TRACKING and OUTPUT MODE as global', () => {
    expect(GLOBAL_PARAM_IDS.sort()).toEqual(['gateSens', 'outMode', 'tracking'])
    expect(PRESET_PARAM_IDS).toHaveLength(15)
  })

  it('lets only the main and VOICE layers follow an expression pedal', () => {
    for (const p of PARAMS) expect(p.expressionable).toBe(p.layer !== 'shape')
  })

  it('starts every value inside 0–1', () => {
    for (const p of PARAMS) {
      expect(p.initial).toBeGreaterThanOrEqual(0)
      expect(p.initial).toBeLessThanOrEqual(1)
    }
  })
})

group('clock', () => {
  it('converts clock positions to knob values', () => {
    expect(clock(7)).toBe(0)
    expect(clock(12)).toBe(0.5)
    expect(clock(17)).toBe(1)
    expect(clock(10)).toBe(0.3)
  })
})

group('stepped controls', () => {
  it('snap to their detents', () => {
    expect(normalize(PARAM.tracking, 0.3)).toBe(0.5)
    expect(normalize(PARAM.tracking, 0.8)).toBe(1)
    expect(normalize(PARAM.dryThru, 0.4)).toBe(0)
    expect(normalize(PARAM.dryThru, 0.6)).toBe(1)
    expect(stepIndex(PARAM.outMode, 0.5)).toBe(1)
  })

  it('leave continuous controls alone apart from clamping', () => {
    expect(normalize(PARAM.cutoff, 0.37)).toBe(0.37)
    expect(normalize(PARAM.cutoff, 1.2)).toBe(1)
  })
})

group('mappings', () => {
  it('CUTOFF spans 40 Hz to about 10 kHz, exponentially', () => {
    expect(cutoffHz(0)).toBe(40)
    expect(cutoffHz(1)).toBe(10240)
    expect(cutoffHz(0.5)).toBe(640)
    expect(cutoffHz(0.3)).toBeCloseTo(211, 0)
  })

  it('ENVELOPE is off at minimum and gets slower to the right', () => {
    expect(envelopeTimes(0)).toBeNull()
    const quick = envelopeTimes(0.1)!
    const slow = envelopeTimes(0.9)!
    expect(slow.attackMs).toBeGreaterThan(quick.attackMs)
    expect(slow.decayMs).toBeGreaterThan(quick.decayMs)
    expect(envelopeTimes(1)!.decayMs).toBeCloseTo(3000)
  })

  it('FILTER ENV AMT is bipolar around noon', () => {
    expect(envAmountOctaves(0.5)).toBe(0)
    expect(envAmountOctaves(0)).toBe(-5)
    expect(envAmountOctaves(1)).toBe(5)
  })

  it('OUTPUT GAIN is ±18 dB with 0 dB at noon', () => {
    expect(outGainDb(0)).toBe(-18)
    expect(outGainDb(0.5)).toBe(0)
    expect(outGainDb(1)).toBe(18)
  })

  it('GLIDE is off at minimum and reaches about a second', () => {
    expect(glideMs(0)).toBe(0)
    expect(glideMs(1)).toBe(1000)
  })

  it('AMP ENV fades in over 1 ms to 1.5 s', () => {
    expect(ampAttackMs(0)).toBe(1)
    expect(ampAttackMs(1)).toBe(1500)
  })
})

group('readouts', () => {
  it.each([
    ['cutoff', 0.3, '211 Hz'],
    ['cutoff', 1, '10.2 kHz'],
    ['envelope', 0, 'off'],
    ['envAmount', 0.7, '+2.0 oct, opens'],
    ['envAmount', 0.2, '−3.0 oct, closes'],
    ['outGain', 0.5, '+0.0 dB'],
    ['tracking', 0.5, '4S'],
    ['outMode', 1, 'STEREO'],
    ['modBlend', 0.2, '80% chorus, 20% LFO'],
    ['comp', 1, '100%, limiting'],
  ] as const)('%s at %d reads “%s”', (id, v, text) => {
    expect(formatValue(id, v)).toBe(text)
  })

  it('adds the clock position for continuous controls', () => {
    expect(describe('cutoff', 0.3)).toBe('10 o’clock, 211 Hz')
    expect(describe('dryThru', 1)).toBe('ON')
  })
})
