import { describe, expect, it } from 'vitest'
import { hrefFor, parseHash } from './router'

describe('parseHash', () => {
  it.each([
    ['', { name: 'play' }],
    ['#', { name: 'play' }],
    ['#/', { name: 'play' }],
    ['#/flow', { name: 'flow' }],
    ['#/presets/', { name: 'presets' }],
    ['#/reference', { name: 'reference' }],
    ['#/nope', { name: 'play' }],
    ['#/?p=1.1.0', { name: 'play' }],
    ['#/flow?x=1', { name: 'flow' }],
  ])('parses %j', (hash, route) => {
    expect(parseHash(hash)).toEqual(route)
  })

  it('reads the Learn chapter', () => {
    expect(parseHash('#/learn/5')).toEqual({ name: 'learn', chapter: 5 })
    expect(parseHash('#/learn/13')).toEqual({ name: 'learn', chapter: 13 })
  })

  it('falls back to chapter 0 for missing or invalid chapters', () => {
    for (const hash of ['#/learn', '#/learn/14', '#/learn/-1', '#/learn/2.5', '#/learn/x']) {
      expect(parseHash(hash)).toEqual({ name: 'learn', chapter: 0 })
    }
  })
})

describe('hrefFor', () => {
  it('round-trips through parseHash', () => {
    for (const route of [
      { name: 'play' },
      { name: 'flow' },
      { name: 'learn', chapter: 7 },
      { name: 'presets' },
      { name: 'reference' },
    ] as const) {
      expect(parseHash(hrefFor(route))).toEqual(route)
    }
  })
})
