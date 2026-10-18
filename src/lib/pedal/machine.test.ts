import { beforeEach, describe, expect, it } from 'vitest'
import {
  activeLayer,
  initialState,
  isModified,
  leds,
  needsTick,
  reduce,
  TIMING,
  valueOf,
  type Button,
  type MachineEvent,
  type MachineState,
} from './machine'
import { clock, PARAM } from './params'
import { FACTORY_PRESETS, patchesEqual } from './presets'

/** Drives the reducer with a fake clock. */
class Rig {
  s: MachineState
  t = 1000
  constructor(s = initialState()) {
    this.s = s
  }
  send(e: MachineEvent) {
    this.s = reduce(this.s, e, this.t)
    return this
  }
  wait(ms: number) {
    this.t += ms
    return this.send({ type: 'tick' })
  }
  tap(button: Button, ms = 80) {
    this.send({ type: 'down', button })
    this.t += ms
    return this.send({ type: 'up', button })
  }
  hold(button: Button, ms: number) {
    this.send({ type: 'down', button })
    this.wait(ms)
    return this.send({ type: 'up', button })
  }
  turn(knob: Parameters<typeof turnEvent>[0], value: number) {
    return this.send(turnEvent(knob, value))
  }
}
const turnEvent = (
  knob: 'mix' | 'cutoff' | 'envelope' | 'sub' | 'resonance' | 'mod',
  value: number,
) => ({ type: 'turn', knob, value }) as const

let rig: Rig
beforeEach(() => {
  rig = new Rig()
})

describe('knobs and layers', () => {
  it('turns the printed parameter by default', () => {
    rig.turn('cutoff', 0.8)
    expect(rig.s.current.values.cutoff).toBe(0.8)
    expect(activeLayer(rig.s)).toBe('main')
  })

  it('turns the VOICE-layer parameter while VOICE is held, without toggling VOICE', () => {
    const before = rig.s.current.voiceOn
    rig.send({ type: 'down', button: 'voice' })
    expect(activeLayer(rig.s)).toBe('voice')
    rig.turn('cutoff', 0.2)
    rig.send({ type: 'up', button: 'voice' })
    expect(rig.s.current.values.envAmount).toBe(0.2)
    expect(rig.s.current.values.cutoff).toBe(PARAM.cutoff.initial)
    expect(rig.s.current.voiceOn).toBe(before)
    expect(activeLayer(rig.s)).toBe('main')
  })

  it('turns SHAPE-layer parameters while SHAPE is held, and snaps stepped ones', () => {
    rig.send({ type: 'down', button: 'shape' })
    rig.turn('mod', 0.6)
    rig.turn('sub', 0.75)
    rig.send({ type: 'up', button: 'shape' })
    expect(rig.s.globals.outMode).toBe(0.5)
    expect(rig.s.current.values.outGain).toBe(0.75)
    expect(rig.s.current.shape).toBe('saw')
  })

  it('stores global parameters outside the patch', () => {
    rig.send({ type: 'setLayer', layer: 'shape' })
    rig.turn('resonance', 1)
    expect(rig.s.globals.tracking).toBe(1)
    rig.send({ type: 'select', preset: 3 })
    expect(rig.s.globals.tracking).toBe(1)
  })

  it('uses the sticky layer from the layer switch', () => {
    rig.send({ type: 'setLayer', layer: 'voice' })
    rig.turn('resonance', 0.5)
    expect(rig.s.current.values.glide).toBe(0.5)
    expect(valueOf(rig.s, PARAM.glide)).toBe(0.5)
  })

  it('resets a knob to the saved value of the current preset', () => {
    rig.send({ type: 'select', preset: 3 })
    rig.turn('cutoff', 1)
    rig.send({ type: 'resetKnob', knob: 'cutoff' })
    expect(rig.s.current.values.cutoff).toBe(FACTORY_PRESETS[2].values.cutoff)
  })

  it('resets a knob to its starting value in live mode', () => {
    rig.turn('mod', 1)
    rig.send({ type: 'resetKnob', knob: 'mod' })
    expect(rig.s.current.values.mod).toBe(PARAM.mod.initial)
  })
})

describe('VOICE and SHAPE buttons', () => {
  it('toggle on a tap', () => {
    rig.tap('voice')
    expect(rig.s.current.voiceOn).toBe(true)
    rig.tap('shape').tap('shape')
    expect(rig.s.current.shape).toBe('triangle')
  })

  it('do nothing on a long press without turning a knob', () => {
    rig.hold('voice', TIMING.buttonTapMs + 50)
    expect(rig.s.current.voiceOn).toBe(false)
  })
})

