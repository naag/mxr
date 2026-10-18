import { expect, test } from '@playwright/test'

const stage = (page: import('@playwright/test').Page, id: string) =>
  page.locator(`[data-stage="${id}"]`).first()

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await page.evaluate(() => localStorage.clear())
  await page.goto('./#/flow')
})

test('shows every stage with a mini scope and inspects the filter @smoke', async ({ page }) => {
  const diagram = page.getByRole('list', { name: 'Signal flow, from your bass to the output' })
  await expect(diagram.getByRole('button')).toHaveCount(10)
  await expect(page.locator('canvas[data-tap]').first()).toBeVisible()
  const inspector = page.getByTestId('flow-inspector')
  await expect(inspector).toHaveAttribute('data-stage', 'filter')
  await expect(inspector.getByRole('heading', { name: 'Filter' })).toBeVisible()
  await expect(diagram.getByRole('button', { name: /^Filter\b/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('selecting a block inspects it and focuses its tap in the scope', async ({ page }) => {
  await page.getByRole('button', { name: /^Amp\b/ }).click()
  await expect(page.getByTestId('flow-inspector')).toHaveAttribute('data-stage', 'amp')
  await page.getByRole('link', { name: 'Play' }).click()
  await expect(
    page.getByRole('group', { name: 'Where to look' }).getByRole('button', { name: 'Amp' }),
  ).toHaveAttribute('aria-pressed', 'true')
})

test('stages grey out when their knob is at minimum, and light up when turned', async ({
  page,
}) => {
  await page.getByRole('button', { name: /^Compressor/ }).click()
  const comp = page.getByRole('slider', { name: 'COMP' })
  await comp.focus()
  await page.keyboard.press('Home')
  await expect(stage(page, 'comp')).toHaveAttribute('data-active', 'false')
  await expect(page.getByTestId('flow-idle')).toBeVisible()
  await page.keyboard.press('End')
  await expect(stage(page, 'comp')).toHaveAttribute('data-active', 'true')
})

test('shows the dry path per DRY THRU FX and OUTPUT MODE', async ({ page }) => {
  await expect(page.getByTestId('dry-thru-path')).toHaveCount(0)
  await page.getByRole('button', { name: /^Mix\b/ }).click()
  const dry = page.getByRole('slider', { name: 'DRY THRU FX' })
  await dry.focus()
  await page.keyboard.press('End')
  await expect(page.getByTestId('dry-thru-path')).toHaveCount(1)

  await page.getByRole('button', { name: /^Output\b/ }).click()
  const mode = page.getByRole('slider', { name: 'OUTPUT MODE' })
  await mode.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByTestId('routing')).toContainText('WET/DRY')
  await expect(page.getByTestId('dry-state')).toContainText('right output')
  await expect(stage(page, 'mix')).toHaveAttribute('data-active', 'false')
})

test('bypass greys out the synth and stops the particles', async ({ page }) => {
  await expect(page.getByTestId('particle').first()).toBeAttached()
  await page.getByRole('button', { name: /^Your bass/ }).click()
  await page.getByRole('button', { name: 'Synth on' }).click()
  await expect(page.getByTestId('signal-flow')).toHaveAttribute('data-engaged', 'false')
  await expect(page.getByTestId('particle')).toHaveCount(0)
  await expect(stage(page, 'filter')).toHaveAttribute('data-active', 'false')
})

test('the inspector changes the sound: shape and cutoff', async ({ page }) => {
  const cutoff = page.getByRole('slider', { name: 'CUTOFF' })
  await cutoff.focus()
  await page.keyboard.press('Home')
  await expect(cutoff).toHaveAttribute('aria-valuetext', /40 Hz/)
  await page.getByRole('button', { name: /^Oscillators/ }).click()
  await page.getByRole('group', { name: 'SHAPE' }).getByRole('button', { name: 'Square' }).click()
  await page.getByRole('link', { name: 'Play' }).click()
  await expect(page.getByRole('button', { name: /^Shape: square/ })).toBeVisible()
})
