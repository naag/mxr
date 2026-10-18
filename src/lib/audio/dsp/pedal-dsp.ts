/**
 * The whole pedal as one sample-by-sample processor (docs/pedal-reference.md §9):
 *
 *   virtual bass ─┬───────────────────────────────── dry ─────────────┐
 *                 └─ follower (level) ─┐                                ▼
 *   notes → glide → oscillators (shape, voices, sub, noise) → ladder → amp → chorus → comp → MIX → gain → out
 *                          filter envelope + LFO ──┘          fade-in ┘
 *
 * Pure TypeScript with no Web Audio types: the AudioWorklet (Phase 4), the offline renders
 * for the visuals (Phase 5) and the unit tests all run this same code.
 */
import {
  ampAttackMs,
  cutoffHz,
  envAmountOctaves,
  envelopeTimes,
  glideMs,
  modDepthRate,
  outGainDb,
  resonanceFeedback,
  stepIndex,
  PARAM,
} from '../../pedal/params'
import type { Globals, Patch, Shape } from '../../pedal/presets'
import { midiToHz } from './analysis'
import { Chorus, Compressor } from './effects'
import { LadderFilter } from './ladder'
import { ADEnvelope, FadeIn, Follower, Glide, Lfo } from './modulation'
import { Noise, Oscillator, subOctave } from './oscillator'
import { Pluck } from './pluck'

/** ASSUMPTION: VOICE adds a fifth and an octave above (docs/pedal-reference.md §3). */
export const VOICE_INTERVALS = [7, 12] as const

/** ASSUMPTION: how long the pitch detector needs before a note sounds, per TRACKING mode. */
export const TRACKING_DELAY_MS = [20, 12, 6] as const

/** How far the LFO swings the cutoff, in octaves either way, for MOD and MOD BLEND. */
export const lfoOctaves = (mod: number, modBlend: number) =>
  modDepthRate(mod).depth * modBlend * 1.5

/** Notes softer than this don't trigger the synth (ASSUMPTION on the exact curve). */
export const gateThreshold = (gateSens: number) => 0.3 * (1 - gateSens)

/** Follower level of a medium pluck, used to scale the synth to about unity. */
const LEVEL_REFERENCE = 0.35

export interface PedalSettings {
  patch: Patch
  globals: Globals
  engaged: boolean
  frozen: boolean
}

export interface PedalFrame {
  left: number
  right: number
  /** Tap points for the visuals, all mono. */
  dry: number
  osc: number
  filter: number
  amp: number
  /** After the chorus, before the compressor. */
  chorus: number
  /** After chorus and compressor (the wet signal before MIX). */
  fx: number
  /** Control values for the envelope, pitch and LFO graphs. */
  cutoffHz: number
  pitch: number
  gainReductionDb: number
  /** Gain the amp stage applies right now (string level × AMP ENV fade-in), 0–1.5. */
  level: number
}

export interface OscGains {
  main: number
  /** Per harmony voice. */
  voice: number
  sub: number
  noise: number
}

/**
 * How loud each oscillator is in the mix that feeds the filter. SUB MIX and NOISE MIX are
 * equal-power crossfades; the harmony voices sit at half level, scaled by VOICE MIX.
 */
export function oscGains(values: Patch['values'], voiceOn: boolean): OscGains {
  const vm = voiceOn ? values.voiceMix : 0
  const norm = 1 / (1 + 0.5 * vm)
  const subAngle = (values.sub * Math.PI) / 2
  const noiseAngle = (values.noise * Math.PI) / 2
  const tone = Math.cos(subAngle) * Math.cos(noiseAngle)
  return {
    main: tone * norm,
    voice: tone * 0.5 * vm * norm,
    sub: Math.sin(subAngle) * Math.cos(noiseAngle),
    noise: Math.sin(noiseAngle),
  }
}

/** One-pole smoother so knob moves don't click. */
class Smooth {
  value: number
  #coef: number
  target: number
  constructor(sampleRate: number, initial: number, ms = 15) {
    this.value = this.target = initial
    this.#coef = Math.exp(-1 / ((ms / 1000) * sampleRate))
  }
  next() {
    this.value = this.target + this.#coef * (this.value - this.target)
    return this.value
  }
}

/** First-order DC blocker (high-pass at about 8 Hz). */
class DcBlock {
  #x = 0
  #y = 0
  readonly #r: number
  constructor(sampleRate: number) {
    this.#r = 1 - (2 * Math.PI * 8) / sampleRate
  }
  next(x: number) {
    this.#y = x - this.#x + this.#r * this.#y
    this.#x = x
    return this.#y
  }
}

