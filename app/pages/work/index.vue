<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import { projects } from '~/data/site'

/**
 * /work — the full archive, with client-side filtering.
 *
 * The filter is a plain `computed`. There is no store, no query library and no
 * fetch: the data is already in the bundle, so filtering is a synchronous array
 * operation that re-renders instantly. Reaching for state management here would
 * be pure ceremony.
 */

useSeoMeta({
  title: 'Work',
  description: 'Every project — client work, tools, and the experiments in between.',
})

/**
 * Build the filter list from the data rather than hard-coding it, so adding a
 * tag in data/site.ts automatically adds a button here.
 * `Set` removes duplicates; spreading it back gives a normal array.
 */
const allTags = computed(() => {
  const tags = new Set<string>()
  projects.forEach((p) => p.tags.forEach((t) => tags.add(t)))
  return ['All', ...Array.from(tags).sort()]
})

const activeTag = ref('All')

const filtered = computed(() =>
  activeTag.value === 'All'
    ? projects
    : projects.filter((p) => p.tags.includes(activeTag.value)),
)
</script>

<template>
  <div class="pt-28 pb-24 sm:pt-32">
    <div class="mx-auto max-w-350 px-5 sm:px-8 lg:px-12">
      <SectionHeading
        index="Archive"
        label="All work"
        title="Everything,"
        accent="including the mistakes."
        description="Client projects, personal tools and experiments that never shipped. The failures taught more."
      />

      <!-- --------------------------------------------------------- filters -->
      <div
        class="mt-12 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter projects by category"
      >
        <button
          v-for="tag in allTags"
          :key="tag"
          type="button"
          class="rounded-full border px-4 py-2 text-sm transition-all duration-300"
          :class="
            activeTag === tag
              ? 'border-brand bg-brand text-[oklch(0.16_0.01_65)] font-medium'
              : 'border-border text-muted-foreground hover:border-brand/50 hover:text-foreground'
          "
          :aria-pressed="activeTag === tag"
          @click="activeTag = tag"
        >
          {{ tag }}
          <span v-if="tag !== 'All'" class="ml-1.5 font-mono text-[10px] opacity-60">
            {{ projects.filter((p) => p.tags.includes(tag)).length }}
          </span>
        </button>
      </div>

      <!-- ----------------------------------------------------------- grid -->
      <!--
        TransitionGroup animates items as they enter, leave and MOVE.
        The `move-class` is the magic one: when filtering removes a card, the
        remaining cards slide to their new positions instead of teleporting.
        Vue does this with the FLIP technique — it measures the before and after
        positions and animates the difference with a transform.

        `:key` must be stable and unique (the slug), or Vue cannot tell which
        card moved where.
      -->
      <TransitionGroup
        tag="div"
        class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        enter-active-class="transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        leave-active-class="transition-all duration-300 absolute"
        enter-from-class="opacity-0 scale-95 translate-y-4"
        leave-to-class="opacity-0 scale-95"
        move-class="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
      >
        <article v-for="project in filtered" :key="project.slug">
          <TiltCard :max="5" :lift="14" radius="rounded-2xl" class="h-full">
            <NuxtLink
              :to="`/work/${project.slug}`"
              class="group border-border/70 hover:border-brand/40 flex h-full flex-col overflow-hidden rounded-2xl border transition-colors"
              :data-cursor-label="project.title"
            >
              <div class="relative aspect-16/10 overflow-hidden">
                <div
                  class="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                  :style="{
                    background: `radial-gradient(circle at 30% 25%, ${project.accent[0]}, transparent 55%),
                                 radial-gradient(circle at 75% 70%, ${project.accent[1]}, transparent 55%),
                                 var(--card)`,
                  }"
                />
                <div class="bg-grid absolute inset-0 opacity-30" />
                <Badge
                  variant="tech"
                  class="absolute top-4 right-4 backdrop-blur-md"
                >
                  {{ project.year }}
                </Badge>
              </div>

              <div class="flex flex-1 flex-col p-5">
                <h2 class="font-serif text-xl tracking-tight">{{ project.title }}</h2>
                <p class="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {{ project.tagline }}
                </p>

                <div class="mt-auto flex items-end justify-between gap-4 pt-5">
                  <ul class="flex flex-wrap gap-1.5">
                    <li v-for="tech in project.stack.slice(0, 3)" :key="tech">
                      <Badge variant="tech">{{ tech }}</Badge>
                    </li>
                  </ul>
                  <ArrowUpRight
                    class="text-muted-foreground group-hover:text-brand size-4 shrink-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </div>
              </div>
            </NuxtLink>
          </TiltCard>
        </article>
      </TransitionGroup>

      <!-- Empty state. Unlikely with this data, but a grid that silently shows
           nothing is one of the most common unfinished edges in a portfolio. -->
      <p v-if="!filtered.length" class="text-muted-foreground py-20 text-center">
        Nothing tagged “{{ activeTag }}” yet.
      </p>
    </div>
  </div>
</template>
