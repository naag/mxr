<script lang="ts">
  import { aboutLink, disclaimer, siteCopy } from '../../content/site'

  let { onshortcuts }: { onshortcuts?: () => void } = $props()
</script>

<footer class="mx-auto max-w-[1440px] px-4 pt-4 pb-8 text-xs leading-relaxed text-subtle sm:px-7">
  {disclaimer}
  <a href="#/about" class="text-muted underline underline-offset-2 hover:text-text">{aboutLink}</a>
  ·
  <button
    type="button"
    onclick={onshortcuts}
    class="cursor-pointer text-muted underline underline-offset-2 hover:text-text"
    >{siteCopy.shortcuts}</button
  >
</footer>
