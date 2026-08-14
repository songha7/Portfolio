<script setup lang="ts">
import gsap from 'gsap'
import { ArrowDown, ArrowUpRight } from '@lucide/vue'
import { profile } from '~/data/site'

/**
 * The hero.
 *
 * Layering, back to front:
 *   1. HeroCanvas — the WebGL blob and particle field
 *   2. A grid + radial vignette, to give the type something to sit on
 *   3. The text, in normal document flow
 *
 * The intro animation waits for the preloader to hand over (`isReady`), then
 * plays as one timeline so everything is choreographed rather than a pile of
 * independent delays.
 */

const root = ref<HTMLElement | null>(null)
const { isReady } = useAppReady()
const reduced = useReducedMotion()
const { scrollTo } = useSmoothScroll()

/* --------------------------------------------------------------- intro ---- */
/**
 * Held outside the watcher so the `onUnmounted` below can reach it.
 *
 * (Registering `onUnmounted` *inside* a watch callback does not work: Vue can
 * only associate lifecycle hooks with a component while `setup()` is running,
 * and a watch callback fires long after that. Doing it wrong logs
 * "onUnmounted is called when there is no active component instance" and the
 * cleanup silently never runs.)
 */
let introCtx: gsap.Context | undefined

const stopWatching = watch(
  isReady,
  (ready) => {
    if (!ready || !root.value) return
    stopWatching() // one-shot: the intro plays exactly once

    // Reduced motion: show everything immediately, no movement.
    if (reduced.value) {
      gsap.set('.hero-anim', { opacity: 1, y: 0 })
      return
    }

    // `gsap.context` scopes the selector strings below to this component and
    // gives us one-line cleanup.
    introCtx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })

      tl.from('.hero-eyebrow', { opacity: 0, y: 20, duration: 0.8 })
        // The name rises out of its mask, letter by letter. `stagger` with
        // `from: 'start'` reads left to right, like reading.
        .from(
          '.hero-title .split-char',
          { yPercent: 115, duration: 1.2, stagger: 0.035 },
          '-=0.45',
        )
        // The gradient line is one element, so it rises as a block. A clip-path
        // wipe gives it the same "revealed from behind an edge" feel the split
        // letters have, without needing to split it.
        .from(
          '.hero-line-2',
          { yPercent: 40, opacity: 0, duration: 1.1, ease: 'power4.out' },
          '-=0.85',
        )
        .from('.hero-tagline', { opacity: 0, y: 24, duration: 0.9 }, '-=0.7')
        .from('.hero-cta', { opacity: 0, y: 20, duration: 0.8, stagger: 0.1 }, '-=0.6')
        .from('.hero-stat', { opacity: 0, y: 24, duration: 0.8, stagger: 0.08 }, '-=0.5')
        .from('.hero-hint', { opacity: 0, duration: 0.8 }, '-=0.4')

      /* ------------------------------------------------- scroll parallax --- */
      // As you scroll through the hero, the text drifts up faster than the page
      // and fades. `scrub: 1` ties the animation's playhead to the scrollbar
      // with one second of smoothing, so it feels weighted rather than glued.
      gsap.to('.hero-parallax', {
        y: -120,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: root.value,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })
    }, root.value)
  },
  { immediate: true },
)

// Registered during setup, so Vue has a component instance to attach it to.
onUnmounted(() => introCtx?.revert())
</script>

