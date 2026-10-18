/** Parses `[[term]]` and `[[term|words]]` glossary links in chapter copy. */
export type RichPart = { text: string; term?: string }

export function parseRich(s: string): RichPart[] {
  const parts: RichPart[] = []
  const re = /\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g
  let at = 0
  for (const m of s.matchAll(re)) {
    if (m.index > at) parts.push({ text: s.slice(at, m.index) })
    parts.push({ text: m[2] ?? m[1], term: m[1] })
    at = m.index + m[0].length
  }
  if (at < s.length) parts.push({ text: s.slice(at) })
  return parts
}

/** The plain text, with link markup removed. */
export const plainText = (s: string) =>
  parseRich(s)
    .map((p) => p.text)
    .join('')
