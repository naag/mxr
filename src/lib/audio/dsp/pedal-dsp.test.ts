import { describe, expect, it } from 'vitest'
import { clock } from '../../pedal/params'
import {
  FACTORY_PRESETS,
  initialGlobals,
  initialLivePatch,
  PRESET_INFO,
  type Globals,
  type Patch,
} from '../../pedal/presets'
import { renderOffline, type NoteEvent } from '../render'
import { estimatePitch, magnitudeAt, midiToHz, peak, rms, spectralCentroid } from './analysis'
import { emptyFrame, PedalDSP, type PedalSettings } from './pedal-dsp'

const SR = 48000
const A1 = 33
const riff: NoteEvent[] = [
  { at: 0.05, midi: A1, length: 0.4 },
  { at: 0.5, midi: 36, length: 0.3 },
  { at: 0.9, midi: 40, length: 0.5 },
]
const held: NoteEvent[] = [{ at: 0.01, midi: A1, length: 1.5 }]

function settings(
  patch: Patch = initialLivePatch(),
  values: Partial<Patch['values']> = {},
  extra: { engaged?: boolean; frozen?: boolean; globals?: Partial<Globals> } = {},
): PedalSettings {
  return {
    patch: { ...patch, values: { ...patch.values, ...values } },
    globals: { ...initialGlobals(), ...extra.globals },
    engaged: extra.engaged ?? true,
    frozen: extra.frozen ?? false,
  }
}

/** A plain patch for cause-and-effect tests: saw, no envelope, no mod, no compression. */
const plain = (values: Partial<Patch['values']> = {}, patch: Partial<Patch> = {}) =>
  settings(
    { ...initialLivePatch(), shape: 'saw', voiceOn: false, ...patch },
    {
      mix: 1,
      sub: 0,
      cutoff: clock(13),
      resonance: 0,
      envelope: 0,
      mod: 0,
      comp: 0,
      noise: 0,
      glide: 0,
      ampEnv: 0,
      ...values,
    },
  )

const slice = (x: Float32Array, from: number, to: number) =>
  x.subarray(Math.round(from * SR), Math.round(to * SR))

describe('every preset renders cleanly', () => {
  const all = [
    ['Live mode', initialLivePatch()] as const,
    ...FACTORY_PRESETS.map((p, i) => [PRESET_INFO[i].name, p] as const),
  ]
  it.each(all)('%s', (_, patch) => {
    const r = renderOffline(settings(patch), riff, 1.6, SR)
    for (const tap of ['left', 'right', 'dry', 'osc', 'filter', 'amp', 'fx'] as const) {
      expect(r[tap].every(Number.isFinite)).toBe(true)
    }
    // Headroom before the master limiter (Phase 4).
    expect(peak(r.left)).toBeLessThan(1.5)
    expect(peak(r.right)).toBeLessThan(1.5)
    // The synth is actually playing while notes sound.
    expect(rms(slice(r.amp, 0.1, 0.4))).toBeGreaterThan(0.02)
    const mean = r.left.reduce((a, b) => a + b, 0) / r.left.length
    expect(Math.abs(mean)).toBeLessThan(0.02)
  })
})

describe('signal path', () => {
  it('passes the clean bass untouched when bypassed', () => {
    const r = renderOffline(settings(FACTORY_PRESETS[2], {}, { engaged: false }), riff, 1, SR)
    expect(r.left).toEqual(r.dry)
    expect(r.right).toEqual(r.dry)
  })

  it('MIX fully left is only the clean bass', () => {
    const r = renderOffline(plain({ mix: 0 }), riff, 1, SR)
    for (let i = SR * 0.1; i < SR * 0.9; i += 97) expect(r.left[i]).toBeCloseTo(r.dry[i], 3)
  })

  it('is deterministic', () => {
    const a = renderOffline(settings(FACTORY_PRESETS[6]), riff, 0.5, SR)
    const b = renderOffline(settings(FACTORY_PRESETS[6]), riff, 0.5, SR)
    expect(a.left).toEqual(b.left)
  })
})

