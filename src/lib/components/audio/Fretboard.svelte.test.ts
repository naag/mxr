import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-svelte'
import Fretboard from './Fretboard.svelte'

describe('Fretboard', () => {
  it('plays a note while a fret is held and highlights only that position', async () => {
    const onnoteon = vi.fn()
    const onnoteoff = vi.fn()
    const screen = await render(Fretboard, { active: null, onnoteon, onnoteoff })
    const fret = screen.getByRole('button', { name: 'A string, fret 3: C2' })
    await fret.hover()
    await userEvent.click(fret)
    expect(onnoteon).toHaveBeenCalledWith(36)
    expect(onnoteoff).toHaveBeenCalledWith(36)
    await screen.rerender({ active: 36 })
    await expect.element(fret).toHaveAttribute('aria-pressed', 'true')
    await expect
      .element(screen.getByRole('button', { name: 'E string, fret 8: C2' }))
      .toHaveAttribute('aria-pressed', 'false')
  })

  it('highlights the lowest fret for notes from elsewhere', async () => {
    const screen = await render(Fretboard, { active: 36, onnoteon: () => {}, onnoteoff: () => {} })
    await expect
      .element(screen.getByRole('button', { name: 'A string, fret 3: C2' }))
      .toHaveAttribute('aria-pressed', 'true')
  })

  it('is one tab stop; arrow keys move and Enter plays', async () => {
    const onnoteon = vi.fn()
    await render(Fretboard, { active: null, onnoteon, onnoteoff: () => {} })
    await userEvent.tab()
    expect(document.activeElement?.getAttribute('aria-label')).toBe('A string, open: A1')
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowUp}')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('D string, fret 2: E2')
    await userEvent.keyboard('{Enter}')
    expect(onnoteon).toHaveBeenCalledWith(40)
  })
})
