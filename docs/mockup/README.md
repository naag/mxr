# Mockup snapshot

Source of the look-and-feel mockup, published as a private Claude artifact:
<https://claude.ai/artifact/VLFJfYPHoXTgFQucm1bFJD>

These files are a snapshot from 2026-10-18 for reference during implementation. The
artifact is the live version and may have changed since. They use the artifact's
"Design Component" format (`<x-dc>` markup plus a `DCLogic` class), so they don't run
on their own. Read them for layout, colors, SVG geometry and copy.

| File | Board |
|---|---|
| `Pedal.dc.html` | The interactive pedal. **Phase 1 reference:** enclosure and knob coordinates (viewBox `-34 -10 804 1350`), gradients, scalloped knob outline, LED states, VOICE/SHAPE hold layers, preset data |
| `Main.dc.html` | Play view, desktop |
| `Mobile.dc.html` | Play view, phone (compact pedal) |
| `Flow.dc.html` | Under the hood: signal flow with per-stage waveforms |
| `Learn.dc.html` | Learn chapter 5 (the filter) with a live knob, spectrum and goal checks |
| `Style.dc.html` | Design language: color, type, components |

The charts are computed with the same 4-pole ladder response the app will use:
`H(s) = (1 + k) / ((1 + s/ωc)^4 + k)`, sawtooth harmonics at 1/n.
