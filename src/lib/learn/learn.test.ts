import { describe, expect, it } from 'vitest'
import { RIFFS } from '../audio/riffs'
import { chapterCopy } from '../content/learn'
import { GLOSSARY, GLOSSARY_BY_ID } from '../content/glossary'
import { initialState, reduce, type MachineEvent, type MachineState } from '../pedal/machine'
import type { KnobId } from '../pedal/layout'
import { clock, PARAM, PARAMS } from '../pedal/params'
import { LAST_CHAPTER } from '../router'
import { harmonicAmp, harmonicsUsed, idealWave, partialSum } from './additive'
import { art } from './art'
import { CHAPTERS, isDone, setupPatch, type ChapterDef } from './chapters'
import { observe, startObservation, type Observation } from './observe'
import { loadProgress, saveProgress } from './progress'
import { parseRich, plainText } from './rich'

/** Runs a chapter like a learner would: set up, then apply events and notes in order. */
function play(chapter: ChapterDef, actions: (MachineEvent | { note: number })[]) {
  let s: MachineState = initialState()
  s = reduce(s, { type: 'load', patch: setupPatch(chapter, s.current) }, 0)
  let obs: Observation = startObservation(s)
  let now = 0
  for (const a of actions) {
    now += 50
    if ('note' in a) obs = observe(obs, s, a.note)
    else {
      s = reduce(s, a, now)
      obs = observe(obs, s)
    }
  }
  return { state: s, obs }
}

const tap = (button: 'foot' | 'voice' | 'shape' | 'presets'): MachineEvent[] => [
  { type: 'down', button },
  { type: 'up', button },
]
const turn = (knob: KnobId, hour: number): MachineEvent => ({
  type: 'turn',
  knob,
  value: clock(hour),
})
const layer = (l: 'main' | 'voice' | 'shape'): MachineEvent => ({ type: 'setLayer', layer: l })

describe('chapters', () => {
  it('has one definition and one text per chapter, with matching steps', () => {
    expect(CHAPTERS.length).toBe(LAST_CHAPTER + 1)
    expect(chapterCopy.length).toBe(CHAPTERS.length)
    CHAPTERS.forEach((c, i) => {
      expect(c.n).toBe(i)
      expect(chapterCopy[i].steps.length, `chapter ${i}`).toBe(c.steps.length)
      expect(c.visuals.length).toBeGreaterThan(0)
      expect(
        RIFFS.some((r) => r.id === c.riff),
        c.riff,
      ).toBe(true)
    })
  })

  it('keeps cards short (≤ 60 words, docs/learning-content.md)', () => {
    for (const c of chapterCopy) {
      for (const text of [c.intro, c.hear, c.see, c.do, c.analogy ?? '', c.more?.text ?? '']) {
        expect(plainText(text).split(/\s+/).length, text).toBeLessThanOrEqual(60)
      }
    }
  })

  it('only links to glossary entries that exist', () => {
    for (const c of chapterCopy) {
      for (const text of [c.intro, c.see, c.more?.text ?? '', c.takeaway]) {
        for (const p of parseRich(text))
          if (p.term) expect(GLOSSARY_BY_ID[p.term], p.term).toBeDefined()
      }
    }
  })

  it('does not count the setup itself as progress', () => {
    for (const c of CHAPTERS) {
      const r = play(c, [])
      expect(isDone(c, r), `chapter ${c.n}`).toBe(false)
    }
  })

  // One learner path per chapter that should satisfy every step.
  const solutions: Record<number, (MachineEvent | { note: number })[]> = {
    0: [...tap('foot'), ...tap('foot')],
    1: [{ note: 28 }, { note: 40 }],
    2: [...tap('shape'), ...tap('shape'), ...tap('shape')],
    3: [turn('sub', 14), ...tap('voice'), layer('voice'), turn('mix', 16)],
    4: [layer('voice'), turn('sub', 15), turn('sub', 9)],
    5: [turn('cutoff', 8), turn('cutoff', 13)],
    6: [turn('resonance', 14), turn('cutoff', 8), turn('cutoff', 15)],
    7: [turn('envelope', 9), turn('envelope', 15), layer('voice'), turn('cutoff', 10)],
    8: [layer('voice'), turn('envelope', 15), turn('envelope', 8)],
    9: [layer('voice'), turn('resonance', 12), { note: 45 }, { note: 33 }],
    10: [turn('mod', 14), layer('voice'), turn('mod', 15)],
    11: [layer('shape'), turn('mix', 15), turn('cutoff', 15), turn('sub', 14)],
    12: [turn('mix', 12), layer('shape'), turn('envelope', 17), turn('mod', 17)],
    13: [...tap('presets'), ...tap('presets'), ...tap('presets')],
  }

  for (const c of CHAPTERS) {
    it(`chapter ${c.n}: the experiment completes every step`, () => {
      const r = play(c, solutions[c.n])
      c.steps.forEach((step, i) => expect(step(r), `step ${i + 1}`).toBe(true))
    })
  }

  it('chapter 5 checks CUTOFF below 9 o’clock, then back above noon', () => {
    const c = CHAPTERS[5]
    expect(c.steps[0](play(c, [turn('cutoff', 10)]))).toBe(false)
    expect(c.steps[0](play(c, [turn('cutoff', 8.5)]))).toBe(true)
    expect(c.steps[1](play(c, [turn('cutoff', 8.5)]))).toBe(false)
  })

  it('setup only changes what the chapter asks for', () => {
    const s = initialState()
    const p = setupPatch(CHAPTERS[5], s.current)
    expect(p.values.cutoff).toBe(clock(14))
    expect(p.values.voiceMix).toBe(s.current.values.voiceMix)
    expect(setupPatch(CHAPTERS[0], s.current)).toEqual(s.current)
  })
})

