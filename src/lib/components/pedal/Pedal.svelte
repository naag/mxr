<script lang="ts">
  import { jackInfo, layerColors, shapeNames, stageColors } from '../../content/controls'
  import {
    BYPASS_LED,
    ENCLOSURE,
    FOOTSWITCH,
    JACKS,
    KNOBS,
    PRESET_BUTTON,
    PRESET_LEDS,
    SHAPE_BUTTON,
    SHAPE_LEDS,
    VIEWBOX,
    VOICE_BUTTON,
    type KnobId,
  } from '../../pedal/layout'
  import { describe, stepIndex } from '../../pedal/params'
  import type { ControlId, PedalStore } from '../../pedal/pedal.svelte'
  import { makeDefIds, url } from './defs'
  import Footswitch from './Footswitch.svelte'
  import Jack from './Jack.svelte'
  import Knob from './Knob.svelte'
  import Led from './Led.svelte'
  import PedalDefs from './PedalDefs.svelte'
  import PushButton from './PushButton.svelte'

  let {
    pedal,
    highlight = [],
    focus = [],
  }: {
    pedal: PedalStore
    /** Knobs to light up (linked highlighting from the visuals). */
    highlight?: readonly KnobId[]
    /** Learn mode: these controls are in focus; the rest dim but stay usable. */
    focus?: readonly ControlId[]
  } = $props()

  const uid = $props.id()
  const ids = makeDefIds(uid)
  const vb = `${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.width} ${VIEWBOX.height}`
  const E = ENCLOSURE

  const dim = (id: ControlId) => (focus.length > 0 && !focus.includes(id) ? 0.35 : 1)

  function active(id: ControlId) {
    return (on: boolean) => {
      if (on) pedal.focused = id
      else if (pedal.focused === id) pedal.focused = null
    }
  }

  const s = $derived(pedal.state)
  const layer = $derived(pedal.layer)
  const led = $derived(pedal.leds)
  const knobs = $derived(
    KNOBS.map((k) => {
      const p = pedal.paramFor(k.id)
      const value = pedal.knobValue(k.id)
      return { ...k, p, value }
    }),
  )

  /** Small legends around SHAPE-layer controls, like the manual's diagram. */
  const legends = $derived(
    layer !== 'shape'
      ? []
      : knobs.flatMap((k) => {
          const words = k.p.steps ?? k.p.legends
          if (!words) return []
          const current = k.p.steps
            ? stepIndex(k.p, k.value)
            : k.value <= 0.02
              ? 0
              : k.value >= 0.98
                ? 1
                : -1
          const spots =
            words.length === 3
              ? [
                  [k.x - 88, k.y + 88],
                  [k.x, k.y - 94],
                  [k.x + 88, k.y + 88],
                ]
              : [
                  [k.x - 88, k.y + 88],
                  [k.x + 88, k.y + 88],
                ]
          return words.map((text, i) => ({
            key: `${k.id}-${i}`,
            text,
            x: spots[i][0],
            y: spots[i][1],
            on: i === current,
          }))
        }),
  )

  const silk = 'font-family: var(--font-sans); font-weight: 700; font-stretch: 85%;'
  const presetName = $derived(
    pedal.preset.info ? `preset ${pedal.preset.info.code} ${pedal.preset.info.name}` : 'live mode',
  )
</script>

<svg
  viewBox={vb}
  class="block h-auto w-full select-none"
  role="group"
  aria-label="MXR Bass Synth pedal"
  data-layer={layer}
