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
 */

const colorMode = useColorMode()
const reduced = useReducedMotion()

const isDark = computed(() => colorMode.value === 'dark')

async function toggle(event: MouseEvent) {
  const next = isDark.value ? 'light' : 'dark'

  // TypeScript's DOM types do not include this API yet, so we feature-detect
  // through a cast rather than assuming it exists.
  const doc = document as Document & {
    startViewTransition?: (cb: () => Promise<void> | void) => { ready: Promise<void> }
  }

  // No support, or the visitor asked for less motion: just switch instantly.
  if (!doc.startViewTransition || reduced.value) {
    colorMode.preference = next
    return
  }

  const x = event.clientX
  const y = event.clientY
  // Distance from the click to the furthest corner of the screen.
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  )

  const transition = doc.startViewTransition(async () => {
    colorMode.preference = next
    // Wait for Vue to actually apply the class before the browser snapshots.
    await nextTick()
  })

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
