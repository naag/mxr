import { describe, expect, it } from 'vitest'
import { noteForKey, noteName, STRINGS } from './notes'

describe('noteName', () => {
  it.each([
    [28, 'E1'],
    [33, 'A1'],
    [36, 'C2'],
    [37, 'C♯2'],
    [60, 'C4'],
  ])('%i is %s', (midi, name) => {
    expect(noteName(midi)).toBe(name)
  })
})

describe('fretboard', () => {
  it('is in standard tuning, E1 A1 D2 G2', () => {
    expect(STRINGS.map((s) => noteName(s.open))).toEqual(['E1', 'A1', 'D2', 'G2'])
  })
})

describe('noteForKey', () => {
  it('maps the Q row to the E string and the number row to the A string', () => {
    expect(noteForKey('KeyQ')).toBe(28)
    expect(noteForKey('KeyW')).toBe(29)
    expect(noteForKey('BracketRight')).toBe(39)
    expect(noteForKey('Digit1')).toBe(33)
    expect(noteForKey('Equal')).toBe(44)
  })

  it('leaves V and S (layer holds) and other keys alone', () => {
    expect(noteForKey('KeyV')).toBeNull()
    expect(noteForKey('KeyS')).toBeNull()
    expect(noteForKey('Space')).toBeNull()
  })
})
