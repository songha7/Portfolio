<script setup lang="ts">
// Note: lucide dropped its brand icons (GitHub, Twitter, …) over trademark
// concerns, so there is no `Github` export any more. `CodeXml` reads clearly
// enough for a "view the source" link.
import { ArrowLeft, ArrowRight, CodeXml, ExternalLink, FileText, Play } from '@lucide/vue'
import type { Component } from 'vue'
import { projects } from '~/data/site'

/**
 * /work/[slug] — the project case study.
 *
 * The square brackets in the filename make this a DYNAMIC route: one file
 * serves /work/roomie, /work/sakura and every other slug. `useRoute().params`
 * tells you which one was asked for.
 */

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const project = computed(() => projects.find((p) => p.slug === slug.value))

/**
 * A slug that does not exist must return a real 404, not an empty page.
 * `createError` with `fatal: true` renders error.vue AND sends the correct
 * status code — which matters, because a soft 404 that returns 200 gets
 * indexed by search engines as a real page.
 */
if (!project.value) {
  throw createError({
    statusCode: 404,
    statusMessage: `No project called “${slug.value}”.`,
    fatal: true,
  })
}

/** Previous / next, wrapping around the ends so navigation never dead-ends. */
const index = computed(() => projects.findIndex((p) => p.slug === slug.value))
const nextProject = computed(() => projects[(index.value + 1) % projects.length]!)
const prevProject = computed(
  () => projects[(index.value - 1 + projects.length) % projects.length]!,
)

useSeoMeta({
  title: () => project.value?.title ?? 'Work',
  description: () => project.value?.tagline ?? '',
  ogTitle: () => `${project.value?.title} — ${project.value?.tagline}`,
  ogDescription: () => project.value?.description ?? '',
})

/** Maps the `icon` string in the data to an actual component. */
const linkIcons: Record<string, Component> = {
  github: CodeXml,
  external: ExternalLink,
  video: Play,
  docs: FileText,
}
</script>

