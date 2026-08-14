<script setup lang="ts">
/**
 * An endless horizontal ticker.
 *
 * THE SEAMLESS LOOP TRICK
 * Render the list of items exactly TWICE, side by side, then translate the
 * whole track from 0% to -50%. At -50% the second copy sits precisely where the
 * first copy started, so when the animation restarts at 0% nothing visibly
 * jumps. Duplicating three times or animating to -100% both produce a stutter —
 * it must be two copies and -50%.
 *
 * `aria-hidden` on the duplicate stops screen readers announcing everything
 * twice.
 *
 * Everything runs in CSS rather than JS: an infinite transform animation is one
 * of the few things the compositor can handle entirely on its own, so it keeps
 * running at 60fps even while the main thread is busy.
 */

interface Props {
  items: string[]
  /** Seconds for one full pass. Higher = slower. */
  duration?: number
  reverse?: boolean
  /** Fade the row out at both ends instead of hard-cutting it. */
  fade?: boolean
  /** Character drawn between items. */
  separator?: string
}

const props = withDefaults(defineProps<Props>(), {
  duration: 40,
  reverse: false,
  fade: true,
  separator: '◆',
})
</script>

<template>
  <div
    class="group relative flex w-full overflow-hidden"
    :class="fade ? 'mask-edges' : ''"
  >
    <!-- The moving track. `w-max` lets it grow as wide as its contents need,
         which is what makes the -50% maths work regardless of item count. -->
    <div
      class="marquee-track flex w-max shrink-0 items-center will-change-transform"
      :style="{
        animation: `${reverse ? 'marquee-reverse' : 'marquee'} ${duration}s linear infinite`,
      }"
    >
      <!-- Copy 1 (the real, readable one) and Copy 2 (decorative duplicate) -->
      <template v-for="copy in 2" :key="copy">
        <div class="flex shrink-0 items-center" :aria-hidden="copy === 2 ? 'true' : undefined">
          <span
            v-for="(item, i) in items"
            :key="`${copy}-${i}`"
            class="flex shrink-0 items-center"
          >
            <span class="px-6 text-[clamp(1.5rem,4vw,3rem)] leading-none font-medium tracking-tight whitespace-nowrap">
              {{ item }}
            </span>
            <span class="text-brand/50 shrink-0 text-lg">{{ separator }}</span>
          </span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* Pausing on hover lets a curious visitor actually read the row. A small
   courtesy that costs one line. */
.group:hover .marquee-track {
  animation-play-state: paused;
}

/* Someone who asked for reduced motion should not be shown an infinite loop. */
@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none !important;
  }
}
</style>