describe('footswitch', () => {
  it('bypasses on a tap', () => {
    rig.tap('foot')
    expect(rig.s.engaged).toBe(false)
    expect(leds(rig.s).bypass).toBe('off')
    rig.tap('foot')
    expect(rig.s.engaged).toBe(true)
  })

  it('enters preset scroll on a hold; taps then step presets', () => {
    rig.hold('foot', TIMING.footHoldMs)
    expect(rig.s.engaged).toBe(true)
    expect(rig.s.scrollUntil).not.toBeNull()
    expect(leds(rig.s).bypass).toBe('soft')
    rig.tap('foot').tap('foot')
    expect(rig.s.preset).toBe(2)
    expect(rig.s.engaged).toBe(true)
  })

  it('leaves preset scroll on another hold', () => {
    rig.hold('foot', TIMING.footHoldMs).hold('foot', TIMING.footHoldMs)
    expect(rig.s.scrollUntil).toBeNull()
    rig.tap('foot')
    expect(rig.s.engaged).toBe(false)
  })

  it('leaves preset scroll after a timeout, counted from the last tap', () => {
    rig.hold('foot', TIMING.footHoldMs)
    rig.wait(TIMING.scrollTimeoutMs - 500).tap('foot')
    rig.wait(TIMING.scrollTimeoutMs - 500)
    expect(rig.s.scrollUntil).not.toBeNull()
    rig.wait(600)
    expect(rig.s.scrollUntil).toBeNull()
    expect(needsTick(rig.s)).toBe(false)
  })

  it('switches to freeze mode with RESONANCE at max, and back at min', () => {
    rig.send({ type: 'down', button: 'foot' })
    rig.turn('resonance', 1)
    rig.wait(TIMING.footHoldMs + 100)
    rig.send({ type: 'up', button: 'foot' })
    expect(rig.s.footMode).toBe('freeze')
    expect(rig.s.scrollUntil).toBeNull()
    expect(rig.s.engaged).toBe(true)

    rig.send({ type: 'down', button: 'foot' }).wait(TIMING.footHoldMs)
    expect(rig.s.frozen).toBe(true)
    rig.send({ type: 'up', button: 'foot' })
    expect(rig.s.frozen).toBe(false)
    rig.tap('foot')
    expect(rig.s.engaged).toBe(false)

    rig
      .send({ type: 'down', button: 'foot' })
      .turn('resonance', 0)
      .send({ type: 'up', button: 'foot' })
    expect(rig.s.footMode).toBe('scroll')
  })
})

describe('PRESETS button', () => {
  it('steps live → G1 … R4 → live', () => {
    const seen = []
    for (let i = 0; i < 9; i++) seen.push(rig.tap('presets').s.preset)
    expect(seen).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 0])
  })

  it('loads the saved patch and lights the bank colour', () => {
    rig.tap('presets').tap('presets').tap('presets')
    expect(patchesEqual(rig.s.current, FACTORY_PRESETS[2])).toBe(true)
    expect(leds(rig.s)).toEqual({
      bypass: 'on',
      presetColor: 'green',
      presets: ['off', 'off', 'on', 'off'],
    })
    rig.send({ type: 'select', preset: 6 })
    expect(leds(rig.s).presetColor).toBe('red')
    expect(leds(rig.s).presets).toEqual(['off', 'on', 'off', 'off'])
  })

  it('shows all preset LEDs off in live mode', () => {
    expect(leds(rig.s).presets).toEqual(['off', 'off', 'off', 'off'])
  })
})

describe('edited presets and live mode', () => {
  it('flags an edited preset with a soft flash; going back to the value clears it', () => {
    rig.send({ type: 'select', preset: 1 })
    const original = rig.s.current.values.mix
    rig.turn('mix', 0.1)
    expect(isModified(rig.s)).toBe(true)
    expect(leds(rig.s).presets[0]).toBe('soft')
    rig.turn('mix', original)
    expect(isModified(rig.s)).toBe(false)
  })

  it('throws away unsaved edits when leaving a preset', () => {
    rig.send({ type: 'select', preset: 1 }).turn('mix', 0.1)
    rig.send({ type: 'select', preset: 2 }).send({ type: 'select', preset: 1 })
    expect(rig.s.current.values.mix).toBe(FACTORY_PRESETS[0].values.mix)
  })

  it('saves live mode automatically', () => {
    rig.turn('mix', 0.25).tap('voice')
    expect(rig.s.saved[0].values.mix).toBe(0.25)
    expect(rig.s.saved[0].voiceOn).toBe(true)
    expect(isModified(rig.s)).toBe(false)
    rig.send({ type: 'select', preset: 4 }).send({ type: 'select', preset: 0 })
    expect(rig.s.current.values.mix).toBe(0.25)
  })

  it('loads a shared patch into live mode', () => {
    rig.send({ type: 'select', preset: 5 })
    rig.send({ type: 'load', patch: FACTORY_PRESETS[7] })
    expect(rig.s.preset).toBe(0)
    expect(patchesEqual(rig.s.saved[0], FACTORY_PRESETS[7])).toBe(true)
  })
})

