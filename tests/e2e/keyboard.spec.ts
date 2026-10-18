import { expect, test } from '@playwright/test'

// Keyboard-only use (PLAN §6 and Phase 9's a11y audit).
test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('the first Tab offers a skip link to the content', async ({ page }) => {
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to content' })
  await expect(skip).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
  await expect(page).toHaveURL(/#?\/?$/)
})

test('pedal shortcuts: P, Shift+P and Space', async ({ page }) => {
  const name = page.getByTestId('preset-name')
  await page.keyboard.press('p')
  await expect(name).toHaveText('Thrillenganes')
  await page.keyboard.press('Shift+P')
  await expect(name).toHaveText('Live mode (your knobs)')
  const foot = page.getByRole('button', { name: /^Footswitch/ })
  await expect(foot).toHaveAccessibleName('Footswitch: synth on')
  await page.keyboard.press('Space')
  await expect(foot).toHaveAccessibleName('Footswitch: synth bypassed')
})

test('M mutes and ? lists the shortcuts', async ({ page }) => {
  await page.getByRole('button', { name: 'Start sound' }).click()
  await page.locator('body').click({ position: { x: 5, y: 300 } })
  const mute = page.getByRole('button', { name: /Sound on|Muted/ })
  await expect(mute).toHaveAttribute('aria-pressed', 'false')
  await page.keyboard.press('m')
  await expect(mute).toHaveAttribute('aria-pressed', 'true')

  await page.keyboard.press('?')
  const sheet = page.getByRole('dialog', { name: 'Keyboard shortcuts' })
  await expect(sheet).toBeVisible()
  await expect(sheet).toContainText('Previous preset')
  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
})

test('a knob can be found and turned with the keyboard alone', async ({ page }) => {
  const cutoff = page.getByRole('slider', { name: 'Cutoff' })
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab')
    if (await cutoff.evaluate((el) => el === document.activeElement)) break
  }
  await expect(cutoff).toBeFocused()
  const before = Number(await cutoff.getAttribute('aria-valuenow'))
  await page.keyboard.press('PageUp')
  await expect(cutoff).toHaveAttribute('aria-valuenow', String(before + 1))
})
