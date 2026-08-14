<script setup lang="ts">
import gsap from 'gsap'

/**
 * Counts from 0 up to `value` the first time it scrolls into view.
 *
 * Two details make this feel considered rather than gimmicky:
 *  1. `tabular-nums` — a font feature that gives every digit the same width, so
 *     the number does not jitter left and right as it counts.
 *  2. `snap: { value: 1 }` — GSAP rounds to whole numbers during the tween.
 *     Without it you briefly see 47.382194.
 *
 * `useIntersectionObserver` comes free from VueUse (auto-imported), and is far
 * cheaper than a ScrollTrigger for a one-shot "did this appear yet" check.
 */

interface Props {
  value: number
  suffix?: string
  prefix?: string
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  suffix: '',
  prefix: '',
  duration: 2,
})

const el = ref<HTMLElement | null>(null)
const display = ref(0)
const reduced = useReducedMotion()
let hasRun = false

const { stop } = useIntersectionObserver(
  el,
  ([entry]) => {
    if (!entry?.isIntersecting || hasRun) return
    hasRun = true
    stop() // one-shot: stop observing so it never re-runs

    if (reduced.value) {
      display.value = props.value
      return
    }

    const obj = { n: 0 }
    gsap.to(obj, {
      n: props.value,
      duration: props.duration,
      ease: 'power2.out',
      snap: { n: 1 },
      onUpdate: () => (display.value = obj.n),
    })
  },
  // Fire when 40% of the element is showing, so it isn't already half-finished
  // by the time the visitor looks at it.
  { threshold: 0.4 },
)
</script>

<template>
  <span ref="el" class="tabular-nums">{{ prefix }}{{ Math.round(display) }}{{ suffix }}</span>
</template>
