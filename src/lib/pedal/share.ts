/**
 * Compact, URL-safe patch codes for "copy link to this sound":
 * `1.<shape>.<voice>.<v1>.<v2>…` with values as 0–100 in PRESET_PARAM_IDS order.
 */
import { normalize, PARAM, PRESET_PARAM_IDS } from './params'
import { SHAPES, type Patch } from './presets'

const VERSION = '1'

export function encodePatch(p: Patch): string {
  const values = PRESET_PARAM_IDS.map((id) => Math.round(p.values[id] * 100))
  return [VERSION, SHAPES.indexOf(p.shape), p.voiceOn ? 1 : 0, ...values].join('.')
}

/** Returns null for anything that isn't a valid code, so a bad link never breaks the app. */
export function decodePatch(code: string): Patch | null {
  const parts = code.split('.')
  if (parts[0] !== VERSION || parts.length !== 3 + PRESET_PARAM_IDS.length) return null
  const nums = parts.slice(1).map(Number)
  if (nums.some((n) => !Number.isInteger(n))) return null
  const [shape, voice, ...values] = nums
  if (!SHAPES[shape] || (voice !== 0 && voice !== 1)) return null
  if (values.some((v) => v < 0 || v > 100)) return null
  return {
    shape: SHAPES[shape],
    voiceOn: voice === 1,
    values: Object.fromEntries(
      PRESET_PARAM_IDS.map((id, i) => [id, normalize(PARAM[id], values[i] / 100)]),
    ) as Patch['values'],
  }
}

/** Reads `p=` from a hash like `#/?p=1.1.0.70…`. */
export function patchFromHash(hash: string): Patch | null {
  const query = hash.split('?')[1]
  if (!query) return null
  const code = new URLSearchParams(query).get('p')
  return code ? decodePatch(code) : null
}

export function shareUrl(p: Patch, location: Pick<Location, 'origin' | 'pathname'>): string {
  return `${location.origin}${location.pathname}#/?p=${encodePatch(p)}`
}
