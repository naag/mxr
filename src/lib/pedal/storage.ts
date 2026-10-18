/**
 * Remembers the user's live mode, saved presets and global settings, like the real pedal
 * does across power cycles. Storage can be missing or throw (private windows, blocked
 * site data), so every access is guarded and the app works without it.
 */
import { decodePatch, encodePatch } from './share'
import { GLOBAL_PARAM_IDS, normalize, PARAM } from './params'
import { initialGlobals, PRESET_COUNT, type Globals, type Patch } from './presets'

const KEY = 'bass-synth-explorer/pedal/v1'

interface Stored {
  saved: string[]
  globals: Record<string, number>
}

export function loadPedal(storage: Storage | null): { saved: Patch[]; globals: Globals } | null {
  try {
    const raw = storage?.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Stored
    if (!Array.isArray(data.saved) || data.saved.length !== PRESET_COUNT + 1) return null
    const saved = data.saved.map(decodePatch)
    if (saved.some((p) => p === null)) return null
    const globals = initialGlobals()
    for (const id of GLOBAL_PARAM_IDS) {
      const v = data.globals?.[id]
      if (typeof v === 'number') globals[id] = normalize(PARAM[id], v)
    }
    return { saved: saved as Patch[], globals }
  } catch {
    return null
  }
}

export function savePedal(storage: Storage | null, saved: Patch[], globals: Globals): void {
  try {
    const data: Stored = { saved: saved.map(encodePatch), globals }
    storage?.setItem(KEY, JSON.stringify(data))
  } catch {
    // Not fatal: the pedal just won't remember this session.
  }
}

export function browserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}
