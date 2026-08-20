<script setup lang="ts">
import gsap from 'gsap'

/**
 * A two-part custom cursor: a small solid dot that tracks the pointer exactly,
 * and a larger ring that lags behind it.
 *
 * WHY TWO PARTS: the dot gives precision (you still know exactly what you are
 * pointing at) while the ring's lag communicates weight and speed. One element
 * doing both jobs always feels either sluggish or lifeless.
 *
 * PERFORMANCE: this runs on every mouse move, so it must never touch layout.
 * `gsap.quickTo` builds a pre-compiled tween for a single property — far faster
 * than calling gsap.to() sixty times a second, which re-parses its vars object
 * on every call.
 *
 * TRANSFORM OWNERSHIP: GSAP owns `transform` on the two positioner divs. The
 * visible dot/ring inside centre themselves with their own `-translate-1/2`.
 * Keeping those on separate elements means the two transforms never fight —
 * a bug that is genuinely painful to track down once it happens.
 *
 * INTERACTION: any element with `data-cursor-label="View"` prints that word
 * inside the ring on hover.
 */

const dotPos = ref<HTMLElement | null>(null)
const ringPos = ref<HTMLElement | null>(null)
const label = ref('')
const isVisible = ref(false)
const isActive = ref(false)

/**
 * Touch devices have no cursor to replace. `hover: hover and pointer: fine` is
 * the reliable test — checking for touch events wrongly excludes touchscreen
 * laptops that also have a mouse.
 */
const canHover = ref(false)

/** Teardown for the listeners bound below; see the note by `onUnmounted`. */
let cleanup: (() => void) | null = null

onMounted(() => {
  canHover.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  if (!canHover.value) return

  // Wait a tick so the refs are populated after the v-if flips.
  nextTick(() => {
    if (!dotPos.value || !ringPos.value) return

    const xDot = gsap.quickTo(dotPos.value, 'x', { duration: 0.08, ease: 'power3.out' })
    const yDot = gsap.quickTo(dotPos.value, 'y', { duration: 0.08, ease: 'power3.out' })
    // The ring's longer duration is what creates the trailing effect.
    const xRing = gsap.quickTo(ringPos.value, 'x', { duration: 0.55, ease: 'power3.out' })
    const yRing = gsap.quickTo(ringPos.value, 'y', { duration: 0.55, ease: 'power3.out' })

    const onMove = (e: PointerEvent) => {
      isVisible.value = true
      xDot(e.clientX)
      yDot(e.clientY)
      xRing(e.clientX)
      yRing(e.clientY)

      // Walk up from whatever is under the pointer looking for something
      // interactive. `closest` does that walk for us in one call.
      const target = (e.target as HTMLElement)?.closest?.(
        '[data-cursor-label], a, button, [role="button"]',
      ) as HTMLElement | null

      isActive.value = Boolean(target)
      label.value = target?.dataset?.cursorLabel ?? ''
    }

    // Leaving the window should hide the cursor, or it freezes at the edge.
    const onLeave = () => (isVisible.value = false)
    const onEnter = () => (isVisible.value = true)

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    document.addEventListener('pointerenter', onEnter)

    // Store the teardown for the onUnmounted registered at setup scope below.
    cleanup = () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('pointerenter', onEnter)
    }
  })
})

/**
 * Cleanup MUST be registered here, at setup scope — not inside the `nextTick`
 * callback above.
 *
 * Vue only knows which component a lifecycle hook belongs to while `setup()` is
 * running (and inside a lifecycle hook, which it wraps to restore that
 * context). A `nextTick` callback runs after both, so `getCurrentInstance()` is
 * null there and `onUnmounted` silently does nothing — it just logs
 * "onUnmounted is called when there is no active component instance".
 *
 * The consequence was a real leak: these listeners stayed bound to `window` and
 * `document` after navigating away, holding the whole component alive.
 */
onUnmounted(() => cleanup?.())
</script>

<template>
  <!-- aria-hidden + pointer-events-none throughout: this is pure decoration and
       must never intercept a click or be announced by a screen reader. -->
  <div
    v-if="canHover"
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 z-90 hidden md:block"
    :class="isVisible ? 'opacity-100' : 'opacity-0'"
    style="transition: opacity 0.25s"
  >
    <!-- POSITIONER (GSAP writes transform here) -->
    <div ref="dotPos" class="fixed top-0 left-0 will-change-transform">
      <!-- VISUAL (centres itself, scales on hover) -->
      <div
        class="bg-brand size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-300"
        :class="isActive ? 'scale-0' : 'scale-100'"
      />
    </div>

    <div ref="ringPos" class="fixed top-0 left-0 will-change-transform">
      <div
        class="border-brand/60 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border"
        :class="isActive ? 'bg-brand/10 size-16 backdrop-blur-[2px]' : 'size-8'"
        style="transition: width 0.35s var(--ease-out-expo), height 0.35s var(--ease-out-expo), background-color 0.35s"
      >
        <span
          v-if="label"
          class="text-brand font-mono text-[9px] tracking-widest whitespace-nowrap uppercase"
        >
          {{ label }}
        </span>
      </div>
    </div>
  </div>
</template>
