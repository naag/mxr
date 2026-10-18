import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await page.evaluate(() => localStorage.clear())
  await page.goto('./#/presets')
})

test('the gallery explains each preset and loads it', async ({ page }) => {
  const gallery = page.getByTestId('preset-gallery')
  await expect(gallery.getByRole('listitem').filter({ has: page.locator('h2') })).toHaveCount(8)
  const sledge = page.getByRole('listitem', { name: 'Sledge' })
  await expect(sledge).toContainText('Why it sounds like this')
  await expect(sledge.getByRole('link', { name: /COMP 3 o’clock/ })).toHaveAttribute(
    'href',
    '#/learn/11',
  )
  await sledge.getByRole('button', { name: 'Load R1 Sledge' }).click()
  await expect(sledge).toHaveAttribute('data-current', 'true')
  await page.getByRole('link', { name: 'Play', exact: true }).click()
  await expect(page.getByTestId('preset-name')).toHaveText('Sledge')
})

test('a card plays its riff with the preset', async ({ page }) => {
  const card = page.getByRole('listitem', { name: 'Wonderful' })
  await card.getByRole('button', { name: 'Load and play Funk Drop' }).click()
  await expect(card.getByRole('button', { name: 'Stop' })).toBeVisible()
  await expect(card).toHaveAttribute('data-current', 'true')
  await card.getByRole('button', { name: 'Stop' }).click()
  await expect(card.getByRole('button', { name: 'Load and play Funk Drop' })).toBeVisible()
})
