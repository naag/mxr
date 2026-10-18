import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import AppHeader from './AppHeader.svelte'

describe('AppHeader', () => {
  it('lists every view in the main navigation', async () => {
    const screen = await render(AppHeader, { current: 'play' })
    const nav = screen.getByRole('navigation', { name: 'Main' })
    for (const label of ['Play', 'Under the hood', 'Learn', 'Presets', 'Reference']) {
      await expect.element(nav.getByRole('link', { name: label })).toBeVisible()
    }
  })

  it('marks only the current view', async () => {
    const screen = await render(AppHeader, { current: 'flow' })
    await expect
      .element(screen.getByRole('link', { name: 'Under the hood' }))
      .toHaveAttribute('aria-current', 'page')
    await expect
      .element(screen.getByRole('link', { name: 'Play' }))
      .not.toHaveAttribute('aria-current')
  })
})
