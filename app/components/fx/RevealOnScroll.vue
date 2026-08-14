<script setup lang="ts">
import gsap from 'gsap'

/**
 * Wrap anything in this and it animates in when scrolled to.
 *
 * `direction` picks which way it travels from. `stagger` > 0 animates the
 * element's *direct children* one after another instead of the wrapper as a
 * whole — useful for lists and grids.
 *
 * All the cleanup is handled by `useGsapContext`, so navigating away never
 * leaves an orphaned ScrollTrigger behind.
 */

interface Props {
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade'
  /** Seconds of delay between children. 0 animates the wrapper itself. */
  stagger?: number
  delay?: number
  duration?: number
  /** How far into the viewport before it fires. '82%' ≈ just after appearing. */
  start?: string
  distance?: number
  as?: string
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'up',
  stagger: 0,
  delay: 0,
  duration: 1.1,
  start: 'top 85%',
  distance: 48,
  as: 'div',
})

const root = ref<HTMLElement | null>(null)
const reduced = useReducedMotion()

/** Turn the `direction` prop into the GSAP `from` values. */
const fromVars = computed<gsap.TweenVars>(() => {
  const d = props.distance
  switch (props.direction) {
    case 'down':
      return { y: -d }
    case 'left':
      return { x: d }
    case 'right':
      return { x: -d }
    case 'scale':
      return { scale: 0.9, y: d * 0.4 }
    case 'fade':
      return {}
    default:
      return { y: d }
  }
})

useGsapContext(root, () => {
  if (!root.value) return

  // Reduced motion: still reveal (so nothing stays invisible), but only fade.
  const vars: gsap.TweenVars = reduced.value ? {} : fromVars.value

  // With stagger, animate the children; without, animate the wrapper.
  const targets =
    props.stagger > 0 ? Array.from(root.value.children) : root.value

  gsap.from(targets, {
    ...vars,
    opacity: 0,
    filter: reduced.value ? 'none' : 'blur(6px)',
    duration: reduced.value ? 0.4 : props.duration,
    delay: props.delay,
    stagger: props.stagger,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: root.value,
      start: props.start,
      // play on enter, do nothing leaving, do nothing entering back,
      // reverse when scrolling back past the start.
      toggleActions: 'play none none reverse',
    },
    // Clear the inline styles GSAP leaves behind once finished, so hover
    // states and later animations are not fighting a leftover filter/transform.
    clearProps: 'filter',
  })
})
</script>

<template>
  <component :is="as" ref="root">
    <slot />
  </component>
</template>
