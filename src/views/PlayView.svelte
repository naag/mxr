<script lang="ts">
  import ControlCaption from '../lib/components/pedal/ControlCaption.svelte'
  import Pedal from '../lib/components/pedal/Pedal.svelte'
  import ViewPlaceholder from '../lib/components/ui/ViewPlaceholder.svelte'
  import { views } from '../lib/content/site'
  import { PedalState } from '../lib/pedal/pedal.svelte'

  const pedal = new PedalState()
</script>

<div class="flex flex-wrap items-start gap-8">
  <div
    class="mx-auto flex w-full max-w-[440px] flex-col items-center gap-4 rounded-3xl bg-[radial-gradient(ellipse_70%_55%_at_50%_42%,#1a2128_0%,transparent_72%)] py-2"
  >
    <Pedal {pedal} />
    <ControlCaption {pedal} />
  </div>
  <div class="min-w-0 flex-[999_1_420px]">
    <ViewPlaceholder {...views.play} />
  </div>
</div>
