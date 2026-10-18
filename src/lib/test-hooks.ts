/**
 * `window.__MXR_TEST__` for Playwright. Only bundled in test builds (`vite build --mode test`,
 * which sets VITE_TEST_HOOKS=true); production builds never include it.
 */
import { spectralCentroid, rms } from './audio/dsp/analysis'
import { renderOffline, type NoteEvent } from './audio/render'
import { clock, type PresetParamId } from './pedal/params'
import { FACTORY_PRESETS, initialGlobals, initialLivePatch } from './pedal/presets'
import { audio, pedal } from './state.svelte'

export function install() {
  Object.assign(window, {
    __MXR_TEST__: {
      status: () => audio.status,
      contextState: () => audio.engine.ctx?.state ?? null,
      levels: () => audio.engine.levels(),
      telemetry: () => audio.telemetry,
      pedalState: () => pedal.state,
      /** The patch you hear (expression pedal applied). */
      sound: () => pedal.sound,
      /** Deterministic render of a preset (0 = live) with clock-position overrides. */
      render(preset: number, overrides: Partial<Record<PresetParamId, number>> = {}) {
        const base = preset === 0 ? initialLivePatch() : FACTORY_PRESETS[preset - 1]
        const values = { ...base.values }
        for (const [id, hour] of Object.entries(overrides))
          values[id as PresetParamId] = clock(hour)
        const notes: NoteEvent[] = [{ at: 0.01, midi: 33, length: 0.5 }]
        const r = renderOffline(
          { patch: { ...base, values }, globals: initialGlobals(), engaged: true, frozen: false },
          notes,
          0.6,
          48000,
        )
        const body = r.filter.subarray(4800, 26400)
        return { centroid: spectralCentroid(body, 48000), rms: rms(r.left) }
      },
    },
  })
}