describe('observe', () => {
  it('counts footswitch taps, shapes, presets and notes', () => {
    let s = initialState()
    let o = startObservation(s)
    expect(observe(o, s)).toBe(o)
    for (const e of [...tap('foot'), ...tap('shape')]) {
      s = reduce(s, e, 100)
      o = observe(o, s)
    }
    o = observe(o, s, 33)
    o = observe(o, s, 33)
    expect(o.engagedToggles).toBe(1)
    expect(o.shapes.length).toBe(2)
    expect(o.notes).toEqual([33])
  })

  it('tracks the range each control has covered, globals included', () => {
    let s = initialState()
    let o = startObservation(s)
    s = reduce(s, { type: 'setLayer', layer: 'shape' }, 0)
    s = reduce(s, { type: 'turn', knob: 'cutoff', value: 1 }, 0)
    o = observe(o, s)
    expect(o.max.gateSens).toBe(1)
    expect(o.min.gateSens).toBe(PARAM.gateSens.initial)
    expect(Object.keys(o.max).length).toBe(PARAMS.length)
  })
})

describe('rich text', () => {
  it('parses glossary links with and without their own words', () => {
    expect(parseRich('A [[cutoff]] and [[low-pass|filter]].')).toEqual([
      { text: 'A ' },
      { text: 'cutoff', term: 'cutoff' },
      { text: ' and ' },
      { text: 'filter', term: 'low-pass' },
      { text: '.' },
    ])
    expect(plainText('no links')).toBe('no links')
  })
})

describe('additive synthesis', () => {
  it('approaches the ideal wave as harmonics are added (mean error shrinks)', () => {
    for (const shape of ['saw', 'square', 'triangle'] as const) {
      const err = (n: number) => {
        const x = partialSum(shape, n, 401)
        let e = 0
        for (let i = 0; i < 401; i++) e += Math.abs(x[i] - idealWave(shape, i / 400))
        return e / 401
      }
      expect(err(32), shape).toBeLessThan(err(4))
      expect(err(32), shape).toBeLessThan(0.08)
    }
  })

  it('uses every harmonic for a saw and only odd ones for square and triangle', () => {
    expect(harmonicsUsed('saw', 8)).toBe(8)
    expect(harmonicsUsed('square', 8)).toBe(4)
    expect(harmonicAmp('triangle', 2)).toBe(0)
    expect(Math.abs(harmonicAmp('triangle', 3))).toBeLessThan(Math.abs(harmonicAmp('square', 3)))
  })
})

describe('glossary', () => {
  it('has unique ids, valid chapter links and drawable illustrations', () => {
    expect(new Set(GLOSSARY.map((g) => g.id)).size).toBe(GLOSSARY.length)
    for (const g of GLOSSARY) {
      if (g.chapter !== undefined) expect(g.chapter).toBeLessThanOrEqual(LAST_CHAPTER)
      if (g.art) for (const p of art(g.art)) expect(p.d).toMatch(/^M[\d.-]/)
    }
  })
})

describe('progress', () => {
  it('round-trips, dedupes, and survives broken storage', () => {
    const store = new Map<string, string>()
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    } as Storage
    saveProgress(storage, [5, 1, 5])
    expect(loadProgress(storage)).toEqual([1, 5])
    store.set('bass-synth-explorer/learn/v1', '{oops')
    expect(loadProgress(storage)).toEqual([])
    expect(loadProgress(null)).toEqual([])
  })
})
