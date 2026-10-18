import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const steps = (page: Page) => page.getByTestId('steps').locator('li')

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await page.evaluate(() => localStorage.clear())
})

// E2E scenario 10 (PLAN §7.2).
test('chapter 5 checks the CUTOFF goal and unlocks Next @smoke', async ({ page }) => {
  await page.goto('./#/learn/5')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The filter: carving the sound')
  await expect(page.getByRole('button', { name: /^Next: Resonance/ })).toBeDisabled()

  const cutoff = page.getByRole('slider', { name: 'Cutoff', exact: true })
  await cutoff.focus()
  await page.keyboard.press('Home')
  await expect(steps(page).nth(0)).toHaveAttribute('data-done', 'true')
  await expect(steps(page).nth(1)).toHaveAttribute('data-done', 'false')
  await page.keyboard.press('End')
  await expect(steps(page).nth(1)).toHaveAttribute('data-done', 'true')

  await page.getByRole('link', { name: /^Next: Resonance/ }).click()
  await expect(page).toHaveURL(/#\/learn\/6$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Resonance')
  await expect(page.getByTestId('learn-progress')).toHaveText('1 of 14 chapters done')

  await page.reload()
  await expect(page.getByTestId('learn-progress')).toHaveText('1 of 14 chapters done')
  const nav = page.getByRole('navigation', { name: 'Chapters' })
  await expect(nav.getByRole('link', { name: /Chapter done.*The filter/ })).toBeVisible()
})

test('chapter 0 is done after tapping the footswitch on and off', async ({ page }) => {
  await page.goto('./#/learn/0')
  const foot = page.getByRole('button', { name: /^Footswitch/ })
  await foot.click()
  await expect(page.getByTestId('pipeline')).toHaveAttribute('data-engaged', 'false')
  await foot.click()
  await expect(steps(page).nth(1)).toHaveAttribute('data-done', 'true')
  await expect(page.getByRole('link', { name: /^Next: Sound is a wave/ })).toBeVisible()
})

test('dims the controls a chapter doesn’t use', async ({ page }) => {
  await page.goto('./#/learn/5')
  const cutoff = page.getByRole('slider', { name: 'Cutoff', exact: true })
  const mix = page.getByRole('slider', { name: 'Mix', exact: true })
  await expect(cutoff.locator('xpath=..')).toHaveAttribute('data-dimmed', 'false')
  await expect(mix.locator('xpath=..')).toHaveAttribute('data-dimmed', 'true')
})

test('Set up this chapter puts the knobs where the experiment starts', async ({ page }) => {
  await page.goto('./#/learn/5')
  await page.getByRole('button', { name: 'Set up this chapter' }).click()
  await expect(page.getByRole('slider', { name: 'Cutoff', exact: true })).toHaveAttribute(
    'aria-valuetext',
    /^2 o’clock/,
  )
  await expect(page.getByRole('slider', { name: 'Envelope', exact: true })).toHaveAttribute(
    'aria-valuetext',
    /off/,
  )
})

test('glossary words link to the reference', async ({ page }) => {
  await page.goto('./#/learn/5')
  await page.getByRole('article').getByRole('link', { name: 'cutoff', exact: true }).first().click()
  await expect(page).toHaveURL(/#\/reference\/cutoff$/)
  await expect(page.locator('#term-cutoff')).toHaveAttribute('data-current', 'true')
  await expect(page.locator('#term-cutoff')).toBeInViewport()
  await page
    .locator('#term-cutoff')
    .getByRole('link', { name: /Chapter 5/ })
    .click()
  await expect(page).toHaveURL(/#\/learn\/5$/)
})

test('the additive demo builds a wave harmonic by harmonic', async ({ page }) => {
  await page.goto('./#/learn/2')
  const demo = page.getByTestId('additive')
  await expect(demo.getByTestId('additive-count')).toHaveText('1')
  await demo.getByRole('button', { name: 'More harmonics' }).click()
  await demo.getByRole('button', { name: 'More harmonics' }).click()
  await expect(demo.getByTestId('additive-count')).toHaveText('3')
  await expect(demo).toContainText('Sawtooth from 3 sine waves')
  await demo.getByRole('button', { name: 'Square' }).click()
  await expect(demo).toContainText('Square from 2 sine waves')
})

test('the LFO widget appears once MOD is up', async ({ page }) => {
  await page.goto('./#/learn/10')
  const mod = page.getByRole('slider', { name: 'Mod', exact: true })
  await mod.focus()
  await page.keyboard.press('Home')
  await expect(page.getByTestId('lfo-widget')).toContainText('Turn MOD up')
  await page.keyboard.press('End')
  await expect(page.getByTestId('lfo-widget')).toContainText('times a second')
})

for (let n = 0; n <= 13; n++) {
  test(`chapter ${n} has no serious accessibility violations`, async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(browserName !== 'chromium' || isMobile, 'one browser is enough for content scans')
    await page.goto(`./#/learn/${n}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })
}
