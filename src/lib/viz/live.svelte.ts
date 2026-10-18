/** Whether the visuals show the live sound or the computed preview. */
import { audio } from '../state.svelte'

export function isLive(): boolean {
  return audio.status === 'running' && (audio.playing || (audio.telemetry?.note ?? null) !== null)
}
