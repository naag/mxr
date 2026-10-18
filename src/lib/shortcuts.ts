/**
 * App-wide keyboard shortcuts (PLAN §6). Pure, so the rules are unit-tested: which key does
 * what, and when a key belongs to something else (typing, a focused control, note keys).
 */
import { noteForKey } from './audio/notes'

export type Shortcut = 'nextPreset' | 'prevPreset' | 'mute' | 'footswitch' | 'help'

export interface KeyInfo {
  key: string
  code: string
  shiftKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  repeat: boolean
}

export interface KeyContext {
  /** Focus is in a text field, select or editable element. */
  typing: boolean
  /** Focus is on a button, link, slider or other control that handles Space itself. */
  onControl: boolean
  /** The computer keyboard plays notes, so letter and number keys are notes. */
  noteKeys: boolean
}

export function shortcutFor(e: KeyInfo, ctx: KeyContext): Shortcut | null {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || ctx.typing) return null
  if (e.key === '?') return 'help'
  if (ctx.noteKeys && noteForKey(e.code) !== null) return null
  if (e.code === 'KeyP') return e.shiftKey ? 'prevPreset' : 'nextPreset'
  if (e.code === 'KeyM' && !e.shiftKey) return 'mute'
  if (e.code === 'Space' && !ctx.onControl) return 'footswitch'
  return null
}

/** Describes where focus is, for `shortcutFor`. */
export function keyContext(target: EventTarget | null, noteKeys: boolean): KeyContext {
  const el = typeof HTMLElement !== 'undefined' && target instanceof Element ? target : null
  const typing =
    el instanceof HTMLElement &&
    (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
  const onControl =
    !!el &&
    (/^(BUTTON|A|SUMMARY)$/.test(el.tagName) ||
      el.closest('[role="slider"],[role="button"],[role="tab"],[role="dialog"],dialog') !== null)
  return { typing, onControl, noteKeys }
}
