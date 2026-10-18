import { expect, test, type Page } from '@playwright/test'

type Levels = Partial<Record<'left' | 'right' | 'dry' | 'osc' | 'filter' | 'amp' | 'fx', number>>

interface Hooks {
  status(): string
  contextState(): string | null
  levels(): Levels
  telemetry(): { note: number | null; playing: boolean } | null
  render(preset: number, overrides?: Record<string, number>): { centroid: number; rms: number }
}

const hooks = <T>(page: Page, fn: (h: Hooks) => T) =>
  page.evaluate((src) => {
    const h = (window as unknown as { __MXR_TEST__: Hooks }).__MXR_TEST__
    return new Function('h', `return (${src})(h)`)(h)
  }, fn.toString()) as Promise<T>

async function startSound(page: Page) {
  await page.getByRole('button', { name: 'Start sound' }).click()
  await expect.poll(() => hooks(page, (h) => h.contextState())).toBe('running')
  await expect(page.getByTestId('output-meter')).toBeVisible()
}

/** Waits until a level reported by the analysers passes `min`. */
async function expectLevel(page: Page, name: keyof Levels, min: number) {
  await expect
    .poll(async () => (await hooks(page, (h) => h.levels()))[name] ?? 0, { timeout: 5000 })
    .toBeGreaterThan(min)
}

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForFunction(() => '__MXR_TEST__' in window)
})

test('Start sound runs the audio engine @smoke', async ({ page }) => {
  await startSound(page)
  await expect(page.getByRole('button', { name: /Sound on/ })).toBeVisible()
})

test('the riff player makes sound and stops', async ({ page }) => {
  await startSound(page)
  await page.getByRole('button', { name: 'Play riff' }).click()
  await expectLevel(page, 'left', 0.01)
  await expectLevel(page, 'amp', 0.01)
  await expect(page.getByTestId('now-playing')).toContainText('Playing')
  await page.getByRole('button', { name: 'Stop riff' }).click()
  await expect
    .poll(async () => (await hooks(page, (h) => h.levels())).amp ?? 1, { timeout: 5000 })
    .toBeLessThan(0.002)
})

test('the fretboard plays the note you press', async ({ page }) => {
  await startSound(page)
  await page.getByRole('button', { name: 'Fretboard', exact: true }).click()
  const fret = page.getByRole('button', { name: 'A string, fret 3: C2' })
  await fret.hover()
  await page.mouse.down()
  await expect(page.getByTestId('now-playing')).toHaveText('Playing C2')
  await expectLevel(page, 'osc', 0.05)
  await page.mouse.up()
})

test('bypass leaves only the clean bass', async ({ page }) => {
  await startSound(page)
  await page.getByRole('button', { name: /^Footswitch/ }).click()
  await page.getByRole('button', { name: 'Play riff' }).click()
  await expectLevel(page, 'left', 0.005)
  await expectLevel(page, 'dry', 0.005)
})

test('the keyboard plays notes when chosen as the source', async ({ page }) => {
  await startSound(page)
  await page.getByRole('button', { name: 'Keyboard', exact: true }).click()
  await page.keyboard.down('Digit1')
  await expect(page.getByTestId('now-playing')).toHaveText('Playing A1')
  await page.keyboard.up('Digit1')
})

test('tempo buttons change the riff tempo', async ({ page }) => {
  await page.getByRole('button', { name: 'Faster' }).click()
  await expect(page.getByTestId('tempo')).toHaveText('100 BPM')
  await page.getByRole('combobox', { name: 'Riff' }).selectOption('long-tones')
  await expect(page.getByTestId('tempo')).toHaveText('80 BPM')
})

test('lowering CUTOFF makes the sound darker (deterministic render)', async ({ page }) => {
  const dark = await page.evaluate(() =>
    (window as unknown as { __MXR_TEST__: Hooks }).__MXR_TEST__.render(0, {
      cutoff: 9,
      envelope: 7,
      resonance: 7,
    }),
  )
  const bright = await page.evaluate(() =>
    (window as unknown as { __MXR_TEST__: Hooks }).__MXR_TEST__.render(0, {
      cutoff: 16,
      envelope: 7,
      resonance: 7,
    }),
  )
  expect(dark.centroid).toBeLessThan(bright.centroid)
  expect(dark.rms).toBeGreaterThan(0)
})
