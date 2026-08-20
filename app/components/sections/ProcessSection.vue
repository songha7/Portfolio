<script setup lang="ts">
import gsap from 'gsap'

/**
 * How I work — the site's third axis: DEPTH.
 *
 * The cards do not scroll past each other; they stack towards the viewer.
 * Each card is `position: sticky`, so it holds at the top of the viewport while
 * the next one scrolls up to meet it. GSAP then scales, dims and tips each card
 * backwards as it gets buried.
 *
 * WHY `sticky` AND NOT MORE PINNING
 * We already pin the Work section. Pinning several sections in a row means
 * several ScrollTriggers all inserting spacer elements, and they compound
 * measurement errors. Native `position: sticky` costs nothing, never needs
 * re-measuring, and survives a resize on its own. Reach for CSS first; use
 * ScrollTrigger for the parts CSS genuinely cannot do — here, the scaling.
 *
 * The `rotateX` is what sells it as depth rather than as a scale animation: the
 * card tips away from you, so its top edge recedes.
 */

const root = ref<HTMLElement | null>(null)
const reduced = useReducedMotion()

const steps = [
  {
    n: '01',
    title: 'Understand',
    body: 'Before a single component exists, I want to know who breaks without this and what they do today instead. Most bad software is a correct answer to the wrong question.',
    detail: 'Discovery · Constraints · Success criteria',
  },
  {
    n: '02',
    title: 'Shape',
    body: 'Wireframes in code, not in a design tool. A rough page in the browser tells you more in an hour about rhythm and density than a week of static mockups.',
    detail: 'Prototype · Type scale · Motion language',
  },
  {
    n: '03',
    title: 'Build',
    body: 'Typed end to end, componentised, accessible from the first commit rather than audited at the end. Server-render what can be, hydrate what must be.',
    detail: 'Nuxt · TypeScript · Tests where they earn their keep',
  },
  {
    n: '04',
    title: 'Refine',
    body: 'The last 10% is the part people feel: easing curves, empty states, the loading skeleton nobody was asked to design. This is where a project stops looking like a template.',
    detail: 'Performance · Polish · Handover notes',
  },
]

useGsapContext(root, () => {
  if (reduced.value) return

  gsap.utils.toArray<HTMLElement>('.process-card').forEach((card, i) => {
    // The last card has nothing stacking on top of it, so it never recedes.
    if (i === steps.length - 1) return

    gsap.to(card, {
      scale: 0.9,
      rotateX: 6,
      opacity: 0.35,
      filter: 'blur(2px)',
      ease: 'none',
      scrollTrigger: {
        trigger: card,
        // Begin receding once the card is stuck at the top …
        start: 'top 12%',
        // … and finish by the time the next card has fully covered it.
        end: '+=90%',
        scrub: true,
      },
    })
  })
})
</script>

<template>
  <section ref="root" class="relative py-28 sm:py-36">
    <div class="mx-auto max-w-350 px-5 sm:px-8 lg:px-12">
      <SectionHeading
        index="04"
        label="Process"
        title="Four steps,"
        accent="repeated stubbornly."
        description="Nothing exotic. The value is in doing all four every time, including the last one."
      />

      <!-- `perspective` on the parent is what makes rotateX read as depth
           instead of as a vertical squash. -->
      <div class="perspective-2000 mt-16 lg:mt-24">
        <div
          v-for="(step, i) in steps"
          :key="step.n"
          class="process-card sticky origin-top will-change-transform"
          :style="{
            // Each card stops slightly lower than the one before, so the stack
            // fans out and you can still see the edges underneath.
            top: `${5 + i * 1.2}rem`,
            // Stacking order must ascend or later cards render behind earlier ones.
            zIndex: i + 1,
            marginBottom: i === steps.length - 1 ? '0' : '2rem',
          }"
        >
          <div
            class="glass border-border/70 relative overflow-hidden rounded-3xl border p-8 sm:p-12 lg:p-16"
            style="background-color: color-mix(in oklch, var(--card) 88%, transparent)"
          >
            <!-- A gold hairline along the top edge of each card. -->
            <div
              class="absolute inset-x-0 top-0 h-px"
              style="background: linear-gradient(90deg, transparent, var(--brand), transparent)"
              aria-hidden="true"
            />

            <div class="grid gap-8 lg:grid-cols-12 lg:gap-16">
              <div class="lg:col-span-4">
                <span class="text-brand/80 font-mono text-sm tracking-[0.3em]">{{ step.n }}</span>
                <!-- Mobile-first metrics — see the note in HeroSection.vue. -->
                <h3 class="mt-4 font-serif text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.12] tracking-normal sm:leading-none sm:tracking-tight">
                  {{ step.title }}
                </h3>
              </div>

              <div class="lg:col-span-8">
                <p class="text-[clamp(1rem,1.8vw,1.35rem)] leading-relaxed">
                  {{ step.body }}
                </p>
                <p class="text-muted-foreground border-border/60 mt-8 border-t pt-4 font-mono text-[11px] tracking-[0.18em] uppercase">
                  {{ step.detail }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
