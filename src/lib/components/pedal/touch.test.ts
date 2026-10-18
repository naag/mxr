import { describe, expect, it } from 'vitest'
import { DOUBLE_TAP_MS, DoubleTap } from './touch'

describe('double tap', () => {
  it('fires on the second of two quick taps in the same spot, then starts over', () => {
    const d = new DoubleTap()
    expect(d.tap(0, 10, 10)).toBe(false)
    expect(d.tap(200, 14, 12)).toBe(true)
    expect(d.tap(300, 14, 12)).toBe(false)
  })

  it('ignores slow taps and taps far apart', () => {
    const d = new DoubleTap()
    d.tap(0, 10, 10)
    expect(d.tap(DOUBLE_TAP_MS + 1, 10, 10)).toBe(false)
    expect(d.tap(DOUBLE_TAP_MS + 100, 80, 10)).toBe(false)
  })
})
