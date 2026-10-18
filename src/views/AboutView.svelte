<script lang="ts">
  import { about, views } from '../lib/content/site'
</script>

<article class="flex max-w-3xl flex-col gap-6">
  <header class="flex flex-col gap-1.5">
    <span class="text-xs font-semibold tracking-[0.12em] text-stage-osc uppercase"
      >{views.about.kicker}</span
    >
    <h1 class="m-0 text-2xl leading-tight font-[650] tracking-tight">{views.about.title}</h1>
    <p class="m-0 text-[15px] leading-normal text-[#b7c0c9]">{views.about.lede}</p>
  </header>
  {#each about.sections as section (section.title)}
    <section class="flex flex-col gap-2">
      <h2 class="m-0 text-lg font-semibold">{section.title}</h2>
      {#each section.body as para, i (i)}
        <p class="m-0 text-[15px] leading-relaxed text-[#c9d1d9]">{para}</p>
      {/each}
    </section>
  {/each}
  <section class="flex flex-col gap-2">
    <h2 class="m-0 text-lg font-semibold">{about.linksTitle}</h2>
    <ul class="m-0 flex flex-col gap-1.5 pl-5">
      {#each about.links as link (link.href)}
        <li>
          <a href={link.href} rel="noopener" class="text-stage-filter underline underline-offset-2"
            >{link.label}</a
          >
        </li>
      {/each}
    </ul>
  </section>
  <p class="m-0 text-xs text-subtle">{about.credits}</p>
</article>
