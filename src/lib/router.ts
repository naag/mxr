export type RouteName = 'play' | 'flow' | 'learn' | 'presets' | 'reference'

export interface Route {
  name: RouteName
  /** Learn chapter, 0–13. Only set for the `learn` route. */
  chapter?: number
  /** Glossary entry to show. Only set for the `reference` route (`#/reference/cutoff`). */
  term?: string
}

export const LAST_CHAPTER = 13

const simple: Record<string, RouteName> = {
  '': 'play',
  flow: 'flow',
  presets: 'presets',
  reference: 'reference',
}

/** Parses `location.hash` (e.g. `#/learn/5`) into a route. Unknown paths fall back to Play. */
export function parseHash(hash: string): Route {
  const path = hash.split('?')[0].replace(/^#\/?/, '').replace(/\/+$/, '')
  const [head = '', arg] = path.split('/')

  if (head === 'learn') {
    const n = Number(arg)
    const chapter = Number.isInteger(n) && n >= 0 && n <= LAST_CHAPTER ? n : 0
    return { name: 'learn', chapter }
  }
  if (head === 'reference' && arg && /^[a-z0-9-]+$/.test(arg)) {
    return { name: 'reference', term: arg }
  }
  return { name: simple[head] ?? 'play' }
}

export function hrefFor(route: Route): string {
  switch (route.name) {
    case 'play':
      return '#/'
    case 'learn':
      return `#/learn/${route.chapter ?? 0}`
    case 'reference':
      return route.term ? `#/reference/${route.term}` : '#/reference'
    default:
      return `#/${route.name}`
  }
}
