import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await page.evaluate(() => localStorage.clear())
})

// E2E scenario 10 (PLAN §7.2).
test('chapter 5 detects CUTOFF below 9 o’clock and enables Next @smoke', async ({ page }) => {
  await page.goto('./#/learn/5')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The filter: carving the sound')
  await expect(page.getByRole('button', { name: 'Next: Resonance' })).toBeDisabled()
  const steps = page.getByTestId('goal-steps').getByRole('listitem')
  await expect(steps.nth(0)).toHaveAttribute('data-done', 'true')
  await expect(steps.nth(1)).toHaveAttribute('data-done', 'false')

  const cutoff = page.getByRole('slider', { name: 'Cutoff', exact: true })
  await cutoff.focus()
  await page.keyboard.press('Home')
  await expect(steps.nth(1)).toHaveAttribute('data-done', 'true')
  const next = page.getByRole('link', { name: 'Next: Resonance' })
  await expect(next).toBeVisible()

  // Progress is remembered.
  await page.reload()
  await expect(page.getByTestId('learn-progress')).toHaveText('1 of 14 chapters done')
  await page.getByRole('link', { name: 'Next: Resonance' }).click()
  await expect(page).toHaveURL(/#\/learn\/6$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Resonance: the singing peak')
})

test('dims the controls a chapter does not use, which still work', async ({ page }) => {
  await page.goto('./#/learn/5')
  await expect(page.locator('[data-control="cutoff"]')).toHaveAttribute('data-dimmed', 'false')
  await expect(page.locator('[data-control="mix"]')).toHaveAttribute('data-dimmed', 'true')
  const mix = page.getByRole('slider', { name: 'Mix', exact: true })
  const before = await mix.getAttribute('aria-valuenow')
  await mix.focus()
  await page.keyboard.press('ArrowDown')
  await expect(mix).not.toHaveAttribute('aria-valuenow', before!)
})

test('chapter 0: footswitch off and on finishes it', async ({ page }) => {
  await page.goto('./#/learn/0')
  await expect(page.getByTestId('mini-flow')).toHaveAttribute('data-engaged', 'true')
  const foot = page.getByRole('button', { name: /^Footswitch/ })
  await foot.focus()
  await page.keyboard.press('Space')
  await expect(page.getByTestId('mini-flow')).toHaveAttribute('data-engaged', 'false')
  await page.keyboard.press('Space')
  await expect(page.getByRole('link', { name: /^Next:/ })).toBeVisible()
})

test('setting up a chapter loads its starting sound', async ({ page }) => {
  await page.goto('./#/learn/2')
  await page.getByRole('button', { name: 'Set up the sound for this chapter' }).click()
  await expect(page.getByRole('button', { name: /^Shape: triangle/ })).toBeVisible()
  await expect(page.getByTestId('goal-steps').getByRole('listitem').first()).toHaveAttribute(
    'data-done',
    'true',
  )
})

test('the additive demo builds a wave step by step', async ({ page }) => {
  await page.goto('./#/learn/2')
  const demo = page.getByTestId('additive-demo')
  await expect(demo).toContainText('a pure sine wave')
  await demo.getByRole('slider', { name: 'Harmonics' }).fill('8')
  await expect(demo).toContainText('8 harmonics added')
})

test('glossary links lead to the reference', async ({ page }) => {
  await page.goto('./#/learn/5')
  await page.getByRole('link', { name: 'low-pass filter' }).click()
  await expect(page).toHaveURL(/#\/reference\/low-pass-filter$/)
  await expect(page.locator('[data-term="low-pass-filter"]')).toHaveAttribute(
    'data-current',
    'true',
  )
})

for (let chapter = 0; chapter <= 13; chapter++) {
  test(`chapter ${chapter} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(`./#/learn/${chapter}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator(`[data-chapter="${chapter}"]`)).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })
}
