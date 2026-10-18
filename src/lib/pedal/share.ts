/**
 * Compact, URL-safe patch codes for "copy link to this sound":
 * `1.<shape>.<voice>.<v1>.<v2>…` with values as 0–100 in PRESET_PARAM_IDS order.
 * A patch with an expression toe state uses version 2: the same fields, then one
 * `<index>_<value>` field per toe value (index into EXPRESSION_PARAM_IDS).
 */
import { EXPRESSION_PARAM_IDS, normalize, PARAM, PRESET_PARAM_IDS } from './params'
import { SHAPES, toeChanges, type Patch } from './presets'

const pct = (v: number) => Math.round(v * 100)

export function encodePatch(p: Patch): string {
  const values = PRESET_PARAM_IDS.map((id) => pct(p.values[id]))
  const toe = toeChanges(p).map((id) => `${EXPRESSION_PARAM_IDS.indexOf(id)}_${pct(p.toe![id]!)}`)
  const version = toe.length > 0 ? '2' : '1'
  return [version, SHAPES.indexOf(p.shape), p.voiceOn ? 1 : 0, ...values, ...toe].join('.')
}

const percent = (s: string) => {
  const n = Number(s)
  return Number.isInteger(n) && n >= 0 && n <= 100 && s !== '' ? n : null
}

/** Returns null for anything that isn't a valid code, so a bad link never breaks the app. */
export function decodePatch(code: string): Patch | null {
  const parts = code.split('.')
  const base = 3 + PRESET_PARAM_IDS.length
  const version = parts[0]
  if (version === '1' ? parts.length !== base : version !== '2' || parts.length <= base) return null
  const head = parts.slice(1, base).map(Number)
  if (head.some((n) => !Number.isInteger(n))) return null
  const [shape, voice, ...values] = head
  if (!SHAPES[shape] || (voice !== 0 && voice !== 1)) return null
  if (values.some((v) => v < 0 || v > 100)) return null
  const patch: Patch = {
    shape: SHAPES[shape],
    voiceOn: voice === 1,
    values: Object.fromEntries(
      PRESET_PARAM_IDS.map((id, i) => [id, normalize(PARAM[id], values[i] / 100)]),
    ) as Patch['values'],
  }
  if (version === '1') return patch
  const toe: NonNullable<Patch['toe']> = {}
  for (const part of parts.slice(base)) {
    const [index, value, extra] = part.split('_')
    const id = EXPRESSION_PARAM_IDS[Number(index)]
    const v = percent(value ?? '')
    if (extra !== undefined || !id || !/^\d+$/.test(index) || v === null || id in toe) return null
    toe[id] = v / 100
  }
  patch.toe = toe
  // Version 2 always carries a toe state that changes something.
  return toeChanges(patch).length > 0 ? patch : null
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
