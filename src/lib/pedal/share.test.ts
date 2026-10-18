import { describe, expect, it } from 'vitest'
import { FACTORY_PRESETS, patchesEqual } from './presets'
import { decodePatch, encodePatch, patchFromHash, shareUrl } from './share'

describe('patch codes', () => {
  it('round-trip every factory preset', () => {
    for (const p of FACTORY_PRESETS) {
      const back = decodePatch(encodePatch(p))
      expect(back).not.toBeNull()
      expect(patchesEqual(back!, p)).toBe(true)
    }
  })

  it('carry the expression toe state (version 2)', () => {
    const army = FACTORY_PRESETS[5]
    const code = encodePatch(army)
    expect(code).toMatch(/^2\..*\.1_80\.4_70$/)
    expect(patchesEqual(decodePatch(code)!, army)).toBe(true)
    for (const bad of [
      `${code}.1_10`,
      code.replace('.4_70', '.4_101'),
      code.replace('.4_70', '.99_5'),
      code.replace('.4_70', '.4_5_1'),
      code.replace(/\.1_80\.4_70$/, ''),
    ]) {
      expect(decodePatch(bad)).toBeNull()
    }
  })

  it('reject malformed codes', () => {
    const good = encodePatch(FACTORY_PRESETS[0])
    for (const bad of [
      '',
      'x',
      good.replace(/^1\./, '2.'),
      `${good}.5`,
      good.replace(/\.\d+$/, '.101'),
      good.replace(/^1\.\d/, '1.9'),
    ]) {
      expect(decodePatch(bad)).toBeNull()
    }
  })
})

describe('share links', () => {
  it('build and read back a link', () => {
    const url = shareUrl(FACTORY_PRESETS[4], {
      origin: 'https://naag.github.io',
      pathname: '/mxr/',
    })
    expect(url).toMatch(/^https:\/\/naag\.github\.io\/mxr\/#\/\?p=1\.0\.0\./)
    const patch = patchFromHash(new URL(url).hash)
    expect(patchesEqual(patch!, FACTORY_PRESETS[4])).toBe(true)
  })

  it('ignore hashes without a patch', () => {
    expect(patchFromHash('#/learn/3')).toBeNull()
    expect(patchFromHash('#/?x=1')).toBeNull()
  })
})
