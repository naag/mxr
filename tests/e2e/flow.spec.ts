import { expect, test, type Page } from '@playwright/test'

const row = (page: Page, id: string) => page.locator(`button[data-stage="${id}"]`)

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

async function openFlow(page: Page) {
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Under the hood' })
    .click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Follow the signal')
}

test('shows every step from your bass to the output @smoke', async ({ page }) => {
  await openFlow(page)
  const steps = page
    .getByRole('list', { name: 'Steps inside the pedal' })
    .locator('button[data-stage]')
  await expect(steps).toHaveCount(10)
  await expect(row(page, 'filter')).toContainText('This is where the sound gets darker')
  await expect(row(page, 'filter')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('inspector').getByRole('heading', { level: 2 })).toHaveText(
    'Filter',
  )
})

test('selecting a step inspects it', async ({ page }) => {
  await openFlow(page)
  await row(page, 'amp').click()
  await expect(row(page, 'amp')).toHaveAttribute('aria-pressed', 'true')
  await expect(row(page, 'filter')).toHaveAttribute('aria-pressed', 'false')
  const inspector = page.getByTestId('inspector')
  await expect(inspector.getByRole('heading', { level: 2 })).toHaveText('Amp')
  await expect(inspector).toContainText('AMP ENV')
  await expect(inspector.getByRole('img', { name: /Going in/ })).toBeVisible()
})

test('shows which modulators and steps are active', async ({ page }) => {
  await openFlow(page)
  // Live mode starts with a little MOD (mostly chorus) and no glide.
  await expect(page.locator('[data-mod="lfo"]')).toHaveAttribute('data-active', 'true')
  await expect(page.locator('[data-mod="glide"]')).toHaveAttribute('data-active', 'false')
  await expect(row(page, 'chorus')).toHaveAttribute('data-status', 'on')
})

test('bypass greys out the synth path', async ({ page }) => {
  await page.getByRole('button', { name: /^Footswitch/ }).click()
  await openFlow(page)
  await expect(row(page, 'filter')).toHaveAttribute('data-status', 'bypassed')
  await expect(row(page, 'input')).toHaveAttribute('data-status', 'on')
  await expect(row(page, 'filter')).toContainText('bypassed')
})

test('shows the dry path and output routing from the SHAPE layer', async ({ page }) => {
  await page.getByRole('button', { name: /^Shape layer/ }).click()
  await page.getByRole('slider', { name: 'Dry through effects' }).focus()
  await page.keyboard.press('End')
  await page.getByRole('slider', { name: 'Output mode' }).focus()
  await page.keyboard.press('End')
  await openFlow(page)
  await expect(page.getByTestId('dry-thru')).toBeVisible()
  await expect(page.locator('[data-dry-into="filter"]')).toHaveCount(1)
  await row(page, 'out').click()
  await expect(page.getByTestId('routing')).toHaveAttribute('data-mode', 'stereo')
  await expect(page.getByTestId('routing')).toContainText('Right')
})

test('clicking a chain block on Play points the waveform at it', async ({ page }) => {
  await page.locator('button[data-block="amp"]').click()
  await expect(page.getByTestId('scope-readout')).toContainText('After the amp')
  await expect(page.locator('button[data-block="amp"]')).toHaveAttribute('aria-pressed', 'true')
  await page.locator('button[data-block="osc"]').click()
  await expect(page.getByTestId('scope-readout')).toContainText('Oscillator mix')
})