describe('controls do what they say', () => {
  it('CUTOFF lower → darker (lower spectral centroid)', () => {
    const centroid = (cutoff: number) =>
      spectralCentroid(slice(renderOffline(plain({ cutoff }), held, 0.6, SR).filter, 0.2, 0.55), SR)
    const dark = centroid(clock(9))
    const mid = centroid(clock(12))
    const bright = centroid(clock(16))
    expect(dark).toBeLessThan(mid)
    expect(mid).toBeLessThan(bright)
  })

  it('RESONANCE boosts the harmonic nearest the cutoff', () => {
    const at = (resonance: number) => {
      const r = renderOffline(plain({ cutoff: clock(10), resonance }), held, 0.6, SR)
      // CUTOFF at 10 o’clock ≈ 211 Hz; A1’s 4th harmonic is 220 Hz.
      return magnitudeAt(slice(r.filter, 0.2, 0.55), 4 * midiToHz(A1), SR)
    }
    expect(at(clock(16))).toBeGreaterThan(at(0) * 2)
  })

  it('SUB MIX fully right drops the oscillator one octave', () => {
    const pitch = (sub: number) =>
      estimatePitch(slice(renderOffline(plain({ sub }), held, 0.6, SR).osc, 0.1, 0.5), SR, 20, 200)
    expect(pitch(0)).toBeCloseTo(midiToHz(A1), 0)
    expect(pitch(1)).toBeCloseTo(midiToHz(A1) / 2, 0)
  })

  it('VOICE adds the fifth above', () => {
    const fifth = (voiceOn: boolean) => {
      const r = renderOffline(plain({ voiceMix: 1 }, { voiceOn }), held, 0.6, SR)
      return magnitudeAt(slice(r.osc, 0.1, 0.5), midiToHz(A1 + 7), SR)
    }
    expect(fifth(true)).toBeGreaterThan(fifth(false) * 5)
  })

  it('NOISE MIX makes the oscillator noisy (brighter)', () => {
    const c = (noise: number) =>
      spectralCentroid(slice(renderOffline(plain({ noise }), held, 0.5, SR).osc, 0.1, 0.45), SR)
    expect(c(1)).toBeGreaterThan(c(0) * 3)
  })

  it('ENVELOPE with positive amount opens the filter after each note; negative ducks it', () => {
    const base = 40 * 2 ** (8 * clock(10))
    const up = renderOffline(
      plain({ cutoff: clock(10), envelope: clock(10), envAmount: clock(15) }),
      held,
      0.6,
      SR,
    )
    const down = renderOffline(
      plain({ cutoff: clock(10), envelope: clock(10), envAmount: clock(9) }),
      held,
      0.6,
      SR,
    )
    const at = (r: typeof up, t: number) => r.cutoffHz[Math.round(t * SR)]
    // Tracking delay (5S) is 20 ms; the attack at 10 o’clock is about 5 ms.
    expect(at(up, 0.04)).toBeGreaterThan(base * 4)
    expect(at(down, 0.04)).toBeLessThan(base / 3)
    // …and both settle back towards the knob setting.
    expect(at(up, 0.55)).toBeLessThan(base * 1.2)
    expect(at(down, 0.55)).toBeGreaterThan(base / 1.2)
  })

  it('ENVELOPE at minimum leaves the cutoff alone', () => {
    const r = renderOffline(plain({ envelope: 0, envAmount: 1 }), held, 0.3, SR)
    expect(peak(r.cutoffHz.subarray(SR * 0.1)) / r.cutoffHz[SR * 0.2]).toBeCloseTo(1, 3)
  })

  it('GLIDE slides the pitch over the glide time', () => {
    const notes: NoteEvent[] = [
      { at: 0.01, midi: A1, length: 0.29 },
      { at: 0.3, midi: A1 + 12, length: 0.5 },
    ]
    const r = renderOffline(plain({ glide: clock(13) }), notes, 0.8, SR)
    const glide = 5 * 200 ** clock(13)
    const start = 0.3 + 0.02 // after the tracking delay
    const half = r.pitch[Math.round((start + glide / 2000) * SR)]
    expect(half).toBeGreaterThan(A1 + 4)
    expect(half).toBeLessThan(A1 + 8)
    expect(r.pitch[Math.round((start + glide / 1000 + 0.01) * SR)]).toBeCloseTo(A1 + 12, 3)
  })

  it('without GLIDE the pitch jumps', () => {
    const notes: NoteEvent[] = [
      { at: 0.01, midi: A1, length: 0.29 },
      { at: 0.3, midi: A1 + 12, length: 0.3 },
    ]
    const r = renderOffline(plain({ glide: 0 }), notes, 0.5, SR)
    expect(r.pitch[Math.round(0.33 * SR)]).toBe(A1 + 12)
  })

  it('AMP ENV fades each note in', () => {
    const fast = renderOffline(plain({ ampEnv: 0 }), held, 0.5, SR)
    const slow = renderOffline(plain({ ampEnv: clock(14) }), held, 0.5, SR)
    expect(rms(slice(slow.amp, 0.03, 0.08))).toBeLessThan(rms(slice(fast.amp, 0.03, 0.08)) * 0.3)
  })

  it('MOD toward LFO wobbles the cutoff', () => {
    const r = renderOffline(plain({ mod: 1, modBlend: 1 }), held, 1, SR)
    const fc = r.cutoffHz.subarray(SR * 0.1)
    expect(peak(fc) / Math.min(...fc)).toBeGreaterThan(3)
  })

  it('COMP narrows the level difference between loud and soft notes', () => {
    const notes: NoteEvent[] = [
      { at: 0.01, midi: A1, length: 0.4, velocity: 1 },
      { at: 0.5, midi: A1, length: 0.4, velocity: 0.35 },
    ]
    const ratio = (comp: number) => {
      const r = renderOffline(plain({ comp }), notes, 1, SR)
      return rms(slice(r.left, 0.05, 0.3)) / rms(slice(r.left, 0.55, 0.8))
    }
    expect(ratio(1)).toBeLessThan(ratio(0) * 0.6)
  })

  it('GATE SENS. decides whether a soft note triggers the synth', () => {
    const soft: NoteEvent[] = [{ at: 0.01, midi: A1, length: 0.4, velocity: 0.1 }]
    const ignore = renderOffline(
      settings(initialLivePatch(), {}, { globals: { gateSens: 0 } }),
      soft,
      0.4,
      SR,
    )
    const catchIt = renderOffline(
      settings(initialLivePatch(), {}, { globals: { gateSens: 1 } }),
      soft,
      0.4,
      SR,
    )
    expect(rms(ignore.amp)).toBe(0)
    expect(rms(ignore.dry)).toBeGreaterThan(0)
    expect(rms(catchIt.amp)).toBeGreaterThan(0)
  })

  it('TRACKING: guitar mode starts the synth sooner than 5-string mode', () => {
    const firstSound = (tracking: number) => {
      const r = renderOffline(
        settings(initialLivePatch(), {}, { globals: { tracking } }),
        held,
        0.1,
        SR,
      )
      return r.amp.findIndex((v) => v !== 0)
    }
    expect(firstSound(1)).toBeLessThan(firstSound(0))
  })

  it('OUTPUT MODE: mono is identical on both sides, wet/dry splits, stereo widens', () => {
    const patch = settings(FACTORY_PRESETS[4]) // Sledge: chorus
    const mono = renderOffline(patch, riff, 1, SR)
    expect(mono.left).toEqual(mono.right)
    const wetDry = renderOffline(
      { ...patch, globals: { ...patch.globals, outMode: 0.5 } },
      riff,
      1,
      SR,
    )
    expect(wetDry.right).toEqual(wetDry.dry)
    const stereo = renderOffline(
      { ...patch, globals: { ...patch.globals, outMode: 1 } },
      riff,
      1,
      SR,
    )
    let diff = 0
    for (let i = 0; i < stereo.left.length; i++) diff += Math.abs(stereo.left[i] - stereo.right[i])
    expect(diff / stereo.left.length).toBeGreaterThan(0.001)
  })

  it('OUTPUT GAIN scales the output', () => {
    const quiet = renderOffline(plain({ outGain: 0 }), held, 0.4, SR)
    const loud = renderOffline(plain({ outGain: 1 }), held, 0.4, SR)
    expect(rms(loud.left) / rms(quiet.left)).toBeCloseTo(10 ** (36 / 20), -1)
  })

  it('freeze holds the note after the string is released', () => {
    const level = (freeze: boolean) => {
      const base = plain()
      const dsp = new PedalDSP(SR)
      dsp.set(base)
      const f = emptyFrame()
      dsp.noteOn(A1)
      for (let i = 0; i < SR * 0.15; i++) dsp.tick(f)
      // The footswitch freezes the note while it's still ringing, then the string is let go.
      if (freeze) dsp.set({ ...base, frozen: true })
      dsp.noteOff()
      const late: number[] = []
      for (let i = 0; i < SR; i++) {
        dsp.tick(f)
        if (i > SR * 0.8) late.push(f.amp)
      }
      return rms(late)
    }
    expect(level(true)).toBeGreaterThan(level(false) * 5)
  })
})
