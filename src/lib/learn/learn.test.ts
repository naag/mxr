import { describe, expect, it } from 'vitest'
import { chapterCopy } from '../content/learn'
import { glossary, glossaryById } from '../content/glossary'
import { LAST_CHAPTER } from '../router'
import { initialState, reduce } from '../pedal/machine'
import { clock, PARAMS, type PresetParamId } from '../pedal/params'
import { CHAPTER_FOR_PARAM, CHAPTERS, requiredSteps, setupPatch, teachingPatch } from './chapters'
import { advance, observe, type Observation } from './goals'
import { parseRich, plainText } from './rich'

const base = (): Observation => observe(initialState(), { note: null, riff: null })

/** Builds an observation from the live-mode start with some changes. */
function obs(change: {
  values?: Partial<Record<PresetParamId, number>>
  globals?: Partial<Observation['globals']>
  shape?: Observation['shape']
  voiceOn?: boolean
  engaged?: boolean
  preset?: number
  note?: number | null
  riff?: string | null
}): Observation {
  const o = base()
  return {
    ...o,
    ...change,
    values: { ...o.values, ...change.values },
    globals: { ...o.globals, ...change.globals },
  } as Observation
}

/**
 * A way through each chapter's experiment, one observation per step, starting from the
 * chapter's setup sound (or live mode). Proves every chapter can be finished.
 */
const walkthroughs: Partial<Observation>[][] = [
  [{ engaged: false }, { engaged: true }],
  [{ note: 28 }, { note: 40 }],
  [{ shape: 'triangle' }, { shape: 'saw' }, { shape: 'square' }],
  [
    { values: { sub: clock(14) } as never },
    { voiceOn: true },
    { voiceOn: true, values: { voiceMix: clock(16) } as never },
  ],
  [
    { values: { noise: clock(13) } as never },
    { values: { noise: clock(13), cutoff: clock(8) } as never },
    { values: { noise: clock(13), cutoff: clock(16) } as never },
  ],
  [
    { shape: 'saw' },
    { values: { cutoff: clock(8) } as never },
    { values: { cutoff: clock(15) } as never },
  ],
  [
    { values: { resonance: clock(14) } as never },
    { values: { resonance: clock(14), cutoff: clock(9) } as never },
    { values: { resonance: clock(14), cutoff: clock(15) } as never },
  ],
  [
    { values: { envelope: clock(9) } as never },
    { values: { envelope: clock(16) } as never },
    { values: { envelope: clock(16), envAmount: clock(10) } as never },
  ],
  [{ values: { ampEnv: clock(15) } as never }, { values: { ampEnv: clock(8) } as never }],
  [
    { values: { glide: clock(14) } as never },
    { values: { glide: clock(14) } as never, note: 33 },
    { values: { glide: clock(14) } as never, note: 45 },
  ],
  [
    { values: { mod: clock(14) } as never },
    { values: { mod: clock(14), modBlend: clock(7) } as never },
    { values: { mod: clock(14), modBlend: clock(17) } as never },
  ],
  [
    { values: { comp: clock(15) } as never },
    { riff: 'ghost-notes' },
    { globals: { gateSens: clock(8) } as never },
  ],
  [
    { values: { mix: clock(12) } as never },
    { values: { mix: clock(12), dryThru: 1 } as never },
    { globals: { outMode: 1 } as never },
  ],
  [{ preset: 2 }, { preset: 6 }, { preset: 0 }],
]

