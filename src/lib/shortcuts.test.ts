import { describe, expect, it } from 'vitest'
import { shortcutFor, type KeyContext, type KeyInfo } from './shortcuts'

const key = (k: Partial<KeyInfo>): KeyInfo => ({
  key: '',
  code: '',
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  repeat: false,
  ...k,
})
const free: KeyContext = { typing: false, onControl: false, noteKeys: false }

describe('keyboard shortcuts', () => {
  it('maps P, Shift+P, M, Space and ?', () => {
    expect(shortcutFor(key({ key: 'p', code: 'KeyP' }), free)).toBe('nextPreset')
    expect(shortcutFor(key({ key: 'P', code: 'KeyP', shiftKey: true }), free)).toBe('prevPreset')
    expect(shortcutFor(key({ key: 'm', code: 'KeyM' }), free)).toBe('mute')
    expect(shortcutFor(key({ key: ' ', code: 'Space' }), free)).toBe('footswitch')
    expect(shortcutFor(key({ key: '?', code: 'Slash', shiftKey: true }), free)).toBe('help')
    expect(shortcutFor(key({ key: 'x', code: 'KeyX' }), free)).toBeNull()
  })

  it('stays out of the way of typing, browser shortcuts and key repeat', () => {
    const p = key({ key: 'p', code: 'KeyP' })
    expect(shortcutFor(p, { ...free, typing: true })).toBeNull()
    expect(shortcutFor({ ...p, ctrlKey: true }, free)).toBeNull()
    expect(shortcutFor({ ...p, metaKey: true }, free)).toBeNull()
    expect(shortcutFor({ ...p, repeat: true }, free)).toBeNull()
  })

  it('leaves Space to focused controls and note keys to the keyboard source', () => {
    expect(shortcutFor(key({ key: ' ', code: 'Space' }), { ...free, onControl: true })).toBeNull()
    const notes = { ...free, noteKeys: true }
    expect(shortcutFor(key({ key: 'p', code: 'KeyP' }), notes)).toBeNull()
    expect(shortcutFor(key({ key: 'm', code: 'KeyM' }), notes)).toBe('mute')
    expect(shortcutFor(key({ key: '?', code: 'Slash', shiftKey: true }), notes)).toBe('help')
  })
})