<template>
  <div v-if="project" class="pb-24">
    <!-- ------------------------------------------------------------- hero -->
    <header class="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-20">
      <!-- The project's own gradient, used as an atmospheric wash. Each case
           study gets a different temperature this way. -->
      <div
        class="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
        :style="{
          background: `radial-gradient(ellipse 70% 60% at 70% 0%, ${project.accent[0]}55, transparent 60%),
                       radial-gradient(ellipse 50% 50% at 20% 20%, ${project.accent[1]}33, transparent 60%)`,
        }"
      />
      <div class="bg-grid mask-radial-fade absolute inset-0 opacity-40" aria-hidden="true" />

      <div class="relative mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <NuxtLink
          to="/work"
          class="text-muted-foreground hover:text-brand group mb-10 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase transition-colors"
        >
          <ArrowLeft class="size-3.5 transition-transform group-hover:-translate-x-1" />
          All work
        </NuxtLink>

        <div class="flex flex-wrap items-center gap-3">
          <Badge variant="brand">{{ project.year }}</Badge>
          <Badge v-for="tag in project.tags" :key="tag" variant="tech">{{ tag }}</Badge>
        </div>

        <!-- Mobile-first metrics — see the note on the h1 in HeroSection.vue. -->
        <h1 class="mt-6 font-serif text-[clamp(2.5rem,8vw,6.5rem)] leading-[1.04] tracking-[-0.01em] sm:leading-[0.9] sm:tracking-[-0.03em]">
          {{ project.title }}
        </h1>

        <p class="text-muted-foreground mt-6 max-w-2xl text-[clamp(1.05rem,2vw,1.5rem)] leading-snug">
          {{ project.tagline }}
        </p>

        <!-- Links. A project can be private with no href, so we render a
             disabled-looking span instead of a broken link. -->
        <div class="mt-10 flex flex-wrap gap-3">
          <template v-for="link in project.links" :key="link.label">
            <Button
              v-if="link.href"
              variant="hairline"
              size="pill"
              as="a"
              :href="link.href"
              :target="link.href.startsWith('http') ? '_blank' : undefined"
              rel="noopener noreferrer"
            >
              <component :is="linkIcons[link.icon ?? 'external']" class="size-4" />
              {{ link.label }}
            </Button>
            <span
              v-else
              class="border-border/60 text-muted-foreground inline-flex h-12 items-center gap-2 rounded-full border border-dashed px-7 text-sm"
            >
              <component :is="linkIcons[link.icon ?? 'external']" class="size-4" />
              {{ link.label }}
            </span>
          </template>
        </div>
      </div>
    </header>

    <!-- ------------------------------------------------------- key figures -->
    <section
      v-if="project.metrics?.length"
      class="border-border/60 border-y"
    >
      <dl class="mx-auto grid max-w-[1400px] grid-cols-2 divide-x divide-border/60 px-5 sm:grid-cols-3 sm:px-8 lg:px-12">
        <div v-for="metric in project.metrics" :key="metric.label" class="px-6 py-8 first:pl-0">
          <dt class="text-muted-foreground font-mono text-[10px] tracking-[0.2em] uppercase">
            {{ metric.label }}
          </dt>
          <dd class="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">
            {{ metric.value }}
          </dd>
        </div>
      </dl>
    </section>

    <!-- ------------------------------------------------------------ body -->
    <div class="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12">
      <div class="grid gap-16 lg:grid-cols-12 lg:gap-20">
        <!-- Sticky meta rail. `top-28` clears the fixed header. -->
        <aside class="lg:col-span-4">
          <div class="lg:sticky lg:top-28">
            <RevealOnScroll :stagger="0.08" class="space-y-8">
              <div>
                <h2 class="text-muted-foreground font-mono text-[10px] tracking-[0.25em] uppercase">
                  Role
                </h2>
                <p class="mt-2">{{ project.role }}</p>
              </div>

              <div>
                <h2 class="text-muted-foreground font-mono text-[10px] tracking-[0.25em] uppercase">
                  Stack
                </h2>
                <ul class="mt-3 flex flex-wrap gap-1.5">
                  <li v-for="tech in project.stack" :key="tech">
                    <Badge variant="tech">{{ tech }}</Badge>
                  </li>
                </ul>
              </div>

              <div>
                <h2 class="text-muted-foreground font-mono text-[10px] tracking-[0.25em] uppercase">
                  Status
                </h2>
                <p class="mt-2 capitalize">{{ project.status }}</p>
              </div>
            </RevealOnScroll>
          </div>
        </aside>

        <!-- Main copy -->
        <div class="lg:col-span-8">
          <RevealOnScroll>
            <p class="text-[clamp(1.1rem,2vw,1.5rem)] leading-[1.6]">
              {{ project.description }}
            </p>
          </RevealOnScroll>

          <h2 class="mt-16 font-serif text-3xl tracking-tight">The interesting parts</h2>

          <RevealOnScroll :stagger="0.1" class="mt-8 space-y-6">
            <div
              v-for="(highlight, i) in project.highlights"
              :key="i"
              class="border-border/60 flex gap-5 border-b pb-6 last:border-0"
            >
              <span class="text-brand/70 shrink-0 font-mono text-xs">
                {{ String(i + 1).padStart(2, '0') }}
              </span>
              <p class="leading-relaxed">{{ highlight }}</p>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </div>

    <!-- ------------------------------------------------------ prev / next -->
    <nav
      class="border-border/60 mx-auto grid max-w-[1400px] gap-px border-t px-5 sm:px-8 md:grid-cols-2 lg:px-12"
      aria-label="Project navigation"
    >
      <NuxtLink
        :to="`/work/${prevProject.slug}`"
        class="group hover:bg-accent/40 flex flex-col gap-2 py-10 transition-colors md:pr-8"
      >
        <span class="text-muted-foreground inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] uppercase">
          <ArrowLeft class="size-3 transition-transform group-hover:-translate-x-1" />
          Previous
        </span>
        <span class="group-hover:text-brand font-serif text-2xl tracking-tight transition-colors sm:text-3xl">
          {{ prevProject.title }}
        </span>
      </NuxtLink>

      <NuxtLink
        :to="`/work/${nextProject.slug}`"
        class="group hover:bg-accent/40 border-border/60 flex flex-col items-start gap-2 border-t py-10 transition-colors md:items-end md:border-t-0 md:border-l md:pl-8"
      >
        <span class="text-muted-foreground inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] uppercase">
          Next
          <ArrowRight class="size-3 transition-transform group-hover:translate-x-1" />
        </span>
        <span class="group-hover:text-brand font-serif text-2xl tracking-tight transition-colors sm:text-3xl">
          {{ nextProject.title }}
        </span>
      </NuxtLink>
    </nav>
  </div>
</template>
