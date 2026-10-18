import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const views = [
  { hash: '#/', nav: 'Play', heading: 'Turn a knob, hear and see what it does' },
  { hash: '#/flow', nav: 'Under the hood', heading: 'Follow the signal' },
  { hash: '#/learn/0', nav: 'Learn', heading: 'What this pedal does' },
  { hash: '#/presets', nav: 'Presets', heading: 'The eight factory sounds' },
  { hash: '#/reference', nav: 'Reference', heading: 'Every control on the pedal' },
]

test('loads without console errors @smoke', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))

  await page.goto('./')
  await expect(page).toHaveTitle('Bass Synth Explorer')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(views[0].heading)
  expect(errors).toEqual([])
})

test('navigates between views with the header @smoke', async ({ page }) => {
  await page.goto('./')
  const nav = page.getByRole('navigation', { name: 'Main' })
  for (const view of views) {
    await nav.getByRole('link', { name: view.nav }).click()
    await expect(page).toHaveURL(new RegExp(`${view.hash.replace('/', '\\/')}$`))
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(view.heading)
    await expect(nav.getByRole('link', { name: view.nav })).toHaveAttribute('aria-current', 'page')
  }
})

test('deep links open the right view', async ({ page }) => {
  await page.goto('./#/learn/6')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Resonance')
  await expect(page.getByText('Chapter 6 · Resonance')).toBeVisible()
})

test('has no horizontal scroll', async ({ page }) => {
  await page.goto('./')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

for (const view of views) {
  test(`${view.nav} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(`./${view.hash}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })
}
