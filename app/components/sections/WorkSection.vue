<script setup lang="ts">
import gsap from 'gsap'
import { ArrowUpRight } from '@lucide/vue'
import { projects } from '~/data/site'

/**
 * Selected work — the horizontal scroll section.
 *
 * HOW HORIZONTAL SCROLL ACTUALLY WORKS
 * The page never scrolls sideways. Instead:
 *   1. `pin: true` sticks the section to the viewport, so it stops moving while
 *      the rest of the document keeps scrolling underneath.
 *   2. During that pinned window we translate a wide track on the X axis.
 *   3. `end: () => '+=' + distance` makes the pin last exactly as long as the
 *      track needs to travel, so the horizontal movement is 1:1 with the wheel.
 *
 * `invalidateOnRefresh: true` is the line people forget. Without it the travel
 * distance is measured once at page load and never again — resize the window,
 * or let a font load late, and the last card ends up half off screen forever.
 *
 * RESPONSIVE
 * Horizontal scroll on a phone is genuinely bad: it fights the browser's own
 * gestures and there is no room for a wide card. `gsap.matchMedia` runs the
 * pinning only above 768px and cleanly reverts it below, where the cards fall
 * back to a normal vertical stack.
 */

const root = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const reduced = useReducedMotion()

const featured = computed(() => projects.filter((p) => p.featured))

/** Held at module scope of the component so we can revert it on unmount. */
let mm: gsap.MatchMedia | undefined

