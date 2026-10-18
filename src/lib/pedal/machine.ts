/**
 * The pedal's front-panel behavior as a pure reducer: `reduce(state, event, now)`.
 * Time is passed in, so every tap/hold/timeout rule is unit-testable without timers.
 *
 * Behavior follows the manual (docs/pedal-reference.md §3–7). Hold times and timeouts the
 * manual doesn't give are ASSUMPTIONS, collected in `TIMING`.
 */
import type { KnobId } from './layout'
import {
  normalize,
  PARAM,
  paramAt,
  type GlobalParamId,
  type Layer,
  type ParamDef,
  type ParamId,
  type PresetParamId,
} from './params'
import {
  clonePatch,
  FACTORY_PRESETS,
  initialGlobals,
  initialLivePatch,
  patchesEqual,
  PRESET_COUNT,
  SHAPES,
  type Globals,
  type Patch,
  type Shape,
} from './presets'

export const TIMING = {
  /** VOICE / SHAPE: a press shorter than this with no knob turned is a tap. */
  buttonTapMs: 500,
  /** Footswitch: holding this long enters (or leaves) preset scroll, or freezes the note. */
  footHoldMs: 600,
  /** PRESETS: manual says hold for 2 seconds to copy, and again to save. */
  presetHoldMs: 2000,
  /** Footswitch + PRESETS together: manual says 5 seconds to reset a preset. */
  resetHoldMs: 5000,
  /** Preset scroll mode ends after this long without a tap. */
  scrollTimeoutMs: 5000,
  /** The copy/save menu ends after this long without saving. */
  copyTimeoutMs: 15000,
  /** How long confirmation flashes last. */
  confirmMs: 1200,
} as const

export type Button = 'voice' | 'shape' | 'foot' | 'presets'

interface Press {
  at: number
  /** A knob was turned while this was held (so releasing it isn't a tap). */
  used: boolean
  /** The hold action already happened. */
  fired: boolean
}

export interface MachineState {
  /** Saved patches: index 0 is live mode, 1–8 the presets. */
  saved: Patch[]
  /** The patch being played and edited. */
  current: Patch
  preset: number
  globals: Globals
  engaged: boolean
  /** Layer chosen with the on-screen layer switch (the hardware only has holds). */
  stickyLayer: Layer
  pressed: Partial<Record<Button, Press>>
  /** What holding the footswitch does: scroll presets (default) or freeze the note. */
  footMode: 'scroll' | 'freeze'
  scrollUntil: number | null
  frozen: boolean
  copy: { patch: Patch; until: number } | null
  confirm: { kind: 'saved' | 'reset' | 'factory'; until: number } | null
}

export type MachineEvent =
  | { type: 'turn'; knob: KnobId; value: number }
  | { type: 'resetKnob'; knob: KnobId }
  | { type: 'down'; button: Button }
  | { type: 'up'; button: Button }
  | { type: 'tick' }
  | { type: 'setLayer'; layer: Layer }
  | { type: 'select'; preset: number }
  | { type: 'load'; patch: Patch }
  | { type: 'factoryReset' }
  /** Direct edits from outside the pedal (flow inspector, Learn): any layer, no button hold. */
  | { type: 'set'; param: ParamId; value: number }
  | { type: 'setShape'; shape: Shape }
  | { type: 'setVoice'; on: boolean }

export function initialState(saved?: Patch[], globals?: Globals): MachineState {
  const list = saved ?? [initialLivePatch(), ...FACTORY_PRESETS.map(clonePatch)]
  return {
    saved: list,
    current: clonePatch(list[0]),
    preset: 0,
    globals: globals ?? initialGlobals(),
    engaged: true,
    stickyLayer: 'main',
    pressed: {},
    footMode: 'scroll',
    scrollUntil: null,
    frozen: false,
    copy: null,
    confirm: null,
  }
}

/** The layer the knobs control right now: a held button wins over the layer switch. */
export function activeLayer(s: MachineState): Layer {
  if (s.pressed.voice) return 'voice'
  if (s.pressed.shape) return 'shape'
  return s.stickyLayer
}

export function valueOf(s: MachineState, p: ParamDef): number {
  return p.global ? s.globals[p.id as GlobalParamId] : s.current.values[p.id as PresetParamId]
}

/** Live mode never counts as edited: it saves itself. */
export function isModified(s: MachineState): boolean {
  return s.preset > 0 && !patchesEqual(s.current, s.saved[s.preset])
}

/** True while something time-based is pending, so the host should send `tick`s. */
export function needsTick(s: MachineState): boolean {
  return (
    Object.keys(s.pressed).length > 0 ||
    s.scrollUntil !== null ||
    s.copy !== null ||
    s.confirm !== null
  )
}

