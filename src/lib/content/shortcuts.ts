/** The keyboard shortcut sheet (opens with `?`). */
export const shortcutsCopy = {
  title: 'Keyboard shortcuts',
  open: 'Keyboard shortcuts',
  close: 'Close',
  groups: [
    {
      title: 'Pedal',
      rows: [
        { keys: ['Space'], text: 'Footswitch: synth on or off' },
        { keys: ['P'], text: 'Next preset' },
        { keys: ['Shift', 'P'], text: 'Previous preset' },
        { keys: ['V'], text: 'Hold for the VOICE layer' },
        { keys: ['S'], text: 'Hold for the SHAPE layer' },
      ],
    },
    {
      title: 'A focused knob or slider',
      rows: [
        { keys: ['↑', '→'], text: 'Turn up a little' },
        { keys: ['↓', '←'], text: 'Turn down a little' },
        { keys: ['Page Up', 'Page Down'], text: 'One clock hour' },
        { keys: ['Home', 'End'], text: 'Fully left or right' },
      ],
    },
    {
      title: 'Sound',
      rows: [
        { keys: ['M'], text: 'Mute or unmute' },
        { keys: ['Q … ]'], text: 'E string, frets 0–11 (Keys source)' },
        { keys: ['1 … ='], text: 'A string, frets 0–11 (Keys source)' },
        { keys: ['?'], text: 'This list' },
      ],
    },
  ],
  note: 'With the Keys source on, letter and number keys play notes, so P works only from the other sources.',
}