describe('copy and save', () => {
  it('copies on a 2 s hold, saves into the chosen preset on a second hold', () => {
    rig.turn('cutoff', 0.9)
    rig.hold('presets', TIMING.presetHoldMs)
    expect(rig.s.copy).not.toBeNull()
    expect(leds(rig.s).presets).toEqual(['hard', 'hard', 'hard', 'hard'])
    rig.tap('presets').tap('presets')
    expect(rig.s.preset).toBe(2)
    expect(leds(rig.s).presets[1]).toBe('hard')
    rig.hold('presets', TIMING.presetHoldMs)
    expect(rig.s.copy).toBeNull()
    expect(rig.s.saved[2].values.cutoff).toBe(0.9)
    expect(rig.s.current.values.cutoff).toBe(0.9)
    expect(rig.s.confirm?.kind).toBe('saved')
    rig.wait(TIMING.confirmMs)
    expect(rig.s.confirm).toBeNull()
    expect(leds(rig.s).presets[1]).toBe('on')
  })

  it('cannot save into live mode', () => {
    rig.hold('presets', TIMING.presetHoldMs).hold('presets', TIMING.presetHoldMs)
    expect(rig.s.copy).not.toBeNull()
    expect(rig.s.confirm).toBeNull()
  })

  it('is cancelled by editing the current preset', () => {
    rig.hold('presets', TIMING.presetHoldMs).tap('presets').turn('mix', 0)
    expect(rig.s.copy).toBeNull()
  })

  it('times out', () => {
    rig.hold('presets', TIMING.presetHoldMs).wait(TIMING.copyTimeoutMs)
    expect(rig.s.copy).toBeNull()
  })

  it('does not step presets when the button was held', () => {
    rig.hold('presets', TIMING.presetHoldMs)
    expect(rig.s.preset).toBe(0)
  })
})

describe('resets', () => {
  it('resets the current preset with footswitch + PRESETS held for 5 s', () => {
    rig.send({ type: 'select', preset: 3 }).turn('cutoff', 1)
    rig.hold('presets', TIMING.presetHoldMs).send({ type: 'select', preset: 3 })
    rig.hold('presets', TIMING.presetHoldMs)
    expect(rig.s.saved[3].values.cutoff).toBe(1)

    rig.send({ type: 'down', button: 'foot' }).send({ type: 'down', button: 'presets' })
    rig.wait(TIMING.resetHoldMs)
    rig.send({ type: 'up', button: 'presets' }).send({ type: 'up', button: 'foot' })
    expect(rig.s.saved[3].values.cutoff).toBe(clock(10))
    expect(patchesEqual(rig.s.current, FACTORY_PRESETS[2])).toBe(true)
    expect(rig.s.engaged).toBe(true)
    expect(rig.s.scrollUntil).toBeNull()
    expect(leds(rig.s).presets[2]).toBe('hard')
  })

  it('does not copy while the reset combination is held', () => {
    rig.send({ type: 'down', button: 'foot' }).send({ type: 'down', button: 'presets' })
    rig.wait(TIMING.presetHoldMs + 100)
    expect(rig.s.copy).toBeNull()
  })

  it('restores everything on a factory reset', () => {
    rig.turn('mix', 0).send({ type: 'select', preset: 2 })
    rig.send({ type: 'factoryReset' })
    expect(rig.s.preset).toBe(0)
    expect(rig.s.saved[0].values.mix).toBe(PARAM.mix.initial)
    expect(leds(rig.s).bypass).toBe('hard')
  })
})

describe('ticking', () => {
  it('is only needed while something is pending', () => {
    expect(needsTick(rig.s)).toBe(false)
    rig.send({ type: 'down', button: 'foot' })
    expect(needsTick(rig.s)).toBe(true)
    rig.send({ type: 'up', button: 'foot' })
    expect(needsTick(rig.s)).toBe(false)
  })
})