export function reduce(state: MachineState, event: MachineEvent, now: number): MachineState {
  const s = expire(fireHolds(state, now), now)
  switch (event.type) {
    case 'tick':
      return s
    case 'turn':
      return turn(s, event.knob, event.value)
    case 'resetKnob': {
      const p = paramAt(event.knob, activeLayer(s))
      // Live mode saves every change, so its "saved" value is the current one: use the
      // starting value instead.
      const saved =
        p.global || s.preset === 0
          ? PARAM[p.id].initial
          : s.saved[s.preset].values[p.id as PresetParamId]
      return turn(s, event.knob, saved)
    }
    case 'down':
      if (s.pressed[event.button]) return s
      return {
        ...s,
        pressed: { ...s.pressed, [event.button]: { at: now, used: false, fired: false } },
      }
    case 'up':
      return release(s, event.button, now)
    case 'setLayer':
      return { ...s, stickyLayer: event.layer }
    case 'select':
      return select(s, event.preset, now)
    case 'load': {
      const patch = clonePatch(event.patch)
      const saved = [...s.saved]
      saved[0] = clonePatch(patch)
      return { ...s, saved, preset: 0, current: patch, copy: null }
    }
    case 'set':
      return setParam(s, PARAM[event.param], event.value)
    case 'setShape':
      if (s.current.shape === event.shape) return s
      return edit(s, (p) => {
        p.shape = event.shape
      })
    case 'setVoice':
      if (s.current.voiceOn === event.on) return s
      return edit(s, (p) => {
        p.voiceOn = event.on
      })
    case 'factoryReset': {
      const fresh = initialState()
      return {
        ...fresh,
        engaged: s.engaged,
        confirm: { kind: 'factory', until: now + TIMING.confirmMs },
      }
    }
  }
}

function markUsed(pressed: MachineState['pressed'], ...buttons: Button[]): MachineState['pressed'] {
  const next = { ...pressed }
  for (const b of buttons) {
    const p = next[b]
    if (p) next[b] = { ...p, used: true }
  }
  return next
}

/** Applies an edit to the current patch; live mode saves it right away. */
function edit(s: MachineState, change: (p: Patch) => void): MachineState {
  const current = clonePatch(s.current)
  change(current)
  const saved =
    s.preset === 0 ? s.saved.map((p, i) => (i === 0 ? clonePatch(current) : p)) : s.saved
  // Manual: "To exit the copy/save menu without saving, simply alter the current preset."
  return { ...s, current, saved, copy: null }
}

function turn(s: MachineState, knob: KnobId, raw: number): MachineState {
  const layer = activeLayer(s)
  const p = paramAt(knob, layer)
  const value = normalize(p, raw)
  const next: MachineState = { ...s, pressed: markUsed(s.pressed, 'voice', 'shape') }

  // Manual: hold the footswitch and turn RESONANCE to max to make holds freeze the note;
  // to min to go back to preset scrolling.
  if (s.pressed.foot && knob === 'resonance' && layer === 'main') {
    next.pressed = markUsed(next.pressed, 'foot')
    if (value >= 0.99) next.footMode = 'freeze'
    else if (value <= 0.01) next.footMode = 'scroll'
  }

  return setParam(next, p, value)
}

/** Sets a parameter (global or per preset), snapped to its range and detents. */
function setParam(s: MachineState, p: ParamDef, raw: number): MachineState {
  const value = normalize(p, raw)
  if (p.global) {
    if (s.globals[p.id as GlobalParamId] === value) return s
    return { ...s, globals: { ...s.globals, [p.id]: value } }
  }
  if (s.current.values[p.id as PresetParamId] === value) return s
  return edit(s, (patch) => {
    patch.values[p.id as PresetParamId] = value
  })
}

function select(s: MachineState, preset: number, now: number): MachineState {
  const i = ((preset % (PRESET_COUNT + 1)) + PRESET_COUNT + 1) % (PRESET_COUNT + 1)
  return {
    ...s,
    preset: i,
    current: clonePatch(s.saved[i]),
    scrollUntil: s.scrollUntil === null ? null : now + TIMING.scrollTimeoutMs,
  }
}

