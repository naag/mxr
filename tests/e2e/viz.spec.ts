import { expect, test, type Page } from '@playwright/test'

const panel = (page: Page, id: string) => page.locator(`[data-viz="${id}"]`)
const readout = (page: Page, id: string) => page.getByTestId(`${id}-readout`)

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('visuals show a computed note while the sound is off @smoke', async ({ page }) => {
  for (const id of ['scope', 'spectrum', 'envelope', 'pitch', 'meter']) {
    await expect(panel(page, id)).toHaveAttribute('data-live', 'false')
    await expect(readout(page, id)).not.toBeEmpty()
  }
  await expect(readout(page, 'scope')).toContainText('After the filter: A1')
  await expect(readout(page, 'spectrum')).toContainText('harmonics come through the filter')
  await expect(readout(page, 'envelope')).toContainText('Cutoff starts at')
})

test('turning a knob updates the computed visuals', async ({ page }) => {
  await expect(readout(page, 'envelope')).toContainText('Cutoff starts at')
  const cutoff = page.getByRole('slider', { name: 'Cutoff', exact: true })
  await cutoff.focus()
  await page.keyboard.press('End')
  await expect(readout(page, 'envelope')).toContainText('Cutoff starts at 10 kHz')
  await page.keyboard.press('Home')
  await expect(readout(page, 'envelope')).toContainText('Cutoff starts at 40 Hz')
})

// E2E scenario 9 (PLAN §7.2).
test('pointing at CUTOFF highlights the filter and the spectrum curve', async ({ page }) => {
  const cutoff = page.getByRole('slider', { name: 'Cutoff', exact: true })
  await cutoff.hover()
  await expect(panel(page, 'spectrum')).toHaveAttribute('data-highlighted', 'true')
  await expect(page.getByTestId('spectrum-curve')).toHaveAttribute('data-curve-highlighted', 'true')
  await expect(page.locator('[data-block="filter"]')).toHaveAttribute('data-highlighted', 'true')
  await expect(panel(page, 'pitch')).toHaveAttribute('data-highlighted', 'false')

  await page.mouse.move(5, 5)
  await expect(panel(page, 'spectrum')).toHaveAttribute('data-highlighted', 'false')
  await expect(page.locator('[data-block="filter"]')).toHaveAttribute('data-highlighted', 'false')

  // Keyboard focus links the same way.
  await cutoff.focus()
  await expect(panel(page, 'spectrum')).toHaveAttribute('data-highlighted', 'true')
})

test('pointing at a visual lights the knobs that change it', async ({ page }) => {
  await panel(page, 'spectrum').hover()
  await expect(page.getByRole('slider', { name: 'Cutoff', exact: true })).toHaveAttribute(
    'data-highlighted',
    'true',
  )
  await expect(page.getByRole('slider', { name: 'Mix', exact: true })).toHaveAttribute(
    'data-highlighted',
    'false',
  )
  await panel(page, 'meter').hover()
  await expect(page.getByRole('slider', { name: 'Mix', exact: true })).toHaveAttribute(
    'data-highlighted',
    'true',
  )
})

test('Simple ⇄ Detailed changes the readouts and is remembered', async ({ page }) => {
  const detailed = page.getByRole('button', { name: 'Detailed' })
  await detailed.click()
  await expect(detailed).toHaveAttribute('aria-pressed', 'true')
  await expect(readout(page, 'spectrum')).toContainText('Fundamental A1')
  await expect(readout(page, 'scope')).toContainText('Hz · 1 cycle =')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Detailed' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('Detailed mode adds a spectrogram that follows the cutoff', async ({ page }) => {
  await expect(panel(page, 'spectrogram')).toHaveCount(0)
  await page.getByRole('button', { name: 'Detailed' }).click()
  const spec = panel(page, 'spectrogram')
  await expect(readout(page, 'spectrogram')).toContainText('during the note the loudest part')
  const top = async () => {
    const text = (await readout(page, 'spectrogram').textContent()) ?? ''
    const m = text.match(/up to ([\d.]+) (k?)Hz/)
    return m ? Number(m[1]) * (m[2] ? 1000 : 1) : NaN
  }
  // Synth only, so the clean bass doesn't hide the filter.
  await page.getByRole('slider', { name: 'Mix', exact: true }).focus()
  await page.keyboard.press('End')
  await expect.poll(top).toBeGreaterThan(0)
  const before = await top()
  const cutoff = page.getByRole('slider', { name: 'Cutoff' })
  await cutoff.focus()
  await page.keyboard.press('Home')
  await expect.poll(top).toBeLessThan(before)
  await cutoff.hover()
  await expect(spec).toHaveAttribute('data-highlighted', 'true')
})

test('the scope can look at each tap point and split the oscillators', async ({ page }) => {
  const taps = page.getByRole('group', { name: 'Where to look' })
  await taps.getByRole('button', { name: 'Amp' }).click()
  await expect(readout(page, 'scope')).toContainText('After the amp')
  await taps.getByRole('button', { name: 'Output' }).click()
  await expect(readout(page, 'scope')).toContainText('Pedal output')
  await taps.getByRole('button', { name: 'Oscillator' }).click()
  await expect(readout(page, 'scope')).toContainText('Oscillator mix')
  const layers = page.getByRole('button', { name: 'Layers' })
  await layers.click()
  await expect(layers).toHaveAttribute('aria-pressed', 'true')
  await expect(panel(page, 'scope')).toContainText('Sub (−1 octave)')
})

test('visuals go live while a riff plays', async ({ page }) => {
  await page.waitForFunction(() => '__MXR_TEST__' in window)
  await page.getByRole('button', { name: 'Start sound' }).click()
  await page.getByRole('button', { name: 'Play riff' }).click()
  for (const id of ['scope', 'spectrum', 'envelope', 'pitch', 'meter']) {
    await expect(panel(page, id)).toHaveAttribute('data-live', 'true')
  }
  await expect(readout(page, 'pitch')).toContainText('Now ', { timeout: 5000 })
  await page.getByRole('button', { name: 'Stop riff' }).click()
  await expect(panel(page, 'scope')).toHaveAttribute('data-live', 'false')
})

test('visuals look right @visual', async ({ page, isMobile }) => {
  await page.getByRole('button', { name: 'Detailed' }).click()
  await expect(readout(page, 'spectrum')).toContainText('Fundamental A1')
  await page.evaluate(() => document.fonts.ready)
  const name = isMobile ? 'visuals-mobile.png' : 'visuals.png'
  await expect(page.locator('main')).toHaveScreenshot(name, { maxDiffPixelRatio: 0.01 })
})
