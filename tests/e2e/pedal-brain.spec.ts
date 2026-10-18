import { expect, test, type Locator, type Page } from '@playwright/test'

const footswitch = (page: Page) => page.getByRole('button', { name: /^Footswitch/ })
const presetsButton = (page: Page) => page.getByRole('button', { name: /^Presets/ })
const presetName = (page: Page) => page.getByTestId('preset-name')
const status = (page: Page) => page.getByTestId('pedal-status')

/** Press and hold an SVG control with the mouse for `ms` of fake time. */
async function hold(page: Page, target: Locator, ms: number) {
  await target.hover()
  await page.mouse.down()
  await page.clock.runFor(ms)
  await page.mouse.up()
}

async function tap(page: Page, target: Locator) {
  await target.hover()
  await page.mouse.down()
  await page.clock.runFor(80)
  await page.mouse.up()
}

test.beforeEach(async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('holding V reaches the VOICE layer without toggling VOICE', async ({ page }) => {
  const voice = page.getByRole('button', { name: /^Voice:/ })
  await page.keyboard.down('v')
  const glide = page.getByRole('slider', { name: 'Glide' })
  await expect(glide).toBeVisible()
  await glide.focus()
  await page.keyboard.press('End')
  await expect(glide).toHaveAttribute('aria-valuetext', 'max, 1.00 s')
  await page.keyboard.up('v')
  await expect(page.getByRole('slider', { name: 'Resonance' })).toBeVisible()
  await expect(voice).toHaveAttribute('aria-pressed', 'false')
})

test('the layer switch shows the SHAPE layer and its stepped controls', async ({ page }) => {
  await page.getByRole('button', { name: /^Shape layer/ }).click()
  const mode = page.getByRole('slider', { name: 'Output mode' })
  await expect(mode).toHaveAttribute('aria-valuetext', 'MONO')
  await mode.focus()
  await page.keyboard.press('ArrowUp')
  await expect(mode).toHaveAttribute('aria-valuetext', 'WET/DRY')
  await page.keyboard.press('ArrowUp')
  await expect(mode).toHaveAttribute('aria-valuetext', 'STEREO')
  await expect(page.getByTestId('control-caption')).toContainText('OUTPUT MODE')
  await page.getByRole('button', { name: /^Main/ }).click()
  await expect(page.getByRole('slider', { name: 'Mod' })).toBeVisible()
})

test('presets load their sounds and flag edits', async ({ page }) => {
  await expect(presetName(page)).toHaveText('Live mode (your knobs)')
  await page.getByRole('button', { name: 'Next preset', exact: true }).click()
  await page.getByRole('button', { name: 'Next preset', exact: true }).click()
  await page.getByRole('button', { name: 'Next preset', exact: true }).click()
  await expect(presetName(page)).toHaveText('Lizard Synth')
  const cutoff = page.getByRole('slider', { name: 'Cutoff' })
  await expect(cutoff).toHaveAttribute('aria-valuetext', '10 o’clock, 211 Hz')
  await expect(page.getByTestId('preset-edited')).toHaveCount(0)
  await cutoff.focus()
  await page.keyboard.press('ArrowUp')
  await expect(page.getByTestId('preset-edited')).toBeVisible()
  await page.getByRole('button', { name: 'Previous preset', exact: true }).click()
  await expect(presetName(page)).toHaveText('Wonderful')
})

test('holding the footswitch scrolls presets until it times out', async ({ page }) => {
  await hold(page, footswitch(page), 700)
  await expect(status(page)).toContainText('Preset scroll')
  await tap(page, footswitch(page))
  await expect(presetName(page)).toHaveText('Thrillenganes')
  await expect(footswitch(page)).toHaveAccessibleName('Footswitch: synth on')
  await page.clock.runFor(6000)
  await expect(status(page)).toHaveText('')
  await tap(page, footswitch(page))
  await expect(footswitch(page)).toHaveAccessibleName('Footswitch: synth bypassed')
})

test('copy the sound with a long PRESETS press and save it into another preset', async ({
  page,
}) => {
  const mix = page.getByRole('slider', { name: 'Mix', exact: true })
  await mix.focus()
  await page.keyboard.press('Home')
  await hold(page, presetsButton(page), 2100)
  await expect(status(page)).toContainText('You can’t save into live mode')
  await page.getByRole('button', { name: 'Next preset', exact: true }).click()
  await expect(status(page)).toContainText('Sound copied')
  await hold(page, presetsButton(page), 2100)
  await expect(status(page)).toHaveText('Saved.')
  await expect(presetName(page)).toHaveText('Thrillenganes')
  await expect(mix).toHaveAttribute('aria-valuenow', '0')

  await page.reload()
  await page.getByRole('button', { name: 'Next preset', exact: true }).click()
  await expect(page.getByRole('slider', { name: 'Mix', exact: true })).toHaveAttribute(
    'aria-valuenow',
    '0',
  )
})

test('live mode remembers your knobs after a reload', async ({ page }) => {
  const sub = page.getByRole('slider', { name: 'Sub mix' })
  await sub.focus()
  await page.keyboard.press('End')
  await page.reload()
  await expect(page.getByRole('slider', { name: 'Sub mix' })).toHaveAttribute(
    'aria-valuetext',
    'max, 100% sub',
  )
})

test('a share link opens the same sound', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only in Playwright')
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.getByRole('button', { name: 'Next preset', exact: true }).click()
  const res = page.getByRole('slider', { name: 'Resonance' })
  await res.focus()
  await page.keyboard.press('Home')
  await page.getByRole('button', { name: 'Copy link to this sound' }).click()
  await expect(page.getByRole('button', { name: 'Link copied' })).toBeVisible()
  const link = await page.evaluate(() => navigator.clipboard.readText())
  expect(link).toContain('#/?p=1.')

  const other = await context.newPage()
  await other.goto(link)
  await other.evaluate(() => localStorage.clear())
  await other.goto(link)
  await expect(other.getByTestId('preset-name')).toHaveText('Live mode (your knobs)')
  await expect(other.getByRole('slider', { name: 'Resonance' })).toHaveAttribute(
    'aria-valuetext',
    'min, 0%, smooth',
  )
})
