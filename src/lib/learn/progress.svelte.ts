/**
 * Learn progress: how many experiment steps are done in each chapter, remembered in
 * localStorage (wrapped in try/catch, like the pedal's live mode).
 */
import { browserStorage } from '../pedal/storage'
import { CHAPTERS, requiredSteps } from './chapters'
import { advance, type Observation } from './goals'

const KEY = 'bass-synth-explorer/learn/v1'

export class LearnProgress {
  /** Steps done per chapter. */
  steps = $state<number[]>(CHAPTERS.map(() => 0))
  readonly #storage: Storage | null

  constructor(storage: Storage | null = browserStorage()) {
    this.#storage = storage
    try {
      const data = JSON.parse(storage?.getItem(KEY) ?? '{}') as { steps?: unknown }
      const list = data.steps
      if (Array.isArray(list)) {
        this.steps = CHAPTERS.map((c, i) => {
          const n = Number(list[i])
          return Number.isInteger(n) ? Math.max(0, Math.min(c.checks.length, n)) : 0
        })
      }
    } catch {
      // Unreadable progress: start fresh.
    }
  }

  #save() {
    try {
      this.#storage?.setItem(KEY, JSON.stringify({ steps: this.steps }))
    } catch {
      // Storage full or blocked: progress just won't stick.
    }
  }

  /** Checks the chapter's goals against what the pedal and sound do now. */
  observe(chapter: number, o: Observation) {
    const c = CHAPTERS[chapter]
    if (!c) return
    const before = this.steps[chapter]
    const after = advance(c.checks, before, o)
    if (after !== before) {
      this.steps[chapter] = after
      this.#save()
    }
  }

  isDone(chapter: number): boolean {
    const c = CHAPTERS[chapter]
    return !!c && this.steps[chapter] >= requiredSteps(c)
  }

  get doneCount(): number {
    return CHAPTERS.filter((_, i) => this.isDone(i)).length
  }

  reset() {
    this.steps = CHAPTERS.map(() => 0)
    this.#save()
  }
}

let shared: LearnProgress | null = null

/** The app-wide progress (created on first use). */
export function learnProgress(): LearnProgress {
  shared ??= new LearnProgress()
  return shared
}
