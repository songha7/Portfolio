<script setup lang="ts">
/**
 * A hairline gold bar across the top of the viewport showing how far through
 * the page you are.
 *
 * `scaleX` is animated rather than `width`, because transforms are handled by
 * the compositor thread — the browser never has to recalculate layout. On a
 * value that changes 60 times a second that difference is the whole ballgame.
 */
const { progress } = useScrollProgress()
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 top-0 z-70 h-px"
    role="progressbar"
    aria-label="Page scroll progress"
    :aria-valuenow="Math.round(progress * 100)"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div
      class="h-full origin-left"
      :style="{
        transform: `scaleX(${progress})`,
        background: 'linear-gradient(90deg, var(--brand-deep), var(--brand), var(--brand-soft))',
      }"
    />
  </div>
</template>
