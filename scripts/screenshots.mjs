// Generates the README screenshots, the Open Graph image and the touch icon (PLAN Phase 9).
// Needs a running preview of a production build:
//   npm run build && npm run preview -- --port 4173 &
//   node scripts/screenshots.mjs [baseURL]
// Set PW_CHROMIUM_PATH to use an existing Chromium (see CLAUDE.md).
import { mkdirSync, readFileSync } from 'node:fs'
import { chromium, devices } from '@playwright/test'

const base = process.argv[2] ?? 'http://localhost:4173/'
const root = new URL('../', import.meta.url).pathname
const shots = `${root}docs/screenshots`
mkdirSync(shots, { recursive: true })

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined })

async function open(options, hash = '') {
  const page = await browser.newPage(options)
  await page.goto(base + hash)
  await page.evaluate(() => localStorage.clear())
  await page.goto(base + hash)
  await page.evaluate(() => document.fonts.ready)
  return page
}
const settle = async (page) => {
  await page.evaluate(() => document.activeElement?.blur?.())
  await page.waitForTimeout(800)
}

// Desktop Play view on a preset with a strong filter shape, detailed visuals.
const desktop = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
let page = await open(desktop)
await page.getByRole('button', { name: 'Detailed' }).click()
for (let i = 0; i < 3; i++) await page.keyboard.press('p')
await settle(page)
await page.screenshot({ path: `${shots}/play.png` })

// Open Graph card: the same view, cropped to 1200 × 630.
await page.setViewportSize({ width: 1200, height: 630 })
await page.getByRole('button', { name: 'Simple' }).click()
await settle(page)
await page.screenshot({ path: `${root}public/og-image.png` })
await page.close()

for (const [name, hash] of [
  ['flow', '#/flow'],
  ['learn', '#/learn/5'],
  ['presets', '#/presets'],
]) {
  page = await open(desktop, hash)
  await settle(page)
  await page.screenshot({ path: `${shots}/${name}.png` })
  await page.close()
}

page = await open({ ...devices['Pixel 7'], deviceScaleFactor: 1.5 })
await settle(page)
await page.screenshot({ path: `${shots}/mobile.png` })
await page.close()

// 180 × 180 touch icon from the SVG favicon.
page = await browser.newPage({ viewport: { width: 180, height: 180 } })
const svg = readFileSync(`${root}public/favicon.svg`, 'utf8')
await page.setContent(
  `<body style="margin:0;background:#151A20">${svg.replace('<svg ', '<svg width="180" height="180" ')}</body>`,
)
await page.screenshot({ path: `${root}public/apple-touch-icon.png` })
await browser.close()
console.log('Wrote docs/screenshots/*.png, public/og-image.png, public/apple-touch-icon.png')
