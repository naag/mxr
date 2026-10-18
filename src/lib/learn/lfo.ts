/**
 * LFO widget maths (Learn chapter 10): where the dot sits on the LFO's sine and how far it
 * moves the cutoff, using the same mappings as the DSP (pedal-dsp.ts).
 */
import { cutoffHz, modDepthRate } from '../pedal/params'

export interface LfoView {
  rateHz: number
  /** Octaves the LFO moves the cutoff at its peak (MOD × MOD BLEND × 1.5). */
  depthOct: number
  /** LFO value now, −1…1. */
  value: number
  /** Phase now, 0–1. */
  phase: number
  /** The cutoff right now, Hz. */
  cutoffNow: number
  cutoffMin: number
  cutoffMax: number
}

export function lfoView(mod: number, modBlend: number, cutoff: number, seconds: number): LfoView {
  const { depth, rateHz } = modDepthRate(mod)
  const depthOct = mod <= 0.005 ? 0 : depth * modBlend * 1.5
  const phase = (seconds * rateHz) % 1
  const value = Math.sin(2 * Math.PI * phase)
  const base = cutoffHz(cutoff)
  return {
    rateHz,
    depthOct,
    value,
    phase,
    cutoffNow: base * 2 ** (depthOct * value),
    cutoffMin: base * 2 ** -depthOct,
    cutoffMax: base * 2 ** depthOct,
  }
}
