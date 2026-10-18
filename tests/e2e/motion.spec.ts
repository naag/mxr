import { expect, test, type Page } from '@playwright/test'

// PLAN §4.5: with reduced motion there are no particles, springs or flashing LEDs.
test.use({ reducedMotion: 'reduce' })

/** Animations that keep running (CSS keyframes loops); finished transitions don't count. */
const running = (page: Page) =>
  page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity)
        .length,
  )

test('no looping animations on Play and Under the hood', async ({ page }) => {
  await page.goto('./')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  // An edited preset makes its LED flash softly: with reduced motion it stays dim instead.
  await page.keyboard.press('p')
  await page.getByRole('slider', { name: 'Cutoff' }).focus()
  await page.keyboard.press('ArrowUp')
  await expect(page.getByTestId('preset-edited')).toBeVisible()
  expect(await running(page)).toBe(0)
  await page.goto('./#/flow')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await running(page)).toBe(0)
})
