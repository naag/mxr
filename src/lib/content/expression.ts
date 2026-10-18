/** Copy for the virtual expression pedal (docs/pedal-reference.md §7). */
export const expressionCopy = {
  title: 'Expression pedal',
  sub: 'Rock between a heel and a toe sound',
  plug: 'Plug in an expression pedal',
  plugged: 'Plugged into CTR (switch on TAP/EXP)',
  unplugged:
    'The real pedal takes an expression pedal on its CTR jack. Without one you hear the heel sound.',
  rocker: 'Expression pedal position',
  position: (p: number) =>
    p <= 0.005 ? 'heel down' : p >= 0.995 ? 'toe down' : `${Math.round(p * 100)}% toward toe`,
  editLabel: 'Knobs set the',
  heel: 'Heel',
  toe: 'Toe',
  editHeelHint: 'Knobs set the heel sound, the one you hear with the pedal back.',
  editToeHint:
    'Knobs now set the toe sound, and you hear it. Rock the pedal to hear the morph. Only the printed knobs and the VOICE layer morph.',
  sweep: 'Sweep',
  stopSweep: 'Stop sweep',
  morphs: 'What the pedal morphs',
  none: 'Nothing yet: pick Toe and turn a knob to make the toe sound different.',
  clear: 'Forget the toe sound',
  honesty:
    'We don’t know how the real pedal sets its toe sound from the front panel, so this uses a Heel/Toe switch.',
  row: (label: string, heel: string, toe: string) => `${label}: heel ${heel}, toe ${toe}`,
}
