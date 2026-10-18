import { describe, expect, it } from 'vitest'
import { angleFor, arcPath, clamp01, clockLabel, toDial } from './knob'

describe('angleFor', () => {
  it('sweeps 300° from 7 to 5 o’clock', () => {
    expect(angleFor(0)).toBe(-150)
    expect(angleFor(0.5)).toBe(0)
    expect(angleFor(1)).toBe(150)
  })

  it('clamps out-of-range values', () => {
    expect(angleFor(-1)).toBe(-150)
    expect(angleFor(2)).toBe(150)
  })
})

describe('clockLabel', () => {
  it.each([
    [0, 'min'],
    [0.1, '8 o’clock'],
    [0.3, '10 o’clock'],
    [0.5, 'noon'],
    [0.6, '1 o’clock'],
    [0.9, '4 o’clock'],
    [1, 'max'],
  ])('%d → %s', (value, label) => {
    expect(clockLabel(value)).toBe(label)
  })
})

describe('toDial', () => {
  it('maps to 0–10 with one decimal', () => {
    expect(toDial(0)).toBe(0)
    expect(toDial(0.333)).toBe(3.3)
    expect(toDial(1)).toBe(10)
  })
})

describe('clamp01', () => {
  it('keeps values inside 0–1', () => {
    expect(clamp01(-0.2)).toBe(0)
    expect(clamp01(0.4)).toBe(0.4)
    expect(clamp01(1.3)).toBe(1)
  })
})

describe('arcPath', () => {
  it('draws a large arc for the full sweep', () => {
    expect(arcPath(100, -150, 150)).toBe('M-50.00 86.60 A100 100 0 1 1 50.00 86.60')
  })

  it('collapses to a point for an empty arc', () => {
    expect(arcPath(100, -150, -150)).toBe('M-50.00 86.60')
  })
})