describe('chapters', () => {
  it('cover chapters 0–13, with copy for every step', () => {
    expect(CHAPTERS.length).toBe(LAST_CHAPTER + 1)
    expect(chapterCopy.length).toBe(CHAPTERS.length)
    CHAPTERS.forEach((c, i) => {
      expect(chapterCopy[i].steps.length, `chapter ${i}`).toBe(c.checks.length)
      expect(requiredSteps(c)).toBeLessThanOrEqual(c.checks.length)
      expect(requiredSteps(c)).toBeGreaterThan(0)
    })
  })

  it.each(CHAPTERS.map((c, i) => [i, c] as const))('chapter %i can be finished', (i, c) => {
    const start = setupPatch(c)
    let done = 0
    for (const change of walkthroughs[i]) {
      const o = obs({ ...(start ?? {}), ...change } as never)
      if (start) o.values = { ...start.values, ...(change.values ?? {}) }
      const next = advance(c.checks, done, o)
      expect(next, `chapter ${i} step ${done + 1}`).toBe(done + 1)
      done = next
    }
    expect(done).toBe(c.checks.length)
  })

  it('do not finish themselves from their own starting sound', () => {
    CHAPTERS.forEach((c, i) => {
      const start = setupPatch(c)
      const o = start ? obs({ ...start }) : base()
      expect(advance(c.checks, 0, o), `chapter ${i}`).toBeLessThan(requiredSteps(c))
    })
  })

  it('build starting sounds on a plain teaching patch', () => {
    const plain = teachingPatch()
    expect(plain.values.envelope).toBe(0)
    expect(plain.values.mod).toBe(0)
    const ch5 = setupPatch(CHAPTERS[5])!
    expect(ch5.shape).toBe('saw')
    expect(ch5.values.cutoff).toBe(clock(13))
    expect(setupPatch(CHAPTERS[0])).toBeNull()
  })

  it('point every parameter to a chapter', () => {
    for (const p of PARAMS) expect(CHAPTER_FOR_PARAM[p.id]).toBeLessThanOrEqual(LAST_CHAPTER)
  })
})

describe('goal steps', () => {
  const checks = [
    (o: Observation) => o.values.cutoff <= 0.2,
    (o: Observation) => o.values.cutoff >= 0.7,
  ]

  it('complete in order and stay done', () => {
    // Turning CUTOFF up first doesn't count: step 1 isn't done yet.
    expect(advance(checks, 0, obs({ values: { cutoff: 0.9 } }))).toBe(0)
    expect(advance(checks, 0, obs({ values: { cutoff: 0.1 } }))).toBe(1)
    expect(advance(checks, 1, obs({ values: { cutoff: 0.5 } }))).toBe(1)
    expect(advance(checks, 1, obs({ values: { cutoff: 0.8 } }))).toBe(2)
    expect(advance(checks, 2, obs({ values: { cutoff: 0.1 } }))).toBe(2)
  })

  it('read the pedal state, including the active layer', () => {
    let s = initialState()
    s = reduce(s, { type: 'down', button: 'voice' }, 0)
    const o = observe(s, { note: 40, riff: 'held-e' })
    expect(o.layer).toBe('voice')
    expect(o.note).toBe(40)
    expect(o.riff).toBe('held-e')
  })
})

describe('rich text', () => {
  it('splits glossary links from plain text', () => {
    expect(parseRich('A [[low-pass-filter|low-pass filter]] and [[resonance]].')).toEqual([
      { text: 'A ' },
      { text: 'low-pass filter', term: 'low-pass-filter' },
      { text: ' and ' },
      { text: 'resonance', term: 'resonance' },
      { text: '.' },
    ])
    expect(plainText('No [[lfo|LFO]] here')).toBe('No LFO here')
  })

  it('links only to glossary entries that exist', () => {
    const sources = [
      ...chapterCopy.flatMap((c) => [c.intro, c.takeaway, c.more?.text ?? '', c.analogy ?? '']),
      ...glossary.map((g) => g.definition),
    ]
    for (const s of sources) {
      for (const part of parseRich(s)) {
        if ('term' in part) expect(glossaryById[part.term], part.term).toBeDefined()
      }
    }
  })
})

describe('copy', () => {
  it('keeps explanation cards short (≤ 60 words, learning-content.md)', () => {
    const words = (s: string) => plainText(s).split(/\s+/).filter(Boolean).length
    for (const c of chapterCopy) {
      expect(words(c.intro), c.title).toBeLessThanOrEqual(60)
      if (c.more) expect(words(c.more.text), c.title).toBeLessThanOrEqual(70)
    }
  })

  it('has glossary entries with unique ids, valid chapters and related terms', () => {
    expect(new Set(glossary.map((g) => g.id)).size).toBe(glossary.length)
    for (const g of glossary) {
      if (g.chapter !== undefined) expect(g.chapter).toBeLessThanOrEqual(LAST_CHAPTER)
      for (const r of g.related ?? []) expect(glossaryById[r], `${g.id} → ${r}`).toBeDefined()
    }
  })
})
