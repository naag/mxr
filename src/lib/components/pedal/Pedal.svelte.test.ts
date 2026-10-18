import { describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-svelte'
import { PARAM } from '../../pedal/params'
import { PedalStore } from '../../pedal/pedal.svelte'
import Pedal from './Pedal.svelte'

async function setup() {
  const pedal = new PedalStore({ storage: null })
  const screen = await render(Pedal, { pedal })
  return { pedal, screen }
}

const led = (name: string) => document.querySelector(`[data-led="${name}"]`)
const labels = () =>
  [...document.querySelectorAll('.legends > text')].slice(0, 6).map((t) => t.textContent)

describe('Pedal', () => {
  it('has the six knobs as sliders with clock positions and values', async () => {
    const { screen } = await setup()
    for (const name of ['Mix', 'Cutoff', 'Envelope', 'Sub mix', 'Resonance', 'Mod']) {
      await expect.element(screen.getByRole('slider', { name, exact: true })).toBeInTheDocument()
    }
    const cutoff = screen.getByRole('slider', { name: 'Cutoff' })
    await expect.element(cutoff).toHaveAttribute('aria-valuenow', '4')
    await expect.element(cutoff).toHaveAttribute('aria-valuetext', '11 o’clock, 368 Hz')
  })

  it('turns a knob with the keyboard', async () => {
    const { pedal, screen } = await setup()
    const cutoff = screen.getByRole('slider', { name: 'Cutoff' })
    await cutoff.click()
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}')
    expect(pedal.state.current.values.cutoff).toBeCloseTo(0.5)
    await expect.element(cutoff).toHaveAttribute('aria-valuetext', 'noon, 640 Hz')
    await userEvent.keyboard('{End}')
    await expect.element(cutoff).toHaveAttribute('aria-valuenow', '10')
  })

  it('resets a knob on double-click', async () => {
    const { pedal, screen } = await setup()
    pedal.turn('mod', 1)
    await screen.getByRole('slider', { name: 'Mod' }).dblClick()
    expect(pedal.state.current.values.mod).toBe(PARAM.mod.initial)
  })

  it('cycles SHAPE on a tap and lights the matching LED', async () => {
    const { screen } = await setup()
    expect(led('shape-saw')?.getAttribute('data-state')).toBe('on')
    await screen.getByRole('button', { name: /^Shape/ }).click()
    expect(led('shape-square')?.getAttribute('data-state')).toBe('on')
    expect(led('shape-saw')?.getAttribute('data-state')).toBe('off')
  })

  it('toggles VOICE on a tap', async () => {
    const { screen } = await setup()
    const voice = screen.getByRole('button', { name: /^Voice/ })
    await expect.element(voice).toHaveAttribute('aria-pressed', 'false')
    await voice.click()
    await expect.element(voice).toHaveAttribute('aria-pressed', 'true')
  })

  it('relabels the knobs while VOICE or SHAPE is held', async () => {
    const { pedal, screen } = await setup()
    expect(labels()).toEqual(['MIX', 'CUTOFF', 'ENVELOPE', 'SUB MIX', 'RESONANCE', 'MOD'])
    pedal.down('voice')
    await expect.element(screen.getByRole('slider', { name: 'Glide' })).toBeInTheDocument()
    expect(labels()).toEqual([
      'VOICE MIX',
      'FILTER ENV AMT',
      'AMP ENV',
      'NOISE MIX',
      'GLIDE',
      'MOD BLEND',
    ])
    pedal.up('voice')
    pedal.down('shape')
    await expect.element(screen.getByRole('slider', { name: 'Output mode' })).toBeInTheDocument()
    expect(document.body.textContent).toContain('WET/DRY')
    pedal.up('shape')
  })

  it('bypasses with the footswitch, also from the keyboard', async () => {
    const { pedal, screen } = await setup()
    const footswitch = screen.getByRole('button', { name: /^Footswitch/ })
    await footswitch.click()
    expect(pedal.state.engaged).toBe(false)
    expect(led('bypass')?.getAttribute('data-state')).toBe('off')
    await userEvent.keyboard(' ')
    expect(pedal.state.engaged).toBe(true)
    expect(led('bypass')?.getAttribute('data-state')).toBe('on')
  })

  it('steps PRESETS through the green and red banks back to live mode', async () => {
    const { pedal, screen } = await setup()
    const presets = screen.getByRole('button', { name: /^Presets/ })
    await presets.click()
    expect(led('preset-1')?.getAttribute('data-color')).toBe('green')
    expect(led('preset-1')?.getAttribute('data-state')).toBe('on')
    for (let i = 0; i < 4; i++) await presets.click()
    expect(pedal.state.preset).toBe(5)
    expect(led('preset-1')?.getAttribute('data-color')).toBe('red')
    for (let i = 0; i < 4; i++) await presets.click()
    expect(pedal.state.preset).toBe(0)
    expect(document.querySelectorAll('[data-led^="preset-"][data-state="on"]')).toHaveLength(0)
  })

  it('reports the control being pointed at', async () => {
    const { pedal } = await setup()
    await page.getByRole('slider', { name: 'Resonance' }).hover()
    expect(pedal.focused).toBe('resonance')
  })
})