<template>
  <section
    id="hero"
    ref="root"
    class="relative flex min-h-[100svh] items-center overflow-hidden"
  >
    <!-- ------------------------------------------------------ 3D backdrop -->
    <!--
      TWO WRAPPERS, TWO DIFFERENT JOBS:

      <ClientOnly> — skips this during server rendering. WebGL does not exist in
      Node, so rendering it on the server would crash the build.

      Lazy prefix — Nuxt turns `<LazyHeroCanvas>` into an async component, which
      splits three.js (~800 kB) into its own chunk fetched AFTER hydration
      instead of blocking the first paint. The preloader is covering the screen
      while that download happens, so nobody sees the difference.

      The fallback below is a matching CSS gradient, so there is never a flash
      of empty space.
    -->
    <ClientOnly>
      <LazyHeroCanvas />
      <template #fallback>
        <div class="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <div
            class="size-[min(60vw,32rem)] rounded-full opacity-70 blur-3xl"
            style="background: radial-gradient(circle, var(--brand-soft), transparent 70%)"
          />
        </div>
      </template>
    </ClientOnly>

    <!-- Hairline grid, faded out towards the edges so it never looks like a
         table. Sits above the canvas but below the text. -->
    <div class="bg-grid mask-radial-fade pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />

    <!-- A soft vignette guarantees the headline stays readable no matter what
         colour the blob happens to be behind it. -->
    <div
      class="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style="background: radial-gradient(ellipse 80% 60% at 50% 45%, transparent 30%, var(--background) 92%)"
    />

    <!-- Mobile only: the blob sits above the copy, so we fade the bottom two
         thirds to solid background. Text contrast is not negotiable, and a
         phone has no room to place the object beside the words. -->
    <div
      class="pointer-events-none absolute inset-0 md:hidden"
      aria-hidden="true"
      style="background: linear-gradient(to bottom, transparent 12%, color-mix(in oklch, var(--background) 82%, transparent) 32%, var(--background) 52%)"
    />

    <!-- ------------------------------------------------------------ text -->
    <!-- pt clears the fixed header; pb leaves room for the scroll hint.
         Keeping the total under 100svh on a laptop is the whole reason the
         type scale above caps where it does. -->
    <div class="hero-parallax relative mx-auto w-full max-w-[1400px] px-5 pt-24 pb-20 sm:px-8 lg:px-12">
      <!-- Eyebrow -->
      <div class="hero-anim hero-eyebrow mb-8 flex flex-wrap items-center gap-3">
        <Badge variant="live">
          <span class="relative flex size-1.5">
            <span class="bg-brand absolute inline-flex size-full animate-ping rounded-full opacity-70" />
            <span class="bg-brand relative inline-flex size-1.5 rounded-full" />
          </span>
          {{ profile.availability }}
        </Badge>
        <span class="text-muted-foreground font-mono text-[11px] tracking-[0.28em] uppercase">
          {{ profile.location }}
        </span>
      </div>

      <!-- Name. Two lines, tightly leaded, mixing upright serif with italic so
           it reads as editorial rather than as a default h1. -->
      <h1 class="hero-title font-serif leading-[0.85] tracking-[-0.03em]">
        <SplitText
          :text="profile.role"
          class="hero-anim block text-[clamp(2.4rem,8vw,7rem)]"
        />
        <!--
          DELIBERATELY NOT SPLIT.
          `text-gradient` works by painting a gradient on the element and
          clipping it to that element's text (`background-clip: text`). Split
          text breaks this: each character sits in its own inline-block with
          `will-change: transform`, which promotes it to a separate paint layer,
          so the parent's clipped background never shows through and the line
          renders completely invisible.
          Animating this line as one block keeps the gradient AND the motion.
        -->
        <em class="hero-line-2 text-gradient block text-[clamp(1.8rem,5.5vw,5rem)] italic">
          {{ profile.tagline }}
        </em>
      </h1>

      <!-- Supporting line -->
      <p class="hero-anim hero-tagline text-muted-foreground mt-6 max-w-lg leading-relaxed sm:text-lg">
        {{ profile.bio[0] }}
      </p>

      <!-- Calls to action -->
      <div class="mt-8 flex flex-wrap items-center gap-3">
        <MagneticWrap :strength="0.3" class="hero-anim hero-cta">
          <Button variant="brand" size="pill" data-cursor-label="Work" @click="scrollTo('#work', { offset: -60 })">
            View selected work
            <ArrowUpRight class="size-4" />
          </Button>
        </MagneticWrap>

        <MagneticWrap :strength="0.3" class="hero-anim hero-cta">
          <Button variant="glass" size="pill" as="a" :href="`mailto:${profile.email}`" data-cursor-label="Say hi">
            Get in touch
          </Button>
        </MagneticWrap>
      </div>

      <!-- Stats strip -->
      <dl class="border-border/60 mt-12 grid max-w-3xl grid-cols-2 gap-y-6 border-t pt-6 sm:grid-cols-4">
        <div v-for="stat in profile.stats" :key="stat.label" class="hero-anim hero-stat">
          <dt class="sr-only">{{ stat.label }}</dt>
          <dd>
            <span class="block font-serif text-3xl tracking-tight sm:text-4xl">
              <CountUp :value="stat.value" :suffix="stat.suffix" />
            </span>
            <span class="text-muted-foreground mt-1 block font-mono text-[10px] tracking-[0.2em] uppercase">
              {{ stat.label }}
            </span>
          </dd>
        </div>
      </dl>
    </div>

    <!-- Scroll hint. Pinned right rather than centred so it can never collide
         with the stats row on a short laptop screen. -->
    <button
      class="hero-anim hero-hint text-muted-foreground hover:text-brand absolute right-5 bottom-6 hidden flex-col items-center gap-2 transition-colors sm:right-8 lg:right-12 lg:flex"
      aria-label="Scroll to content"
      @click="scrollTo('#work', { offset: -60 })"
    >
      <span class="font-mono text-[10px] tracking-[0.3em] uppercase">Scroll</span>
      <ArrowDown class="size-3.5 animate-[scroll-hint_2s_var(--ease-out-expo)_infinite]" />
    </button>
  </section>
</template>
