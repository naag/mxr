/** Which Learn chapters are done, remembered in localStorage (guarded like the pedal's). */
const KEY = 'bass-synth-explorer/learn/v1'

export function loadProgress(storage: Storage | null): number[] {
  try {
    const data = JSON.parse(storage?.getItem(KEY) ?? '[]') as unknown
    return Array.isArray(data) ? data.filter((n): n is number => Number.isInteger(n)) : []
  } catch {
    return []
  }
}

export function saveProgress(storage: Storage | null, done: number[]) {
  try {
    storage?.setItem(KEY, JSON.stringify([...new Set(done)].sort((a, b) => a - b)))
  } catch {
    // Storage full or blocked: progress just won't stick.
  }
}
