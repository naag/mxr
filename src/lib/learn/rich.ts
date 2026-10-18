/**
 * Tiny markup for Learn and glossary copy: `[[term]]` or `[[term|words]]` links a glossary
 * entry. Everything else is plain text.
 */
export type RichPart = { text: string } | { text: string; term: string }

export function parseRich(source: string): RichPart[] {
  const parts: RichPart[] = []
  const re = /\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g
  let last = 0
  for (const m of source.matchAll(re)) {
    if (m.index > last) parts.push({ text: source.slice(last, m.index) })
    parts.push({ text: m[2] ?? m[1].replace(/-/g, ' '), term: m[1] })
    last = m.index + m[0].length
  }
  if (last < source.length) parts.push({ text: source.slice(last) })
  return parts
}

/** The text without markup (for screen-reader labels and length checks). */
export const plainText = (source: string) =>
  parseRich(source)
    .map((p) => p.text)
    .join('')
