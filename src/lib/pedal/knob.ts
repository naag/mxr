/** Knob geometry and formatting. A knob value is a number from 0 (fully left) to 1 (fully right). */

/** Total rotation of a knob, from 7 o'clock to 5 o'clock. */
export const SWEEP_DEGREES = 300

/** Arrow-key step: a quarter of a clock hour. */
export const KEY_STEP = 0.025
/** Page Up / Page Down step: one clock hour. */
export const PAGE_STEP = 0.1
/** Pixels of vertical drag for the full range (four times as many with Shift held). */
export const DRAG_PIXELS = 160
export const FINE_DRAG_FACTOR = 4

export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/** Rotation in degrees from 12 o'clock, clockwise. 0 → −150°, 0.5 → 0°, 1 → +150°. */
export function angleFor(value: number): number {
  return (clamp01(value) - 0.5) * SWEEP_DEGREES
}

/** Value on the 0–10 scale players use, rounded to one decimal. */
export function toDial(value: number): number {
  return Math.round(clamp01(value) * 100) / 10
}

/** Clock position the way players describe knobs: "min", "10 o’clock", "max". */
export function clockLabel(value: number): string {
  const v = clamp01(value)
  if (v <= 0.005) return 'min'
  if (v >= 0.995) return 'max'
  const hour = Math.round(7 + v * 10)
  const onClock = ((hour - 1) % 12) + 1
  return onClock === 12 ? 'noon' : `${onClock} o’clock`
}

/** SVG arc path centred on (0, 0), angles in degrees clockwise from 12 o'clock. */
export function arcPath(radius: number, fromDeg: number, toDeg: number): string {
  const point = (deg: number) => {
    const t = (deg * Math.PI) / 180
    return `${(radius * Math.sin(t)).toFixed(2)} ${(-radius * Math.cos(t)).toFixed(2)}`
  }
  if (toDeg - fromDeg < 0.5) return `M${point(fromDeg)}`
  const largeArc = toDeg - fromDeg > 180 ? 1 : 0
  return `M${point(fromDeg)} A${radius} ${radius} 0 ${largeArc} 1 ${point(toDeg)}`
}