export class PedalDSP {
  readonly #sr: number
  readonly #bass: Pluck
  readonly #follower: Follower
  readonly #glide: Glide
  readonly #main: Oscillator
  readonly #voices: Oscillator[]
  readonly #noise: Noise
  readonly #ladder: LadderFilter
  readonly #filterEnv: ADEnvelope
  readonly #fadeIn: FadeIn
  readonly #lfo: Lfo
  readonly #chorus: Chorus
  readonly #comp: Compressor
  readonly #dcL: DcBlock
  readonly #dcR: DcBlock
  #configured = false

  // Settings, resolved to physical units.
  #shape: Shape = 'saw'
  #gains: OscGains = { main: 1, voice: 0, sub: 0, noise: 0 }
  #envTimes: { attackMs: number; decayMs: number } | null = null
  #envOct = 0
  #ampAttack = 1
  #glideMs = 0
  #lfoOct = 0
  #chorusDepth = 0
  #compAmount = 0
  #dryThru = false
  #outMode = 0
  #gateThreshold = 0
  #trackingDelay = 0
  #engaged = true
  #frozen = false
  #cutoff: Smooth
  #k: Smooth
  #mix: Smooth
  #gain: Smooth

  #pending: { midi: number; velocity: number; samplesLeft: number } | null = null
  #gate = 0
  #level = 0
  /** Samples since the synth last started a note, or −1 before the first. */
  #age = -1
  readonly #st: [number, number] = [0, 0]

  constructor(sampleRate: number, seed = 1) {
    this.#sr = sampleRate
    this.#bass = new Pluck(sampleRate, seed)
    this.#follower = new Follower(sampleRate, 1, 80)
    this.#glide = new Glide(sampleRate)
    this.#main = new Oscillator(sampleRate)
    this.#voices = VOICE_INTERVALS.map(() => new Oscillator(sampleRate))
    this.#noise = new Noise(seed * 7919 + 1)
    this.#ladder = new LadderFilter(sampleRate)
    this.#filterEnv = new ADEnvelope(sampleRate)
    this.#fadeIn = new FadeIn(sampleRate)
    this.#lfo = new Lfo(sampleRate)
    this.#chorus = new Chorus(sampleRate)
    this.#comp = new Compressor(sampleRate)
    this.#dcL = new DcBlock(sampleRate)
    this.#dcR = new DcBlock(sampleRate)
    this.#cutoff = new Smooth(sampleRate, Math.log2(640))
    this.#k = new Smooth(sampleRate, 0)
    this.#mix = new Smooth(sampleRate, 0.5)
    this.#gain = new Smooth(sampleRate, 1)
  }

  get sampleRate() {
    return this.#sr
  }

  /** Seconds since the synth started the current note (after tracking), or null. */
  get noteAge(): number | null {
    return this.#age < 0 ? null : this.#age / this.#sr
  }

