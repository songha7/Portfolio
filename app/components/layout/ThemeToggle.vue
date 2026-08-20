<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'

/**
 * Dark/light toggle using the View Transitions API for a circular wipe that
 * spreads out from the button you clicked.
 *
 * HOW THE VIEW TRANSITIONS API WORKS
 *   1. `document.startViewTransition(cb)` takes a screenshot of the page.
 *   2. Your callback runs and mutates the DOM (here: swaps the theme class).
 *   3. The browser screenshots the new state, then cross-fades between the two
 *      using the ::view-transition-old(root) / ::view-transition-new(root)
 *      pseudo-elements.
 *
 * We disabled that default cross-fade in main.css, and instead animate a
 * `clip-path` circle on the NEW snapshot growing from the click point. The old
 * theme is revealed underneath it, so the new theme appears to pour out of the
 * button.
 *
 * The radius must reach the furthest corner or the wipe stops short — hence
 * the hypotenuse calculation.
 *
 * SAFARI VS CHROME
 * Safari did not ship `startViewTransition` until very recently, so there it
 * just takes the `!doc.startViewTransition` branch below and swaps the theme
 * instantly — no animation, no way for this code path to misbehave. Chrome
 * *does* run it, which is the only place either of the bugs below could show.
 *
 * TWO CHROME-ONLY BUGS THIS VERSION FIXES:
 *
 * 1. Origin drifting away from the button. The old code anchored the circle
 *    on `event.clientX/clientY` — the raw pointer position. A `click` fired by
 *    keyboard activation (Tab, then Enter/Space) or by anything else that
 *    dispatches a synthetic click carries `clientX/clientY` that do NOT
 *    describe the button (Chrome and Safari do not even agree with each other
 *    on what those coordinates should be for a non-pointer click). Anchoring
 *    on the button's own `getBoundingClientRect()` center instead sidesteps
 *    the question entirely — the wipe now always starts at the button, no
 *    matter how it was activated.
 *
 * 2. A frozen full-screen circle. `transition.ready` rejects if the browser
 *    can't settle on captured "old"/"new" snapshots (this page has a lot of
 *    live layout underneath: GSAP ScrollTrigger, Lenis, a WebGL canvas
 *    recolouring itself for the new theme). The old code let that rejection
 *    propagate as an unhandled promise rejection and simply never called
 *    `.animate()` — leaving the view-transition pseudo-element tree stuck on
 *    screen with no exit animation to end it. The try/catch below falls back
 *    to an instant swap on any failure, the same way the no-support branch
 *    does, so there is never a stuck snapshot.
 */

const colorMode = useColorMode()
const reduced = useReducedMotion()

const isDark = computed(() => colorMode.value === 'dark')

async function toggle(event: MouseEvent) {
  const next = isDark.value ? 'light' : 'dark'

  // TypeScript's DOM types do not include this API yet, so we feature-detect
  // through a cast rather than assuming it exists.
  const doc = document as Document & {
    startViewTransition?: (cb: () => Promise<void> | void) => {
      ready: Promise<void>
      finished: Promise<void>
    }
  }

  // No support, or the visitor asked for less motion: just switch instantly.
  if (!doc.startViewTransition || reduced.value) {
    colorMode.preference = next
    return
  }

  // Anchor on the button itself, not the raw pointer position — see "Chrome
  // bug 1" above. `currentTarget` is the element the listener is bound to
  // (the button), not whatever happened to be under the pointer.
  const anchor = (event.currentTarget as HTMLElement | null)?.getBoundingClientRect()
  const x = anchor ? anchor.left + anchor.width / 2 : event.clientX
  const y = anchor ? anchor.top + anchor.height / 2 : event.clientY
  // Distance from the anchor to the furthest corner of the screen.
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  )

  const transition = doc.startViewTransition(async () => {
    colorMode.preference = next
    // Wait for Vue to actually apply the class before the browser snapshots.
    await nextTick()
  })

  try {
    await transition.ready

    document.documentElement.animate(
      {
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
      },
      {
        duration: 620,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  } catch {
    // The browser could not settle on a snapshot to animate (see "Chrome bug
    // 2" above). The theme class was already flipped inside the callback, so
    // there is nothing left to do — just let the transition finish tearing
    // itself down instead of leaving a half-set-up animation behind.
  }
}
</script>

<template>
  <!-- ClientOnly: the server has no idea which theme this visitor prefers, so
       rendering the icon during SSR guarantees a hydration mismatch warning.
       The fallback keeps the layout from shifting while it resolves. -->
  <ClientOnly>
    <Button
      variant="ghost"
      size="icon"
      :aria-label="`Switch to ${isDark ? 'light' : 'dark'} theme`"
      data-cursor-label="Theme"
      class="relative overflow-hidden rounded-full"
      @click="toggle"
    >
      <!-- Both icons are always mounted and cross-rotate, which animates far
           more smoothly than swapping one out with v-if. -->
      <Sun
        class="size-4 transition-all duration-500"
        :class="isDark ? 'rotate-0 scale-100' : 'rotate-90 scale-0'"
      />
      <Moon
        class="absolute size-4 transition-all duration-500"
        :class="isDark ? '-rotate-90 scale-0' : 'rotate-0 scale-100'"
      />
    </Button>

    <template #fallback>
      <div class="size-9" />
    </template>
  </ClientOnly>
</template>
