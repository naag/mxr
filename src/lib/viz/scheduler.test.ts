import { describe, expect, it, vi } from 'vitest'
import { FrameScheduler, type SchedulerHost } from './scheduler'

function fakeHost() {
  let next = 1
  const frames = new Map<number, (now: number) => void>()
  let visibility: () => void = () => {}
  const host: SchedulerHost & { hiddenNow: boolean } = {
    hiddenNow: false,
    requestAnimationFrame: (cb) => {
      frames.set(next, cb)
      return next++
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    hidden: () => host.hiddenNow,
    onVisibilityChange: (cb) => (visibility = cb),
  }
  const flush = (now = 0) => {
    const pending = [...frames.values()]
    frames.clear()
    for (const cb of pending) cb(now)
  }
  return { host, frames, flush, setHidden: (h: boolean) => ((host.hiddenNow = h), visibility()) }
}

describe('FrameScheduler', () => {
  it('runs one loop for all subscribers and stops when they leave', () => {
    const { host, frames, flush } = fakeHost()
    const s = new FrameScheduler(host)
    const a = vi.fn()
    const b = vi.fn()
    const offA = s.add(a)
    const offB = s.add(b)
    expect(frames.size).toBe(1)
    flush(16)
    expect(a).toHaveBeenCalledWith(16)
    expect(b).toHaveBeenCalledOnce()
    expect(frames.size).toBe(1)
    offA()
    flush()
    expect(a).toHaveBeenCalledOnce()
    offB()
    expect(s.running).toBe(false)
    expect(frames.size).toBe(0)
  })

  it('pauses while the page is hidden', () => {
    const { host, frames, setHidden } = fakeHost()
    const s = new FrameScheduler(host)
    s.add(() => {})
    setHidden(true)
    expect(frames.size).toBe(0)
    setHidden(false)
    expect(frames.size).toBe(1)
  })

  it('keeps going when one visual throws', () => {
    const { host, flush } = fakeHost()
    const s = new FrameScheduler(host)
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const ok = vi.fn()
    s.add(() => {
      throw new Error('boom')
    })
    s.add(ok)
    flush()
    expect(ok).toHaveBeenCalled()
    expect(s.running).toBe(true)
    err.mockRestore()
  })
})
