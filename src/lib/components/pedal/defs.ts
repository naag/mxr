const names = [
  'body',
  'spot',
  'grain',
  'blur6',
  'blur14',
  'glow',
  'orangeSkirt',
  'orangeDome',
  'tealSkirt',
  'tealDome',
  'light',
  'spec',
  'cap',
  'chrome',
  'chromeV',
  'fsCap',
  'ledOff',
  'ledFrost',
  'ledBlue',
  'ledGreen',
  'ledAmber',
  'ledRed',
  'scallop',
] as const

export type DefName = (typeof names)[number]
export type DefIds = Record<DefName, string>

/** Unique ids for the shared SVG gradients and filters, so several pedals can share a page. */
export function makeDefIds(prefix: string): DefIds {
  return Object.fromEntries(names.map((n) => [n, `${prefix}-${n}`])) as DefIds
}

export type LedColor = 'green' | 'amber' | 'red' | 'blue'
/** `soft` and `hard` are the manual's slow and fast flashes. */
export type LedState = 'off' | 'on' | 'soft' | 'hard'

export const url = (id: string) => `url(#${id})`

/** Scalloped knob outline, centred on (0, 0). */
export const SCALLOP_PATH =
  'M0 -86 L4.2 -85.8 L8.4 -85.4 L12.6 -84.6 L16.6 -83.6 L20.6 -82.2 L24.4 -80.4 L28 -78.3 L30.8 -74.4 L35.5 -75.2 L39.6 -74.1 L43.6 -72.7 L47.3 -70.8 L51 -68.7 L54.4 -66.3 L57.7 -63.7 L60.8 -60.8 L63.7 -57.7 L66.3 -54.4 L68.7 -51 L70.8 -47.3 L72.7 -43.6 L74.1 -39.6 L75.2 -35.5 L74.4 -30.8 L78.3 -28 L80.4 -24.4 L82.2 -20.6 L83.6 -16.6 L84.6 -12.6 L85.4 -8.4 L85.8 -4.2 L86 0 L85.8 4.2 L85.4 8.4 L84.6 12.6 L83.6 16.6 L82.2 20.6 L80.4 24.4 L78.3 28 L74.4 30.8 L75.2 35.5 L74.1 39.6 L72.7 43.6 L70.8 47.3 L68.7 51 L66.3 54.4 L63.7 57.7 L60.8 60.8 L57.7 63.7 L54.4 66.3 L51 68.7 L47.3 70.8 L43.6 72.7 L39.6 74.1 L35.5 75.2 L30.8 74.4 L28 78.3 L24.4 80.4 L20.6 82.2 L16.6 83.6 L12.6 84.6 L8.4 85.4 L4.2 85.8 L0 86 L-4.2 85.8 L-8.4 85.4 L-12.6 84.6 L-16.6 83.6 L-20.6 82.2 L-24.4 80.4 L-28 78.3 L-30.8 74.4 L-35.5 75.2 L-39.6 74.1 L-43.6 72.7 L-47.3 70.8 L-51 68.7 L-54.4 66.3 L-57.7 63.7 L-60.8 60.8 L-63.7 57.7 L-66.3 54.4 L-68.7 51 L-70.8 47.3 L-72.7 43.6 L-74.1 39.6 L-75.2 35.5 L-74.4 30.8 L-78.3 28 L-80.4 24.4 L-82.2 20.6 L-83.6 16.6 L-84.6 12.6 L-85.4 8.4 L-85.8 4.2 L-86 0 L-85.8 -4.2 L-85.4 -8.4 L-84.6 -12.6 L-83.6 -16.6 L-82.2 -20.6 L-80.4 -24.4 L-78.3 -28 L-74.4 -30.8 L-75.2 -35.5 L-74.1 -39.6 L-72.7 -43.6 L-70.8 -47.3 L-68.7 -51 L-66.3 -54.4 L-63.7 -57.7 L-60.8 -60.8 L-57.7 -63.7 L-54.4 -66.3 L-51 -68.7 L-47.3 -70.8 L-43.6 -72.7 L-39.6 -74.1 L-35.5 -75.2 L-30.8 -74.4 L-28 -78.3 L-24.4 -80.4 L-20.6 -82.2 L-16.6 -83.6 L-12.6 -84.6 L-8.4 -85.4 L-4.2 -85.8 Z'
