import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

/**
 * GSAP setup.
 *
 * The `.client` suffix in the filename tells Nuxt to run this file only in the
 * browser. GSAP touches `window` and `document`, so running it during
 * server-side rendering would crash the build.
 *
 * Plugins in GSAP are opt-in: importing them is not enough, you must register
 * them once so the core knows they exist.
 *  - ScrollTrigger  -> "run this animation as the user scrolls"
 *  - ScrollToPlugin -> lets gsap.to(window, { scrollTo: ... }) work
 */
export default defineNuxtPlugin({
  name: 'gsap',
  setup() {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

    // Defaults applied to every tween that doesn't specify its own.
    // "power3.out" starts fast and settles gently — it reads as expensive.
    gsap.defaults({
      ease: 'power3.out',
      duration: 1,
    })

    // ScrollTrigger defaults. `markers: false` — flip to true while developing
    // and you get labelled start/end lines drawn on screen. It is the single
    // most useful debugging trick in scroll animation.
    ScrollTrigger.defaults({
      markers: false,
      toggleActions: 'play none none reverse',
    })

    // Mobile browsers resize the viewport when the address bar hides, which
    // fires a resize event mid-scroll and makes pinned sections jump.
    // Ignoring resizes that only change the height on touch devices fixes it.
    ScrollTrigger.config({
      ignoreMobileResize: true,
      autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
    })

    return {
      provide: {
        // Available anywhere as `const { $gsap } = useNuxtApp()`
        gsap,
        ScrollTrigger,
      },
    }
  },
})
