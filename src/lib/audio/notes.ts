/** Note names, the bass fretboard and the computer-keyboard layout for playing notes. */

const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

/** "A1", "C♯2" (scientific pitch notation, MIDI 60 = C4). */
export function noteName(midi: number): string {
  return `${NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`
}

export interface BassString {
  name: string
  /** MIDI note of the open string. */
  open: number
}

/** Standard 4-string tuning, lowest first. */
export const STRINGS: readonly BassString[] = [
  { name: 'E', open: 28 },
  { name: 'A', open: 33 },
  { name: 'D', open: 38 },
  { name: 'G', open: 43 },
]

export const FRETS = 12

/**
 * Two keyboard rows play two strings, frets 0–11 from left to right: Q … ] is the E string,
 * 1 … = the A string. (V and S stay free for holding the VOICE / SHAPE layers.)
 */
const ROWS: { keys: string; string: number }[] = [
  { keys: 'qwertyuiop[]', string: 0 },
  { keys: '1234567890-=', string: 1 },
]

/** The note a key plays, or null. Uses `KeyboardEvent.code` so it works on any layout. */
export function noteForKey(code: string): number | null {
  const map: Record<string, string> = {
    BracketLeft: '[',
    BracketRight: ']',
    Minus: '-',
    Equal: '=',
  }
  let ch: string | undefined = map[code]
  if (!ch && /^Key[A-Z]$/.test(code)) ch = code.slice(3).toLowerCase()
  if (!ch && /^Digit\d$/.test(code)) ch = code.slice(5)
  if (!ch) return null
  for (const row of ROWS) {
    const fret = row.keys.indexOf(ch)
    if (fret >= 0) return STRINGS[row.string].open + fret
  }
  return null
}
