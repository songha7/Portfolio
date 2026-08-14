import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Smooth scrolling with Lenis.
 *
 * HOW IT WORKS
 * Native scrolling moves the page instantly to wherever the wheel says.
 * Lenis intercepts the wheel event, stores a *target* scroll position, and then
 * every animation frame moves the real position a fraction of the way towards
 * that target (that's the `lerp` from lib/utils.ts). The result is momentum.
 *
 * THE IMPORTANT PART: ONE LOOP, NOT TWO
 * GSAP has its own requestAnimationFrame loop. Lenis wants one too. If you let
 * both run, they tick in an unpredictable order and pinned sections jitter by a
 * frame. So we shut off Lenis's internal loop (`autoRaf: false`) and drive it
 * from GSAP's ticker instead. Now there is exactly one loop in the app and the
 * order is guaranteed: Lenis moves the page, then ScrollTrigger reads it.
 */
export default defineNuxtPlugin({
  name: 'lenis',
  dependsOn: ['gsap'],
  setup(nuxtApp) {
    // Respect the OS-level "reduce motion" setting. Someone who gets motion
    // sick from smooth scrolling should get plain, instant scrolling.
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const lenis = new Lenis({
      // How long the momentum takes to settle, in seconds.
      duration: prefersReducedMotion ? 0 : 1.15,
      // An exponential ease-out: quick response, long soft tail.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !prefersReducedMotion,
      // Touch devices already have native momentum that feels better than ours.
      syncTouch: false,
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
      // We drive the loop ourselves from the GSAP ticker (see below).
      autoRaf: false,
    })

    // 1. Whenever Lenis moves the page, tell ScrollTrigger to recompute.
    lenis.on('scroll', ScrollTrigger.update)

    // 2. Drive Lenis from GSAP's ticker. GSAP passes time in seconds,
    //    Lenis expects milliseconds.
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)

    // 3. lagSmoothing tries to "catch up" after a slow frame by fast-forwarding
    //    the animation. With scroll-linked motion that produces a visible jump,
    //    so we turn it off.
    gsap.ticker.lagSmoothing(0)

    // --- Navigation handling -------------------------------------------------
    // On a normal page change we want to land at the top instantly (a smooth
    // scroll from the bottom of the old page looks like a bug), and we need to
    // recalculate every trigger because the new page has different heights.
    nuxtApp.hook('page:finish', () => {
      lenis.scrollTo(0, { immediate: true })
      // Wait one frame so the new DOM is measured, then refresh.
      requestAnimationFrame(() => ScrollTrigger.refresh())
    })

    // --- Cleanup -------------------------------------------------------------
    // Hot module reload in dev would otherwise stack up ticker callbacks.
    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        gsap.ticker.remove(raf)
        lenis.destroy()
      })
    }

    return {
      provide: { lenis },
    }
  },
})
