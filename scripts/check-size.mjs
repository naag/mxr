// Performance budget (docs/PLAN.md §5.6): the JavaScript the first page load needs must stay
// under 200 KB gzipped. Reads the built dist/index.html, follows its entry script and module
// preloads, and gzips each file. Run after `npm run build`.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const BUDGET_KB = 200
const dist = new URL('../dist/', import.meta.url).pathname
const html = readFileSync(join(dist, 'index.html'), 'utf8')
const files = [
  ...html.matchAll(/<(?:script[^>]+src|link[^>]+rel="modulepreload"[^>]+href)="([^"]+\.js)"/g),
].map((m) => m[1].replace(/^(\.\/|\/mxr\/|\/)/, ''))

if (files.length === 0) {
  console.error('No entry scripts found in dist/index.html')
  process.exit(1)
}

let total = 0
for (const f of new Set(files)) {
  const kb = gzipSync(readFileSync(join(dist, f))).length / 1024
  total += kb
  console.log(`${kb.toFixed(1).padStart(7)} KB  ${f}`)
}
console.log(`${total.toFixed(1).padStart(7)} KB  initial JS (gzip), budget ${BUDGET_KB} KB`)
if (total > BUDGET_KB) {
  console.error('Over budget: lazy-load more (PLAN §5.6).')
  process.exit(1)
}