function release(s: MachineState, button: Button, now: number): MachineState {
  const press = s.pressed[button]
  if (!press) return s
  const pressed = { ...s.pressed }
  delete pressed[button]
  const next = { ...s, pressed }
  const tap = !press.used && !press.fired

  switch (button) {
    case 'voice':
      if (tap && now - press.at < TIMING.buttonTapMs)
        return edit(next, (p) => {
          p.voiceOn = !p.voiceOn
        })
      return next
    case 'shape':
      if (tap && now - press.at < TIMING.buttonTapMs)
        return edit(next, (p) => {
          p.shape = SHAPES[(SHAPES.indexOf(p.shape) + 1) % SHAPES.length]
        })
      return next
    case 'presets':
      return tap ? select(next, s.preset + 1, now) : next
    case 'foot':
      if (s.frozen) return { ...next, frozen: false }
      if (!tap) return next
      if (next.scrollUntil !== null) return select(next, s.preset + 1, now)
      return { ...next, engaged: !next.engaged }
  }
}

/** Runs hold actions whose time has come. */
function fireHolds(s: MachineState, now: number): MachineState {
  const { foot, presets } = s.pressed
  let next = s

  // Footswitch + PRESETS for 5 s: reset the current preset to its factory setting.
  if (foot && presets) {
    const since = Math.max(foot.at, presets.at)
    if (!presets.fired && now - since >= TIMING.resetHoldMs) {
      const factory = s.preset === 0 ? initialLivePatch() : FACTORY_PRESETS[s.preset - 1]
      const saved = [...s.saved]
      saved[s.preset] = clonePatch(factory)
      next = {
        ...s,
        saved,
        current: clonePatch(factory),
        scrollUntil: null,
        copy: null,
        confirm: { kind: 'reset', until: now + TIMING.confirmMs },
        pressed: {
          ...s.pressed,
          foot: { ...foot, used: true, fired: true },
          presets: { ...presets, used: true, fired: true },
        },
      }
    }
    return next
  }

  if (foot && !foot.fired && !foot.used && now - foot.at >= TIMING.footHoldMs) {
    const pressed = { ...s.pressed, foot: { ...foot, fired: true } }
    if (s.footMode === 'freeze') next = { ...s, pressed, frozen: true }
    else
      next = {
        ...s,
        pressed,
        scrollUntil: s.scrollUntil === null ? now + TIMING.scrollTimeoutMs : null,
      }
  }

  if (presets && !presets.fired && now - presets.at >= TIMING.presetHoldMs) {
    const pressed = { ...next.pressed, presets: { ...presets, fired: true } }
    if (!next.copy) {
      next = {
        ...next,
        pressed,
        copy: { patch: clonePatch(next.current), until: now + TIMING.copyTimeoutMs },
      }
    } else if (next.preset > 0) {
      const saved = [...next.saved]
      saved[next.preset] = clonePatch(next.copy.patch)
      next = {
        ...next,
        pressed,
        saved,
        current: clonePatch(next.copy.patch),
        copy: null,
        confirm: { kind: 'saved', until: now + TIMING.confirmMs },
      }
    } else {
      // Manual: "You cannot save a preset into live mode."
      next = { ...next, pressed }
    }
  }
  return next
}

function expire(s: MachineState, now: number): MachineState {
  const scrollDone = s.scrollUntil !== null && now >= s.scrollUntil && !s.pressed.foot
  const copyDone = s.copy !== null && now >= s.copy.until
  const confirmDone = s.confirm !== null && now >= s.confirm.until
  if (!scrollDone && !copyDone && !confirmDone) return s
  return {
    ...s,
    scrollUntil: scrollDone ? null : s.scrollUntil,
    copy: copyDone ? null : s.copy,
    confirm: confirmDone ? null : s.confirm,
  }
}

// --- LED view model ---

export type LedLook = 'off' | 'on' | 'soft' | 'hard'

export interface LedView {
  bypass: LedLook
  presetColor: 'green' | 'red'
  presets: [LedLook, LedLook, LedLook, LedLook]
}

export function leds(s: MachineState): LedView {
  const color = s.preset > 4 ? 'red' : 'green'
  const slot = s.preset === 0 ? -1 : (s.preset - 1) % 4
  const all = (look: LedLook): LedView['presets'] => [look, look, look, look]
  const only = (look: LedLook): LedView['presets'] =>
    [0, 1, 2, 3].map((i) => (i === slot ? look : 'off')) as LedView['presets']

  let presets: LedView['presets']
  if (s.confirm && s.confirm.kind !== 'factory') presets = slot < 0 ? all('hard') : only('hard')
  else if (s.copy) presets = slot < 0 ? all('hard') : only('hard')
  else if (isModified(s)) presets = only('soft')
  else presets = only('on')

  let bypass: LedLook = s.engaged ? 'on' : 'off'
  if (s.confirm?.kind === 'factory') bypass = 'hard'
  else if (s.scrollUntil !== null) bypass = 'soft'

  return { bypass, presetColor: color, presets }
}
