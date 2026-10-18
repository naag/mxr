import { expect, test, type Page } from '@playwright/test'

// Touch on phones: dragging a knob turns it instead of scrolling the page.
test.skip(({ isMobile, browserName }) => !isMobile || browserName !== 'chromium', 'touch, Chromium')

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

/** A real touch drag through the browser's input pipeline (so it can scroll the page). */
async function touchDrag(page: Page, x: number, y: number, dy: number, steps = 10) {
  const cdp = await page.context().newCDPSession(page)
  const point = (yy: number) => [{ x, y: yy, id: 1 }]
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(y) })
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: point(y + (dy * i) / steps),
    })
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
}

async function center(page: Page, name: string) {
  const box = (await page.getByRole('slider', { name, exact: true }).boundingBox())!
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

test('dragging a knob up turns it and does not scroll the page', async ({ page }) => {
  // Start a little down the page so a scroll in either direction would show.
  await page.evaluate(() => window.scrollTo(0, 120))
  const before = await page.evaluate(() => window.scrollY)
  const cutoff = page.getByRole('slider', { name: 'Cutoff' })
  const value = Number(await cutoff.getAttribute('aria-valuenow'))
  const c = await center(page, 'Cutoff')
  await touchDrag(page, c.x, c.y, -80)
  await expect
    .poll(async () => Number(await cutoff.getAttribute('aria-valuenow')))
    .toBeGreaterThan(value + 2)
  expect(await page.evaluate(() => window.scrollY)).toBe(before)
})

test('dragging a knob down turns it down without scrolling', async ({ page }) => {
  await page.evaluate(() => window.scrollTo(0, 120))
  const before = await page.evaluate(() => window.scrollY)
  const mix = page.getByRole('slider', { name: 'Mix', exact: true })
  const value = Number(await mix.getAttribute('aria-valuenow'))
  const c = await center(page, 'Mix')
  await touchDrag(page, c.x, c.y, 60)
  await expect
    .poll(async () => Number(await mix.getAttribute('aria-valuenow')))
    .toBeLessThan(value - 2)
  expect(await page.evaluate(() => window.scrollY)).toBe(before)
})

test('the page still scrolls when the drag starts outside the knobs', async ({ page }) => {
  const caption = (await page.getByTestId('control-caption').boundingBox())!
  await touchDrag(page, caption.x + 20, caption.y + 20, -200)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(50)
})

test('a double tap resets a knob', async ({ page }) => {
  const cutoff = page.getByRole('slider', { name: 'Cutoff' })
  const value = await cutoff.getAttribute('aria-valuenow')
  const c = await center(page, 'Cutoff')
  await touchDrag(page, c.x, c.y, -80)
  await expect(cutoff).not.toHaveAttribute('aria-valuenow', value!)
  await page.touchscreen.tap(c.x, c.y)
  await page.touchscreen.tap(c.x, c.y)
  await expect(cutoff).toHaveAttribute('aria-valuenow', value!)
})

test('a finger sliding off a held button does not scroll the page', async ({ page }) => {
  await page.evaluate(() => window.scrollTo(0, 120))
  const before = await page.evaluate(() => window.scrollY)
  const box = (await page.getByRole('button', { name: /^Footswitch/ }).boundingBox())!
  await touchDrag(page, box.x + box.width / 2, box.y + box.height / 2, -120)
  expect(await page.evaluate(() => window.scrollY)).toBe(before)
})
