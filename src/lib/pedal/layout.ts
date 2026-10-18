/**
 * Pedal geometry in SVG user units, measured from the manual's product photo.
 * Matches the approved mockup (docs/mockup/Pedal.dc.html).
 */
export const VIEWBOX = { x: -34, y: -10, width: 804, height: 1350 }

export const ENCLOSURE = { x: 10, y: 10, width: 716, height: 1308, radius: 46 }

export type KnobId = 'mix' | 'cutoff' | 'envelope' | 'sub' | 'resonance' | 'mod'
export type KnobColor = 'orange' | 'teal'

export interface KnobSpot {
  id: KnobId
  x: number
  y: number
  color: KnobColor
  /** Baseline of the screen-printed label under the knob. */
  labelY: number
}

export const KNOBS: KnobSpot[] = [
  { id: 'mix', x: 135, y: 215, color: 'orange', labelY: 336 },
  { id: 'cutoff', x: 365, y: 215, color: 'teal', labelY: 336 },
  { id: 'envelope', x: 590, y: 215, color: 'teal', labelY: 336 },
  { id: 'sub', x: 135, y: 446, color: 'orange', labelY: 567 },
  { id: 'resonance', x: 365, y: 446, color: 'teal', labelY: 567 },
  { id: 'mod', x: 590, y: 446, color: 'teal', labelY: 567 },
]

export const VOICE_BUTTON = { x: 258, y: 96, r: 30 }
export const SHAPE_BUTTON = { x: 478, y: 98, r: 31 }
export const SHAPE_LEDS = { triangle: 546, saw: 597, square: 643, y: 78 }
export const BYPASS_LED = { x: 360, y: 782 }
export const FOOTSWITCH = { x: 365, y: 960 }
export const PRESET_LEDS = { xs: [245, 305, 365, 428], y: 1205 }
export const PRESET_BUTTON = { x: 488, y: 1205 }
export const JACKS = {
  out: { side: 'left', y: 597 },
  ctr: { side: 'left', y: 1066 },
  in: { side: 'right', y: 597 },
} as const
