<script lang="ts">
  import { controls, jackInfo, shapeNames, stageColors } from '../../content/controls'
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
  } from '../../pedal/layout'
  import type { ControlId, PedalState } from '../../pedal/pedal.svelte'
  import { makeDefIds, url } from './defs'
  import Footswitch from './Footswitch.svelte'
  import Jack from './Jack.svelte'
  import Knob from './Knob.svelte'
  import Led from './Led.svelte'
  import PedalDefs from './PedalDefs.svelte'
  import PushButton from './PushButton.svelte'

  let { pedal }: { pedal: PedalState } = $props()

  const uid = $props.id()
  const ids = makeDefIds(uid)
  const vb = `${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.width} ${VIEWBOX.height}`
  const E = ENCLOSURE

  function active(id: ControlId) {
    return (on: boolean) => {
      if (on) pedal.focused = id
      else if (pedal.focused === id) pedal.focused = null
    }
  }

  const presetBank = $derived(pedal.preset === 0 ? null : pedal.preset <= 4 ? 'green' : 'red')
  const presetSlot = $derived(pedal.preset === 0 ? -1 : (pedal.preset - 1) % 4)
  const silk = 'font-family: var(--font-sans); font-weight: 700; font-stretch: 85%;'
</script>

<svg
  viewBox={vb}
  class="block h-auto w-full select-none"
  role="group"
  aria-label="MXR Bass Synth pedal"
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
    {#each KNOBS as k (k.id)}
      <text x={k.x} y={k.labelY} font-size="23" letter-spacing="0.6">{controls[k.id].label}</text>
    {/each}
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

  <!-- Buttons and LEDs -->
  <PushButton
    {...VOICE_BUTTON}
    name="Voice: {pedal.voiceOn ? 'harmony voices on' : 'harmony voices off'}"
    pressed={pedal.voiceOn}
    {ids}
    onpress={() => pedal.toggleVoice()}
    onactive={active('voice')}
  />
  <PushButton
    {...SHAPE_BUTTON}
    name="Shape: {shapeNames[pedal.shape].split(':')[0].toLowerCase()}"
    {ids}
    onpress={() => pedal.nextShape()}
    onactive={active('shape')}
  />
  <Led
    name="shape-triangle"
    x={SHAPE_LEDS.triangle}
    y={SHAPE_LEDS.y}
    color="green"
    state={pedal.shape === 'triangle' ? 'on' : 'off'}
    {ids}
  />
  <Led
    name="shape-saw"
    x={SHAPE_LEDS.saw}
    y={SHAPE_LEDS.y}
    color="amber"
    state={pedal.shape === 'saw' ? 'on' : 'off'}
    {ids}
  />
  <Led
    name="shape-square"
    x={SHAPE_LEDS.square}
    y={SHAPE_LEDS.y}
    color="red"
    state={pedal.shape === 'square' ? 'on' : 'off'}
    {ids}
  />

  {#each KNOBS as k (k.id)}
    <Knob
      x={k.x}
      y={k.y}
      color={k.color}
      name={controls[k.id].name}
      value={pedal.knobs[k.id]}
      ringColor={stageColors[controls[k.id].stage]}
      {ids}
      onchange={(v) => pedal.setKnob(k.id, v)}
      onreset={() => pedal.resetKnob(k.id)}
      onactive={active(k.id)}
    />
  {/each}

  <Led
    name="bypass"
    x={BYPASS_LED.x}
    y={BYPASS_LED.y}
    r={15}
    color="blue"
    state={pedal.engaged ? 'on' : 'off'}
    {ids}
  />
  <Footswitch
    {...FOOTSWITCH}
    engaged={pedal.engaged}
    {ids}
    onpress={() => pedal.toggleEngaged()}
    onactive={active('footswitch')}
  />

  {#each PRESET_LEDS.xs as x, i (x)}
    <Led
      name="preset-{i + 1}"
      {x}
      y={PRESET_LEDS.y}
      r={10}
      unlit="frost"
      color={presetBank === 'red' ? 'red' : 'green'}
      state={i === presetSlot ? 'on' : 'off'}
      {ids}
    />
  {/each}
  <PushButton
    {...PRESET_BUTTON}
    r={14}
    look="preset"
    name="Presets: {pedal.preset === 0 ? 'live mode' : `preset ${pedal.preset}`}. Next preset"
    {ids}
    onpress={() => pedal.nextPreset()}
    onactive={active('presets')}
  />
</svg>
