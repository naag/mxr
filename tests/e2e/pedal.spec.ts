import { expect, test, type Locator, type Page } from '@playwright/test'

async function drag(page: Page, target: Locator, dy: number) {
  const box = await target.boundingBox()
  if (!box) throw new Error('knob not visible')
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y + dy, { steps: 8 })
  await page.mouse.up()
}

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('shows the pedal with all controls @smoke', async ({ page }) => {
  const pedal = page.getByRole('group', { name: 'MXR Bass Synth pedal' })
  await expect(pedal).toBeVisible()
  await expect(pedal.getByRole('slider')).toHaveCount(6)
  for (const name of [/^Voice/, /^Shape/, /^Footswitch/, /^Presets/]) {
    await expect(pedal.getByRole('button', { name })).toBeVisible()
  }
})

test('dragging a knob up turns it right, down turns it left', async ({ page, isMobile }) => {
  test.skip(isMobile, 'mouse drag; touch drag is covered by the pointer events tests later')
  const cutoff = page.getByRole('slider', { name: 'Cutoff' })
  await expect(cutoff).toHaveAttribute('aria-valuenow', '4')
  await drag(page, cutoff, -80)
  await expect(cutoff).toHaveAttribute('aria-valuenow', '9')
  await drag(page, cutoff, 160)
  await expect(cutoff).toHaveAttribute('aria-valuenow', '0')
})

test('the mouse wheel turns a knob without scrolling the page', async ({ page, isMobile }) => {
  test.skip(isMobile, 'no mouse wheel on phones')
  const mix = page.getByRole('slider', { name: 'Mix', exact: true })
  await mix.hover()
  const scrollBefore = await page.evaluate(() => window.scrollY)
  await page.mouse.wheel(0, -100)
  await expect(mix).toHaveAttribute('aria-valuenow', '7.3')
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore)
})

test('keyboard users can reach and turn every knob', async ({ page }) => {
  const mod = page.getByRole('slider', { name: 'Mod' })
  await mod.focus()
  await page.keyboard.press('End')
  await expect(mod).toHaveAttribute('aria-valuetext', 'max')
  await expect(page.getByTestId('control-caption')).toContainText('MOD')
})

test('the caption explains the control in focus', async ({ page }) => {
  const caption = page.getByTestId('control-caption')
  await expect(caption).toContainText('Try it')
  await page.getByRole('slider', { name: 'Cutoff' }).focus()
  await expect(caption).toContainText('CUTOFF')
  await expect(caption).toContainText('How bright the synth is')
  await page.getByRole('button', { name: /^Footswitch/ }).focus()
  await expect(caption).toContainText('FOOTSWITCH')
})

test('SHAPE, VOICE and the footswitch respond to taps', async ({ page }) => {
  const shape = page.getByRole('button', { name: /^Shape/ })
  await expect(shape).toHaveAccessibleName('Shape: sawtooth')
  await shape.click()
  await expect(shape).toHaveAccessibleName('Shape: square')

  const voice = page.getByRole('button', { name: /^Voice/ })
  await voice.click()
  await expect(voice).toHaveAttribute('aria-pressed', 'true')

  const footswitch = page.getByRole('button', { name: /^Footswitch/ })
  await footswitch.click()
  await expect(footswitch).toHaveAccessibleName('Footswitch: synth bypassed')
})

test('pedal looks right @visual', async ({ page, browserName, isMobile }) => {
  test.skip(browserName !== 'chromium' || isMobile, 'baseline is desktop Chromium only')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.getByRole('group', { name: 'MXR Bass Synth pedal' })).toHaveScreenshot(
    'pedal.png',
    { maxDiffPixelRatio: 0.01 },
  )
})
