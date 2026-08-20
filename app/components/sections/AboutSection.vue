<script setup lang="ts">
import gsap from 'gsap'
import { profile, socials } from '~/data/site'

/**
 * About.
 *
 * The headline effect here is scroll-driven text illumination: the paragraph
 * starts dim and each word brightens as it passes the middle of the screen.
 *
 * HOW IT WORKS
 * `scrub: true` binds the animation's playhead directly to the scrollbar
 * instead of playing it on a timer. Combined with a `stagger`, the words light
 * up in sequence — the visitor is literally scrubbing through the animation,
 * so reading and scrolling become the same gesture.
 */

const root = ref<HTMLElement | null>(null)
const reduced = useReducedMotion()

/** The three short statements beside the portrait. */
const principles = [
  { title: 'Ship it', body: 'A working thing today beats a perfect thing next quarter.' },
  { title: 'Feel the frame', body: 'If it drops below 60fps, it is a bug, not a trade-off.' },
  { title: 'Leave notes', body: 'Code is read far more often than it is written.' },
]

useGsapContext(root, () => {
  if (reduced.value) return

  // Each word of the bio brightens as it crosses the middle of the viewport.
  gsap.fromTo(
    '.about-bio .split-word',
    { opacity: 0.15 },
    {
      opacity: 1,
      ease: 'none',
      stagger: 0.6, // relative weighting between words, not seconds — scrub scales it
      scrollTrigger: {
        trigger: '.about-bio',
        // Start when the paragraph's top hits 75% down the screen, finish when
        // its bottom reaches the middle. That window is what the scrub maps onto.
        start: 'top 75%',
        end: 'bottom 55%',
        scrub: true,
      },
    },
  )

  // The vertical rule beside the portrait draws itself as you arrive.
  gsap.from('.about-rule', {
    scaleY: 0,
    transformOrigin: 'top',
    duration: 1.4,
    ease: 'power3.inOut',
    scrollTrigger: { trigger: '.about-rule', start: 'top 85%' },
  })
})
</script>

<template>
  <section id="about" ref="root" class="relative py-28 sm:py-36 lg:py-44">
    <div class="mx-auto max-w-350 px-5 sm:px-8 lg:px-12">
      <SectionHeading
        index="01"
        label="About"
        title="Engineer by trade,"
        accent="obsessive by habit."
      />

      <div class="mt-16 grid gap-14 lg:mt-24 lg:grid-cols-12 lg:gap-16">
        <!-- ------------------------------------------------- bio column -->
        <div class="lg:col-span-7">
          <!-- Words mode: we only need per-word targets, not per-letter. Using
               chars here would create ~700 spans for no visual benefit. -->
          <div class="about-bio space-y-6">
            <SplitText
              v-for="(paragraph, i) in profile.bio"
              :key="i"
              :text="paragraph"
              as="p"
              type="words"
              :masked="false"
              class="text-[clamp(1.05rem,2vw,1.4rem)] leading-[1.65]"
            />
          </div>

          <!-- Contact links -->
          <RevealOnScroll :stagger="0.08" class="mt-12 flex flex-wrap gap-3">
            <a
              v-for="social in socials"
              :key="social.href"
              :href="social.href"
              :target="social.href.startsWith('http') ? '_blank' : undefined"
              rel="noopener noreferrer"
              class="group border-border hover:border-brand/50 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors"
              :data-cursor-label="social.label"
            >
              <span class="bg-brand/60 group-hover:bg-brand size-1.5 rounded-full transition-colors" />
              {{ social.label }}
              <span class="text-muted-foreground font-mono text-xs">{{ social.handle }}</span>
            </a>
          </RevealOnScroll>
        </div>

        <!-- --------------------------------------------- portrait column -->
        <div class="lg:col-span-5">
          <div class="flex gap-6">
            <!-- The drawing rule -->
            <div class="about-rule bg-linear-to-b from-brand via-brand/40 to-transparent hidden w-px shrink-0 sm:block" />

            <div class="flex-1">
              <!-- Portrait -->
              <TiltCard :max="7" :lift="18" radius="rounded-2xl" class="mb-10">
                <div class="border-border/60 relative aspect-4/5 overflow-hidden rounded-2xl border">
                  <img
                    src="/images/profile.jpeg"
                    :alt="profile.name"
                    class="absolute inset-0 size-full object-cover"
                  />

                  <!-- Scrim so the name plate stays legible over the photo -->
                  <div
                    class="absolute inset-0"
                    style="background: linear-gradient(to top, rgba(0, 0, 0, 0.75), transparent 45%)"
                  />

                  <!-- Name plate -->
                  <div class="absolute inset-x-0 bottom-0 p-6">
                    <p class="font-serif text-3xl tracking-tight text-white">{{ profile.name }}</p>
                    <p class="mt-1 font-mono text-[10px] tracking-[0.25em] text-white/70 uppercase">
                      {{ profile.role }}
                    </p>
                  </div>
                </div>
              </TiltCard>

              <!-- Principles -->
              <RevealOnScroll :stagger="0.1" class="space-y-6">
                <div v-for="principle in principles" :key="principle.title">
                  <h3 class="font-mono text-[11px] tracking-[0.25em] uppercase">
                    <span class="text-brand">→ </span>{{ principle.title }}
                  </h3>
                  <p class="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {{ principle.body }}
                  </p>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
