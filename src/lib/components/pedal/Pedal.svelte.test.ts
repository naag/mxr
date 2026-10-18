import { describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-svelte'
import { DEFAULT_KNOBS } from '../../pedal/layout'
import { PedalState } from '../../pedal/pedal.svelte'
import Pedal from './Pedal.svelte'

async function setup() {
  const pedal = new PedalState()
  const screen = await render(Pedal, { pedal })
  return { pedal, screen }
}

const led = (name: string) => document.querySelector(`[data-led="${name}"]`)

describe('Pedal', () => {
  it('has the six knobs as sliders with clock positions', async () => {
    const { screen } = await setup()
    for (const name of ['Mix', 'Cutoff', 'Envelope', 'Sub mix', 'Resonance', 'Mod']) {
      await expect.element(screen.getByRole('slider', { name })).toBeInTheDocument()
    }
    const cutoff = screen.getByRole('slider', { name: 'Cutoff' })
    await expect.element(cutoff).toHaveAttribute('aria-valuenow', '4')
    await expect.element(cutoff).toHaveAttribute('aria-valuetext', '11 o’clock')
  })

  it('turns a knob with the keyboard', async () => {
    const { pedal, screen } = await setup()
    const cutoff = screen.getByRole('slider', { name: 'Cutoff' })
    await cutoff.click()
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}')
    expect(pedal.knobs.cutoff).toBeCloseTo(0.5)
    await expect.element(cutoff).toHaveAttribute('aria-valuetext', 'noon')
    await userEvent.keyboard('{PageDown}')
    expect(pedal.knobs.cutoff).toBeCloseTo(0.4)
    await userEvent.keyboard('{End}')
    await expect.element(cutoff).toHaveAttribute('aria-valuenow', '10')
    await userEvent.keyboard('{Home}')
    await expect.element(cutoff).toHaveAttribute('aria-valuetext', 'min')
  })

  it('resets a knob on double-click', async () => {
    const { pedal, screen } = await setup()
    pedal.setKnob('mod', 1)
    await screen.getByRole('slider', { name: 'Mod' }).dblClick()
    expect(pedal.knobs.mod).toBe(DEFAULT_KNOBS.mod)
  })

  it('cycles SHAPE and lights the matching LED', async () => {
    const { screen } = await setup()
    expect(led('shape-saw')?.getAttribute('data-state')).toBe('on')
    await screen.getByRole('button', { name: /^Shape/ }).click()
    expect(led('shape-square')?.getAttribute('data-state')).toBe('on')
    expect(led('shape-saw')?.getAttribute('data-state')).toBe('off')
    await screen.getByRole('button', { name: /^Shape/ }).click()
    expect(led('shape-triangle')?.getAttribute('data-state')).toBe('on')
  })

  it('toggles VOICE', async () => {
    const { screen } = await setup()
    const voice = screen.getByRole('button', { name: /^Voice/ })
    await expect.element(voice).toHaveAttribute('aria-pressed', 'false')
    await voice.click()
    await expect.element(voice).toHaveAttribute('aria-pressed', 'true')
  })

  it('bypasses with the footswitch, also from the keyboard', async () => {
    const { pedal, screen } = await setup()
    const footswitch = screen.getByRole('button', { name: /^Footswitch/ })
    await footswitch.click()
    expect(pedal.engaged).toBe(false)
    expect(led('bypass')?.getAttribute('data-state')).toBe('off')
    await userEvent.keyboard(' ')
    expect(pedal.engaged).toBe(true)
    expect(led('bypass')?.getAttribute('data-state')).toBe('on')
  })

  it('steps PRESETS through the green and red banks back to live mode', async () => {
    const { pedal, screen } = await setup()
    const presets = screen.getByRole('button', { name: /^Presets/ })
    await presets.click()
    expect(led('preset-1')?.getAttribute('data-color')).toBe('green')
    expect(led('preset-1')?.getAttribute('data-state')).toBe('on')
    for (let i = 0; i < 4; i++) await presets.click()
    expect(pedal.preset).toBe(5)
    expect(led('preset-1')?.getAttribute('data-color')).toBe('red')
    for (let i = 0; i < 4; i++) await presets.click()
    expect(pedal.preset).toBe(0)
    expect(document.querySelectorAll('[data-led^="preset-"][data-state="on"]')).toHaveLength(0)
  })

  it('reports the control being pointed at', async () => {
    const { pedal } = await setup()
    await page.getByRole('slider', { name: 'Resonance' }).hover()
    expect(pedal.focused).toBe('resonance')
  })
})
