import type Lenis from 'lenis'

/**
 * A friendly wrapper around the Lenis instance created in plugins/lenis.client.ts.
 *
 * Everything here is written to be safe to call during server-side rendering:
 * on the server `$lenis` simply does not exist, so each function quietly does
 * nothing rather than throwing.
 */
export function useSmoothScroll() {
  const nuxtApp = useNuxtApp()

  /** The raw Lenis instance, or undefined on the server. */
  const lenis = () => nuxtApp.$lenis as Lenis | undefined

  /**
   * Scroll to an element, a CSS selector, or a pixel offset.
   *
   * @param target  '#work' | HTMLElement | 0
   * @param offset  Pixels to stop short — use it to clear a sticky header.
   */
  function scrollTo(
    target: string | HTMLElement | number,
    { offset = 0, immediate = false, duration }: {
      offset?: number
      immediate?: boolean
      duration?: number
    } = {},
  ) {
    const instance = lenis()
    if (!instance) {
      // Graceful fallback if Lenis failed to start (or during SSR).
      if (typeof target === 'number') window?.scrollTo({ top: target })
      else if (typeof target === 'string')
        document?.querySelector(target)?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    instance.scrollTo(target, { offset, immediate, duration })
  }

  /** Freeze scrolling — used by the preloader, the mobile menu and modals. */
  function stop() {
    lenis()?.stop()
  }

  /** Resume scrolling. Always pair this with `stop()`. */
  function start() {
    lenis()?.start()
  }

  /**
   * Handle a click on an in-page anchor link (`/#work`).
   * Returns true if it handled it, so the caller can preventDefault().
   */
  function handleAnchor(to: string, offset = -80) {
    const hash = to.includes('#') ? `#${to.split('#')[1]}` : ''
    if (!hash) return false
    const el = document.querySelector(hash)
    if (!el) return false
    scrollTo(el as HTMLElement, { offset })
    return true
  }

  return { lenis, scrollTo, stop, start, handleAnchor }
}

/**
 * Reactive scroll progress of the whole document, from 0 to 1.
 * Used by the thin progress bar at the top of the screen.
 */
export function useScrollProgress() {
  const progress = ref(0)
  const velocity = ref(0)
  const direction = ref<1 | -1>(1)
  const nuxtApp = useNuxtApp()

  onMounted(() => {
    const lenis = nuxtApp.$lenis as Lenis | undefined
    if (!lenis) return

    // Lenis emits a scroll event with everything already calculated for us,
    // which is cheaper and smoother than reading scrollY on every frame.
    const onScroll = (e: {
      progress: number
      velocity: number
      direction: 1 | -1 | 0
    }) => {
      progress.value = e.progress
      velocity.value = e.velocity
      if (e.direction !== 0) direction.value = e.direction
    }

    lenis.on('scroll', onScroll)
    onUnmounted(() => lenis.off('scroll', onScroll))
  })

  return { progress, velocity, direction }
}
