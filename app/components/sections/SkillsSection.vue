<script setup lang="ts">
import gsap from 'gsap'
import { marqueeRows, skillGroups } from '~/data/site'

/**
 * Skills — and the site's first change of axis.
 *
 * THE SKEWED BAND
 * Three marquee rows sit inside a container rotated -4°, running in alternating
 * directions. Rotating the whole band means the text travels along a diagonal
 * while the page still scrolls vertically, which breaks the grid without
 * anything actually being crooked.
 *
 * Two details make it work rather than look like a mistake:
 *   • The band is wider than the viewport (`w-[120%] -ml-[10%]`). Rotating a
 *     100%-wide element leaves triangular gaps at the corners.
 *   • `overflow-x: clip` on the body (set in main.css) stops the overhang from
 *     creating a horizontal scrollbar.
 *
 * VELOCITY SKEW
 * The band also skews slightly in response to how fast you are scrolling, then
 * springs back when you stop. It is the single most effective way to make a
 * page feel physical — the content appears to have inertia.
 */

const root = ref<HTMLElement | null>(null)
const band = ref<HTMLElement | null>(null)
const reduced = useReducedMotion()
const { lenis } = useSmoothScroll()

useGsapContext(root, () => {
  // Skill bars fill as they scroll into view.
  gsap.from('.skill-bar-fill', {
    scaleX: 0,
    duration: 1.4,
    ease: 'power3.out',
    stagger: 0.06,
    scrollTrigger: { trigger: '.skill-grid', start: 'top 80%' },
  })

  if (reduced.value || !band.value) return

  // The whole band drifts sideways as you scroll past it — a second, slower
  // motion layered on top of the marquee's own movement.
  gsap.to('.skill-band-inner', {
    xPercent: -6,
    ease: 'none',
    scrollTrigger: {
      trigger: band.value,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
    },
  })
})

/* ----------------------------------------------------- scroll-velocity skew */
onMounted(() => {
  if (reduced.value) return
  const instance = lenis()
  if (!instance || !band.value) return

  // quickTo again: this fires on every scroll event, so it must be cheap.
  const setSkew = gsap.quickTo(band.value, 'skewY', {
    duration: 0.6,
    ease: 'power3.out',
  })

  const onScroll = ({ velocity }: { velocity: number }) => {
    // Clamp it. Without a limit, a fast flick on a trackpad produces a 40°
    // shear that looks broken rather than fast.
    const skew = gsap.utils.clamp(-4, 4, velocity * 0.12)
    setSkew(skew)
  }

  instance.on('scroll', onScroll)
  onUnmounted(() => instance.off('scroll', onScroll))
})
</script>

<template>
  <section id="skills" ref="root" class="relative overflow-hidden py-28 sm:py-36">
    <div class="mx-auto max-w-350 px-5 sm:px-8 lg:px-12">
      <SectionHeading
        index="02"
        label="Capabilities"
        title="The tools, and"
        accent="what I do with them."
        description="A stack I actually reach for, not a list of everything I have ever opened."
      />
    </div>

    <!-- --------------------------------------------------- the skewed band -->
    <div
      ref="band"
      class="border-border/60 relative my-20 w-[120%] ml-[-10%] border-y py-8 will-change-transform sm:my-24"
      style="transform: rotate(-4deg)"
      aria-hidden="true"
    >
      <!-- A gold wash behind the rows ties the band to the palette. -->
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.07]"
        style="background: linear-gradient(90deg, transparent, var(--brand), transparent)"
      />

      <div class="skill-band-inner space-y-3">
        <!-- Alternating direction per row. Two rows moving the same way read as
             one thick block; opposing directions create the weave. -->
        <MarqueeRow
          v-for="(row, i) in marqueeRows"
          :key="i"
          :items="row"
          :reverse="i % 2 === 1"
          :duration="34 + i * 9"
          :class="i === 1 ? 'text-muted-foreground' : ''"
        />
      </div>
    </div>

    <!-- Screen readers get a plain list instead of the decorative band. -->
    <h3 class="sr-only">Technologies</h3>
    <ul class="sr-only">
      <li v-for="item in marqueeRows.flat()" :key="item">{{ item }}</li>
    </ul>

    <!-- ------------------------------------------------------ skill groups -->
    <div class="mx-auto max-w-350 px-5 sm:px-8 lg:px-12">
      <div class="skill-grid grid gap-x-12 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="group in skillGroups" :key="group.title">
          <RevealOnScroll direction="up">
            <h3 class="font-serif text-2xl tracking-tight">{{ group.title }}</h3>
            <p class="text-muted-foreground mt-2 mb-7 text-sm leading-relaxed">
              {{ group.summary }}
            </p>
          </RevealOnScroll>

          <ul class="space-y-5">
            <li v-for="skill in group.items" :key="skill.name">
              <div class="mb-2 flex items-baseline justify-between gap-4">
                <span class="text-sm">{{ skill.name }}</span>
                <span class="text-muted-foreground font-mono text-[10px]">
                  {{ skill.level }}
                </span>
              </div>

              <!-- A plain div rather than the shadcn <Progress>, because we want
                   the fill to animate from a GSAP timeline rather than from a
                   reactive value. `role="meter"` keeps it accessible. -->
              <div
                class="bg-border/70 h-px w-full overflow-hidden"
                role="meter"
                :aria-valuenow="skill.level"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="skill.name"
              >
                <div
                  class="skill-bar-fill bg-brand h-full origin-left"
                  :style="{ transform: `scaleX(${skill.level / 100})` }"
                />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
