import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Animation helpers used by nearly every section.
 *
 * Nuxt auto-imports everything exported from `app/composables/`, so you can
 * call `useGsapContext()` in any component without an import statement.
 */

/* -------------------------------------------------------------------------- */
/*  Reduced motion                                                            */
/* -------------------------------------------------------------------------- */

/**
 * True when the visitor has asked their operating system to reduce motion.
 *
 * This is not a nice-to-have. For people with vestibular disorders, large
 * parallax and scroll-jacking can cause genuine nausea. Every animation in this
 * project checks this first and falls back to a plain fade or to nothing.
 */
export function useReducedMotion() {
  // VueUse gives us a reactive media query. On the server it reports
  // 'no-preference' — harmless, because no animation runs during SSR anyway.
  const preference = usePreferredReducedMotion()
  return computed(() => preference.value === 'reduce')
}

/* -------------------------------------------------------------------------- */
/*  Scoped GSAP contexts                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Run GSAP code scoped to one component, and clean it up automatically.
 *
 * WHY YOU NEED THIS
 * A ScrollTrigger keeps a reference to its DOM element forever. Navigate away
 * from the page and the component unmounts, but the trigger stays alive,
 * pinned to an element that no longer exists — a memory leak that eventually
 * shows up as scroll positions being wrong.
 *
 * `gsap.context()` records every animation and ScrollTrigger created inside it.
 * Calling `.revert()` on unmount undoes all of them in one line.
 *
 * BONUS: inside the callback, selector strings are scoped to `scope`. Writing
 * `gsap.from('.card', ...)` only matches `.card` inside this component, not
 * every `.card` on the page.
 *
 * @param scope    A template ref to the component's root element.
 * @param callback Your GSAP code. Receives the context.
 * @param options  `waitForReady` delays until the preloader is finished.
 */
export function useGsapContext(
  scope: Ref<HTMLElement | null | undefined>,
  callback: (ctx: gsap.Context) => void,
  options: { waitForReady?: boolean } = {},
) {
  const { waitForReady = true } = options
  const { isReady } = useAppReady()
  let ctx: gsap.Context | undefined

  const create = () => {
    if (ctx || !scope.value) return
    ctx = gsap.context(callback, scope.value)
    // The DOM just changed size; tell ScrollTrigger to re-measure.
    ScrollTrigger.refresh()
  }

  onMounted(() => {
    if (!waitForReady) {
      // `nextTick` guarantees the template ref is populated.
      nextTick(create)
      return
    }
    // Wait until the preloader has handed over, otherwise triggers are
    // measured against a locked, non-scrolling page and all get start: 0.
    if (isReady.value) nextTick(create)
    else {
      const stop = watch(isReady, (ready) => {
        if (!ready) return
        nextTick(create)
        stop()
      })
    }
  })

  onUnmounted(() => {
    ctx?.revert()
    ctx = undefined
  })

  return {
    /** Escape hatch if you need to rebuild manually. */
    refresh: () => ScrollTrigger.refresh(),
  }
}

/* -------------------------------------------------------------------------- */
/*  App ready / preloader state                                               */
/* -------------------------------------------------------------------------- */

/**
 * Shared "the preloader has finished" flag.
 *
 * `useState` is Nuxt's SSR-safe version of `ref`. Give it a key and every
 * component that calls `useState('app:ready')` gets the *same* ref — a tiny
 * global store with no library. The value is also serialised into the page
 * payload so the server and client agree on it during hydration.
 */
export function useAppReady() {
  const isReady = useState<boolean>('app:ready', () => false)
  /** 0..100, driven by the preloader's fake-but-honest progress counter. */
  const progress = useState<number>('app:progress', () => 0)

  return { isReady, progress }
}

/* -------------------------------------------------------------------------- */
/*  Common animation recipes                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The house "reveal" tween: rise up, fade in, unblur, staggered.
 * Kept in one place so every section shares the same personality.
 */
export function revealFrom(
  targets: gsap.TweenTarget,
  vars: gsap.TweenVars = {},
): gsap.core.Tween {
  return gsap.from(targets, {
    y: 40,
    opacity: 0,
    filter: 'blur(8px)',
    duration: 1.1,
    ease: 'power3.out',
    stagger: 0.08,
    ...vars,
  })
}

/**
 * Build a ScrollTrigger config that plays when an element enters the viewport.
 * `start: 'top 82%'` means "when the top of the element reaches 82% down the
 * screen" — i.e. just after it becomes visible, which feels responsive without
 * firing while it is still off-screen.
 */
export function enterTrigger(
  trigger: gsap.DOMTarget,
  overrides: ScrollTrigger.Vars = {},
): ScrollTrigger.Vars {
  return {
    trigger,
    start: 'top 82%',
    end: 'bottom top',
    toggleActions: 'play none none reverse',
    ...overrides,
  }
}
