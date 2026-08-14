<script setup lang="ts">
import gsap from 'gsap'
import { experiences } from '~/data/site'

/**
 * Experience timeline.
 *
 * The vertical rule draws itself as you scroll — a progress bar that happens to
 * be the timeline. Two layers do the work: a static faint track, and a bright
 * gold line on top whose `scaleY` is scrubbed from 0 to 1.
 *
 * Scrubbing `scaleY` rather than `height` matters for the same reason as
 * always: `height` triggers layout on every frame, `transform` does not.
 */

const root = ref<HTMLElement | null>(null)
const reduced = useReducedMotion()

useGsapContext(root, () => {
  if (!reduced.value) {
    gsap.to('.timeline-progress', {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '.timeline-list',
        start: 'top 65%',
        end: 'bottom 75%',
        scrub: 0.5,
      },
    })
  }

  // Each entry slides in from the left as it arrives.
  gsap.from('.timeline-item', {
    x: reduced.value ? 0 : -30,
    opacity: 0,
    duration: 0.9,
    stagger: 0.15,
    scrollTrigger: { trigger: '.timeline-list', start: 'top 75%' },
  })

  // The dots pop slightly after their row, so the eye lands on the text first.
  gsap.from('.timeline-dot', {
    scale: 0,
    duration: 0.6,
    ease: 'back.out(2)',
    stagger: 0.15,
    delay: 0.2,
    scrollTrigger: { trigger: '.timeline-list', start: 'top 75%' },
  })
})
</script>

<template>
  <section ref="root" class="relative py-28 sm:py-36">
    <div class="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
      <SectionHeading
        index="05"
        label="Trajectory"
        title="Where the hours"
        accent="have gone."
      />

      <ol class="timeline-list relative mt-16 lg:mt-24">
        <!-- The static track. `aria-hidden` because the list itself already
             conveys the sequence to a screen reader. -->
        <div
          class="bg-border absolute top-2 bottom-2 left-[7px] w-px sm:left-[calc(9rem+7px)]"
          aria-hidden="true"
        />
        <!-- The drawing progress line, sitting exactly on top of the track. -->
        <div
          class="timeline-progress absolute top-2 bottom-2 left-[7px] w-px origin-top scale-y-0 sm:left-[calc(9rem+7px)]"
          style="background: linear-gradient(to bottom, var(--brand), var(--brand-deep))"
          aria-hidden="true"
        />

        <li
          v-for="job in experiences"
          :key="`${job.period}-${job.role}`"
          class="timeline-item relative flex flex-col gap-2 pb-14 pl-8 last:pb-0 sm:flex-row sm:gap-0 sm:pl-0"
        >
          <!-- Period column (desktop) -->
          <div class="text-muted-foreground shrink-0 font-mono text-[11px] tracking-[0.15em] uppercase sm:w-36 sm:pt-1.5">
            {{ job.period }}
          </div>

          <!-- The dot, centred on the line. -->
          <div
            class="border-background bg-brand absolute top-1.5 left-0 size-[15px] rounded-full border-4 sm:left-[9rem]"
            aria-hidden="true"
          >
            <div class="timeline-dot bg-brand size-full rounded-full" />
          </div>

          <!-- Content -->
          <div class="sm:pl-12">
            <h3 class="font-serif text-2xl tracking-tight sm:text-3xl">
              {{ job.role }}
            </h3>
            <p class="text-brand/90 mt-1 text-sm">{{ job.organisation }}</p>
            <p class="text-muted-foreground mt-4 max-w-2xl leading-relaxed">
              {{ job.description }}
            </p>
            <ul class="mt-5 flex flex-wrap gap-1.5">
              <li v-for="tag in job.tags" :key="tag">
                <Badge variant="tech">{{ tag }}</Badge>
              </li>
            </ul>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>