useGsapContext(root, () => {
  mm = gsap.matchMedia()

  // -------------------------------------------------- desktop: horizontal ---
  mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
    if (!track.value || !root.value) return

    // How far the track must travel: its full width minus one screen.
    const getDistance = () => (track.value?.scrollWidth ?? 0) - window.innerWidth

    const tween = gsap.to(track.value, {
      x: () => -getDistance(),
      ease: 'none',
      scrollTrigger: {
        trigger: root.value,
        start: 'top top',
        end: () => `+=${getDistance()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true, // re-measure on resize — see note above
        anticipatePin: 1, // avoids a one-frame jump when the pin engages
      },
    })

    // Cards lift and brighten as they reach the centre of the screen.
    // `containerAnimation` is the key: it tells ScrollTrigger that these
    // elements move because of `tween`, not because the page scrolled, so
    // "when is this card in view" is computed against the horizontal motion.
    gsap.utils.toArray<HTMLElement>('.work-card').forEach((card) => {
      gsap.from(card, {
        y: 60,
        opacity: 0,
        duration: 1,
        scrollTrigger: {
          trigger: card,
          containerAnimation: tween,
          start: 'left 90%',
          toggleActions: 'play none none reverse',
        },
      })
    })

    // The section title parallaxes slowly against the cards.
    gsap.to('.work-heading', {
      x: -80,
      ease: 'none',
      scrollTrigger: {
        trigger: root.value,
        start: 'top top',
        end: () => `+=${getDistance()}`,
        scrub: 1,
      },
    })
  })

  // ------------------------------------------------------ mobile: vertical ---
  mm.add('(max-width: 767px)', () => {
    gsap.from('.work-card', {
      y: 50,
      opacity: 0,
      duration: 0.9,
      stagger: 0.12,
      scrollTrigger: { trigger: '.work-track', start: 'top 80%' },
    })
  })
})

// matchMedia registers window listeners of its own, so it needs its own revert.
onUnmounted(() => mm?.revert())
</script>

<template>
  <section
    id="work"
    ref="root"
    class="relative md:h-screen md:overflow-hidden"
    :class="reduced ? '' : ''"
  >
    <!-- Heading sits above the track and stays put while the cards slide by. -->
    <div class="mx-auto max-w-350 px-5 pt-24 sm:px-8 lg:px-12 md:pt-28">
      <div class="work-heading">
        <SectionHeading
          index="03"
          label="Selected work"
          title="Things I built"
          accent="and what they taught me."
        />
      </div>

      <p class="text-muted-foreground mt-8 hidden items-center gap-3 font-mono text-[11px] tracking-[0.2em] uppercase md:flex">
        <span class="bg-brand h-px w-10" />
        Scroll to move sideways
      </p>
    </div>

    <!--
      THE TRACK.
      `w-max` lets it grow as wide as its cards need. On mobile it becomes a
      normal vertical flex column.
    -->
    <div
      ref="track"
      class="work-track mt-12 flex flex-col gap-6 px-5 sm:px-8 md:mt-16 md:w-max md:flex-row md:items-stretch md:gap-8 md:px-[max(3rem,calc((100vw-1400px)/2+3rem))]"
    >
      <article
        v-for="(project, i) in featured"
        :key="project.slug"
        class="work-card md:w-[min(78vw,30rem)] md:shrink-0"
      >
        <TiltCard :max="6" :lift="20" radius="rounded-3xl" class="h-full">
          <NuxtLink
            :to="`/work/${project.slug}`"
            class="group border-border/70 bg-card/40 relative flex h-full flex-col overflow-hidden rounded-3xl border backdrop-blur-sm transition-colors duration-500 hover:border-transparent"
            :data-cursor-label="`View ${project.title}`"
          >
            <!-- Per-project gradient, revealed on hover. Giving each project its
                 own colour is what stops the row looking like a spreadsheet. -->
            <div
              class="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
              :style="{
                background: `linear-gradient(150deg, ${project.accent[0]}22, ${project.accent[1]}0a 55%, transparent)`,
              }"
              aria-hidden="true"
            />

            <!-- Visual panel -->
            <div class="relative aspect-16/10 overflow-hidden">
              <div
                class="absolute inset-0 transition-transform duration-[1.2s] group-hover:scale-105"
                :style="{
                  background: `radial-gradient(circle at 30% 25%, ${project.accent[0]}, transparent 55%),
                               radial-gradient(circle at 75% 70%, ${project.accent[1]}, transparent 55%),
                               var(--card)`,
                }"
                style="transition-timing-function: var(--ease-out-expo)"
              />
              <div class="bg-grid absolute inset-0 opacity-30" />

              <!-- Index + status -->
              <div class="absolute inset-x-0 top-0 flex items-start justify-between p-5">
                <span class="font-mono text-[11px] tracking-[0.25em] text-white/70">
                  {{ String(i + 1).padStart(2, '0') }}
                </span>
                <Badge :variant="project.status === 'building' ? 'brand' : 'tech'" class="backdrop-blur-md">
                  {{ project.status === 'building' ? 'In progress' : project.year }}
                </Badge>
              </div>

              <!-- Hover arrow -->
              <div
                class="glass absolute right-5 bottom-5 flex size-11 translate-y-3 items-center justify-center rounded-full opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                aria-hidden="true"
              >
                <ArrowUpRight class="size-4" />
              </div>
            </div>

            <!-- Text panel -->
            <div class="relative flex flex-1 flex-col p-6 sm:p-7">
              <h3 class="font-serif text-2xl tracking-tight sm:text-3xl">
                {{ project.title }}
              </h3>
              <p class="text-muted-foreground mt-2 text-sm leading-relaxed">
                {{ project.tagline }}
              </p>

              <!-- mt-auto pushes the stack to the bottom so every card's chips
                   line up regardless of how long the tagline is. -->
              <ul class="mt-auto flex flex-wrap gap-1.5 pt-6">
                <li v-for="tech in project.stack.slice(0, 4)" :key="tech">
                  <Badge variant="tech">{{ tech }}</Badge>
                </li>
                <li v-if="project.stack.length > 4">
                  <Badge variant="tech">+{{ project.stack.length - 4 }}</Badge>
                </li>
              </ul>
            </div>
          </NuxtLink>
        </TiltCard>
      </article>

      <!-- Closing panel: a call to action at the end of the horizontal run, so
           the section resolves rather than just stopping. -->
      <article class="work-card flex md:w-96 md:shrink-0">
        <NuxtLink
          to="/work"
          class="group border-border/70 hover:border-brand/50 flex w-full flex-col items-start justify-end rounded-3xl border border-dashed p-8 transition-colors"
          data-cursor-label="All work"
        >
          <span class="text-brand mb-4 font-mono text-[11px] tracking-[0.25em] uppercase">
            Archive
          </span>
          <span class="font-serif text-3xl leading-tight tracking-tight">
            See everything,<br >including the experiments.
          </span>
          <span class="text-muted-foreground group-hover:text-brand mt-6 inline-flex items-center gap-2 text-sm transition-colors">
            Browse all projects
            <ArrowUpRight class="size-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </span>
        </NuxtLink>
      </article>
    </div>
  </section>
</template>