>
  <PedalDefs {ids} />

  <!-- Enclosure -->
  <g aria-hidden="true">
    <rect
      x={E.x + 14}
      y={E.y + 26}
      width={E.width}
      height={E.height}
      rx={E.radius}
      fill="#000"
      opacity="0.6"
      filter={url(ids.blur14)}
    />
  </g>
  <Jack side="left" y={JACKS.out.y} info={jackInfo.out} {ids} />
  <Jack side="left" y={JACKS.ctr.y} info={jackInfo.ctr} {ids} />
  <Jack side="right" y={JACKS.in.y} info={jackInfo.in} {ids} />
  <g aria-hidden="true">
    <rect x={E.x} y={E.y} width={E.width} height={E.height} rx={E.radius} fill={url(ids.body)} />
    <rect
      x={E.x}
      y={E.y}
      width={E.width}
      height={E.height}
      rx={E.radius}
      fill="#000"
      filter={url(ids.grain)}
    />
    <rect x={E.x} y={E.y} width={E.width} height={E.height} rx={E.radius} fill={url(ids.spot)} />
    <rect
      x={E.x + 3}
      y={E.y + 3}
      width={E.width - 6}
      height={E.height - 6}
      rx={E.radius - 3}
      fill="none"
      stroke="#fff"
      stroke-opacity="0.08"
      stroke-width="2"
    />
    <rect
      x={E.x}
      y={E.y}
      width={E.width}
      height={E.height}
      rx={E.radius}
      fill="none"
      stroke="#141618"
      stroke-width="3"
    />
  </g>

  <!-- Screen print -->
  <g aria-hidden="true" fill="var(--color-silk)" style={silk} text-anchor="middle">
    <text x="172" y="104" font-size="19" letter-spacing="0.6">VOICE</text>
    <path
      d="M412 68 V47 H502 M588 47 H680 V68"
      fill="none"
      stroke="var(--color-silk)"
      stroke-width="3"
    />
    <text x="545" y="54" font-size="17" letter-spacing="0.6">SHAPE</text>
    <g
      fill="none"
      stroke="var(--color-silk)"
      stroke-width="2.6"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M535 114 L546 99 L557 114" />
      <path d="M587 114 L606 99 L606 114" />
      <path d="M631 114 L636 114 L636 99 L650 99 L650 114 L655 114" />
    </g>
    <text x="62" y="627" transform="rotate(-90 62 627)" font-size="21" letter-spacing="0.6"
      >OUT</text
    >
    <text x="674" y="627" transform="rotate(90 674 627)" font-size="21" letter-spacing="0.6"
      >IN</text
    >
    <rect
      x="240"
      y="594"
      width="240"
      height="88"
      rx="20"
      fill="none"
      stroke="var(--color-silk)"
      stroke-width="6"
    />
    <text x="362" y="664" font-size="68" letter-spacing="4" style="font-stretch: 100%">MXR</text>
    <text x="492" y="692" font-size="12" font-weight="400">®</text>
    <text x="360" y="716" font-size="18" letter-spacing="0.3" style="font-stretch: 100%"
      ><tspan font-weight="700">BASS</tspan><tspan font-weight="400">INNOVATIONS</tspan></text
    >
    <text
      x="367"
      y="1150"
      font-size="96"
      letter-spacing="1"
      style="font-family: var(--font-wordmark); font-weight: 300">bass synth</text
    >
    <path
      d="M208 1226 V1244 H284 M380 1244 H456 V1226"
      fill="none"
      stroke="var(--color-silk)"
      stroke-width="2.6"
    />
    <text x="332" y="1250" font-size="14" letter-spacing="0.6">PRESETS</text>
    <polygon points="514,1195 514,1215 530,1205" />
  </g>

  <!-- Knob legends: change with the active layer -->
  <g
    aria-hidden="true"
    style={silk}
    text-anchor="middle"
    fill={layerColors[layer]}
    data-layer={layer}
    class="legends"
  >
    {#each knobs as k (k.id)}
      <text x={k.x} y={k.labelY} font-size="23" letter-spacing="0.6">{k.p.label}</text>
    {/each}
    {#each legends as l (l.key)}
      <text x={l.x} y={l.y} font-size="13" letter-spacing="0.5" fill-opacity={l.on ? 1 : 0.45}
        >{l.text}</text
      >
    {/each}
  </g>

  <!-- Buttons and LEDs -->
  <g opacity={dim('voice')} data-control="voice" data-dimmed={dim('voice') < 1}>
    <PushButton
      {...VOICE_BUTTON}
      name="Voice: harmony voices {s.current.voiceOn ? 'on' : 'off'}"
      pressed={s.current.voiceOn}
      tint={layer === 'voice' ? 'var(--color-layer-voice)' : null}
      {ids}
      ondown={() => pedal.down('voice')}
      onup={() => pedal.up('voice')}
      onactive={active('voice')}
    />
  </g>
  <g opacity={dim('shape')} data-control="shape" data-dimmed={dim('shape') < 1}>
    <PushButton
      {...SHAPE_BUTTON}
      name="Shape: {shapeNames[s.current.shape].toLowerCase()}"
      tint={layer === 'shape' ? 'var(--color-layer-shape)' : null}
      {ids}
      ondown={() => pedal.down('shape')}
      onup={() => pedal.up('shape')}
      onactive={active('shape')}
    />
  </g>
  <Led
    name="shape-triangle"
    x={SHAPE_LEDS.triangle}
    y={SHAPE_LEDS.y}
    color="green"
    state={s.current.shape === 'triangle' ? 'on' : 'off'}
    {ids}
  />
  <Led
    name="shape-saw"
    x={SHAPE_LEDS.saw}
    y={SHAPE_LEDS.y}
    color="amber"
    state={s.current.shape === 'saw' ? 'on' : 'off'}
    {ids}
  />
  <Led
    name="shape-square"
    x={SHAPE_LEDS.square}
    y={SHAPE_LEDS.y}
    color="red"
    state={s.current.shape === 'square' ? 'on' : 'off'}
    {ids}
  />

  {#each knobs as k (k.id)}
    <g opacity={dim(k.id)} data-control={k.id} data-dimmed={dim(k.id) < 1}>
      <Knob
        x={k.x}
        y={k.y}
        color={k.color}
        name={k.p.name}
        value={k.value}
        valueText={describe(k.p.id, k.value)}
        steps={k.p.steps?.length}
        ringColor={stageColors[k.p.stage]}
        highlighted={highlight.includes(k.id) || (focus.includes(k.id) && dim(k.id) === 1)}
        {ids}
        onchange={(v) => pedal.turn(k.id, v)}
        onreset={() => pedal.resetKnob(k.id)}
        onactive={active(k.id)}
      />
    </g>
  {/each}

  <Led
    name="bypass"
    x={BYPASS_LED.x}
    y={BYPASS_LED.y}
    r={15}
    color="blue"
    state={led.bypass}
    {ids}
  />
  <g opacity={dim('footswitch')} data-control="footswitch" data-dimmed={dim('footswitch') < 1}>
    <Footswitch
      {...FOOTSWITCH}
      engaged={s.engaged}
      {ids}
      ondown={() => pedal.down('foot')}
      onup={() => pedal.up('foot')}
      onactive={active('footswitch')}
    />
  </g>

  {#each PRESET_LEDS.xs as x, i (x)}
    <Led
      name="preset-{i + 1}"
      {x}
      y={PRESET_LEDS.y}
      r={10}
      unlit="frost"
      color={led.presetColor}
      state={led.presets[i]}
      {ids}
    />
  {/each}
  <g opacity={dim('presets')} data-control="presets" data-dimmed={dim('presets') < 1}>
    <PushButton
      {...PRESET_BUTTON}
      r={14}
      look="preset"
      name="Presets: {presetName}. Tap for the next preset, hold to copy or save"
      {ids}
      ondown={() => pedal.down('presets')}
      onup={() => pedal.up('presets')}
      onactive={active('presets')}
    />
  </g>
</svg>

<style>
  [data-control] {
    transition: opacity 0.2s ease;
  }
  .legends text {
    transition: fill 0.2s ease;
  }
</style>