  set({ patch, globals, engaged, frozen }: PedalSettings) {
    const v = patch.values
    this.#shape = patch.shape
    this.#gains = oscGains(v, patch.voiceOn)
    this.#envTimes = envelopeTimes(v.envelope)
    this.#envOct = envAmountOctaves(v.envAmount)
    this.#ampAttack = ampAttackMs(v.ampEnv)
    this.#glideMs = glideMs(v.glide)
    const mod = modDepthRate(v.mod)
    this.#lfo.rateHz = mod.rateHz
    this.#lfoOct = lfoOctaves(v.mod, v.modBlend)
    this.#chorusDepth = mod.depth * (1 - v.modBlend)
    this.#compAmount = v.comp
    this.#dryThru = stepIndex(PARAM.dryThru, v.dryThru) === 1
    this.#outMode = stepIndex(PARAM.outMode, globals.outMode)
    this.#gateThreshold = gateThreshold(globals.gateSens)
    this.#trackingDelay = TRACKING_DELAY_MS[stepIndex(PARAM.tracking, globals.tracking)]
    this.#engaged = engaged
    this.#frozen = frozen
    this.#cutoff.target = Math.log2(cutoffHz(v.cutoff))
    this.#k.target = resonanceFeedback(v.resonance)
    this.#mix.target = v.mix
    this.#gain.target = 10 ** (outGainDb(v.outGain) / 20)
    if (!this.#configured) {
      // The first settings apply at once; later changes glide to avoid clicks.
      for (const s of [this.#cutoff, this.#k, this.#mix, this.#gain]) s.value = s.target
      this.#configured = true
    }
  }

  /** Plucks the virtual bass; the synth follows after the tracking delay. */
  noteOn(midi: number, velocity = 0.8) {
    this.#bass.pluck(midiToHz(midi), velocity)
    if (velocity < this.#gateThreshold) return
    this.#pending = {
      midi,
      velocity,
      samplesLeft: Math.round((this.#trackingDelay / 1000) * this.#sr),
    }
  }

  noteOff() {
    if (this.#frozen) return
    this.#bass.damp()
  }

  #startNote(midi: number) {
    this.#glide.setTarget(midi, this.#glideMs)
    if (this.#envTimes) this.#filterEnv.trigger(this.#envTimes.attackMs, this.#envTimes.decayMs)
    this.#fadeIn.trigger(this.#ampAttack)
    this.#gate = 1
    this.#age = 0
  }

  /** Renders one sample into `f` (reused to avoid allocation in the audio thread). */
  tick(f: PedalFrame): void {
    if (this.#pending && this.#pending.samplesLeft-- <= 0) {
      this.#startNote(this.#pending.midi)
      this.#pending = null
    }

    if (this.#age >= 0) this.#age++
    const dry = this.#bass.next()
    if (!this.#frozen) this.#level = this.#follower.next(dry)

    // Oscillators
    const pitch = this.#glide.next()
    const hz = midiToHz(pitch)
    this.#main.setFrequency(hz)
    const sub = subOctave(this.#main)
    const g = this.#gains
    let osc = g.main * this.#main.next(this.#shape) + g.sub * sub
    if (g.voice > 0) {
      for (let i = 0; i < this.#voices.length; i++) {
        this.#voices[i].setFrequency(hz * 2 ** (VOICE_INTERVALS[i] / 12))
        osc += g.voice * this.#voices[i].next(this.#shape)
      }
    }
    osc += g.noise * this.#noise.next()

    // Filter
    const envOct = this.#envTimes ? this.#envOct * this.#filterEnv.next() : 0
    const lfoOct = this.#lfoOct * this.#lfo.next()
    const fc = 2 ** (this.#cutoff.next() + envOct + lfoOct)
    const filterIn = 0.7 * osc + (this.#dryThru ? 1.5 * dry : 0)
    const filtered = this.#ladder.process(filterIn, fc, this.#k.next())

    // Amp: follows the string's level, with the AMP ENV fade-in; silent until a note starts.
    const level = Math.min(1.5, this.#level / LEVEL_REFERENCE)
    const ampGain = this.#fadeIn.next() * level * this.#gate
    const amp = filtered * ampGain

    // Effects
    const st = this.#st
    this.#chorus.process(amp, this.#chorusDepth, st)
    const chorus = 0.5 * (st[0] + st[1])
    this.#comp.process(st[0], st[1], this.#compAmount, st)
    // Very low cutoffs and fast envelopes can leave an offset; keep it out of the output.
    const wetL = this.#dcL.next(st[0])
    const wetR = this.#dcR.next(st[1])

    // Blend and output
    const mixAngle = (this.#mix.next() * Math.PI) / 2
    const dryGain = Math.cos(mixAngle)
    const wetGain = Math.sin(mixAngle)
    const gain = this.#gain.next()
    let left: number
    let right: number
    if (!this.#engaged) {
      // True bypass in MONO mode; the buffered modes pass the dry signal the same way here.
      left = right = dry
    } else if (this.#outMode === 1) {
      left = wetL * gain
      right = dry
    } else if (this.#outMode === 2) {
      left = (dryGain * dry + wetGain * wetL) * gain
      right = (dryGain * dry + wetGain * wetR) * gain
    } else {
      left = right = (dryGain * dry + wetGain * 0.5 * (wetL + wetR)) * gain
    }

    f.left = left
    f.right = right
    f.dry = dry
    f.osc = osc
    f.filter = filtered
    f.amp = amp
    f.chorus = chorus
    f.fx = 0.5 * (wetL + wetR)
    f.cutoffHz = fc
    f.pitch = pitch
    f.gainReductionDb = this.#comp.reductionDb
    f.level = ampGain
  }
}

export function emptyFrame(): PedalFrame {
  return {
    left: 0,
    right: 0,
    dry: 0,
    osc: 0,
    filter: 0,
    amp: 0,
    chorus: 0,
    fx: 0,
    cutoffHz: 0,
    pitch: 0,
    gainReductionDb: 0,
    level: 0,
  }
}
