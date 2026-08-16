<script setup lang="ts">
import { useLoop } from '@tresjs/core'

/**
 * Pauses the WebGL render loop while the canvas is scrolled off screen, and
 * resumes it when it comes back.
 *
 * WHY THIS EXISTS INSTEAD OF TOGGLING `render-mode`
 * The obvious approach — binding `<TresCanvas render-mode>` to a ref and
 * flipping it between "always" and "manual" — is a trap. TresJS gates drawing
 * on an internal frame counter:
 *
 *     frames.value = isModeAlways ? 1 : Math.max(0, frames.value - 1)
 *     if (frames.value) renderFunction(notifyFrameRendered)
 *
 * That first line only runs *inside* the render callback. So in "manual" mode
 * the counter decays to 0, no frame renders, and because no frame renders the
 * counter is never reset — switching back to "always" cannot revive it. The
 * canvas freezes on its last frame permanently. (That was a real bug here: the
 * hero blob stayed frozen after you scrolled back up to it.)
 *
 * `useLoop().stop()` / `.start()` operate on the requestAnimationFrame loop
 * itself (`timer.stop(); pause()` and `timer.start(); resume()`), which is
 * genuinely symmetric — so resuming actually resumes.
 *
 * This component must live INSIDE <TresCanvas>: `useLoop` reads the renderer
 * context through provide/inject, which only exists below the canvas.
 * It renders nothing — it is pure behaviour.
 */

const props = defineProps<{
  /** True while the canvas is on screen. */
  active: boolean
}>()

const { start, stop } = useLoop()

watch(
  () => props.active,
  (isActive) => {
    if (isActive) start()
    else stop()
  },
  // No `immediate`: the canvas starts its own loop when the renderer is ready,
  // and calling stop() before that would race with it.
)

// Always hand the loop back on unmount. If this component is removed while the
// canvas lives on, leaving the loop paused would freeze the scene for good.
onUnmounted(() => start())
</script>

<template>
  <!-- renderless -->
</template>
