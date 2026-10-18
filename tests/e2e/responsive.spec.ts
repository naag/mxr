import { expect, test } from '@playwright/test'

// PLAN §7.2 scenario 12: phones get the layer toggle, swipeable visual tabs and no sideways scroll.
test.describe('phone layout', () => {
  test.skip(({ isMobile }) => !isMobile, 'phone layout only')

  test.beforeEach(async ({ page }) => {
    await page.goto('./')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('the layer toggle reaches the VOICE layer by touch', async ({ page }) => {
    await page.getByRole('button', { name: /^Voice layer/ }).tap()
    await expect(page.getByRole('slider', { name: 'Glide' })).toBeVisible()
  })

  test('visual tabs follow swipes and taps', async ({ page }) => {
    const tabs = page.getByTestId('viz-tabs')
    const strip = page.getByTestId('viz-strip')
    await expect(tabs.getByRole('button', { name: 'Wave' })).toHaveAttribute('aria-pressed', 'true')
    await tabs.getByRole('button', { name: 'Envelope' }).tap()
    // The envelope panel slides in from the right and fills the strip's width.
    await expect
      .poll(async () => (await page.locator('[data-viz="envelope"]').boundingBox())!.x)
      .toBeLessThan(20)
    // Swipe back by scrolling the strip one page left.
    await strip.evaluate((el) => el.scrollTo({ left: 0 }))
    await expect(tabs.getByRole('button', { name: 'Wave' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('the source bar stays on screen and nothing scrolls sideways', async ({ page }) => {
    await expect(page.getByTestId('source-bar')).toBeInViewport()
    for (const hash of ['#/', '#/flow', '#/learn/5', '#/presets', '#/reference', '#/about']) {
      await page.goto(`./${hash}`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, hash).toBeLessThanOrEqual(0)
    }
  })

  test('knobs are big enough to touch (≥ 44 px)', async ({ page }) => {
    for (const name of ['Mix', 'Cutoff', 'Mod']) {
      const box = await page.getByRole('slider', { name, exact: true }).boundingBox()
      expect(box!.width).toBeGreaterThanOrEqual(44)
    }
    for (const name of [/^Voice:/, /^Shape:/, /^Presets:/]) {
      const box = await page.getByRole('button', { name }).boundingBox()
      expect(box!.width).toBeGreaterThanOrEqual(44)
    }
  })
})
