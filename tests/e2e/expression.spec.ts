import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('the expression pedal morphs between heel and toe', async ({ page }) => {
  const panel = page.getByTestId('expression')
  await panel.getByRole('checkbox', { name: /Plug in an expression pedal/ }).check()
  const rocker = page.getByRole('slider', { name: 'Expression pedal position' })
  await expect(rocker).toHaveAttribute('aria-valuetext', 'heel down')
  await expect(panel).toContainText('Nothing yet')

  // Set a toe sound: brighter cutoff.
  await panel.getByRole('button', { name: 'Toe', exact: true }).click()
  const cutoff = page.getByRole('slider', { name: 'Cutoff' })
  await cutoff.focus()
  await page.keyboard.press('End')
  await expect(page.getByTestId('expression-morphs').getByRole('listitem')).toHaveAccessibleName(
    'CUTOFF: heel 11 o’clock, toe max',
  )

  // Back to heel: the knob shows the heel value again, and rocking moves the sound.
  await panel.getByRole('button', { name: 'Heel', exact: true }).click()
  await expect(cutoff).toHaveAttribute('aria-valuetext', '11 o’clock, 368 Hz')
  await rocker.focus()
  await page.keyboard.press('End')
  await expect(rocker).toHaveAttribute('aria-valuetext', 'toe down')
  const sound = await page.evaluate(
    () =>
      (
        window as unknown as { __MXR_TEST__: { sound(): { values: { cutoff: number } } } }
      ).__MXR_TEST__.sound().values.cutoff,
  )
  expect(sound).toBe(1)
  await expect(page.locator('[data-morph]')).toHaveCount(1)

  const results = await new AxeBuilder({ page }).include('[data-testid="expression"]').analyze()
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )
  expect(serious.map((v) => v.id)).toEqual([])
})

test('ARMY OF SYNTH comes with a toe sound', async ({ page }) => {
  await page.goto('./#/presets')
  await page.getByRole('button', { name: 'Load R2 Army of Synth' }).click()
  await page.getByRole('link', { name: 'Play', exact: true }).click()
  await page.getByRole('checkbox', { name: /Plug in an expression pedal/ }).check()
  const rows = page.getByTestId('expression-morphs').getByRole('listitem')
  await expect(rows).toHaveCount(2)
  await expect(rows.first()).toHaveAccessibleName('CUTOFF: heel 10 o’clock, toe 3 o’clock')
})
