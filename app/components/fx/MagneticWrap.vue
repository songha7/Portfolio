<script setup lang="ts">
import gsap from 'gsap'

/**
 * Makes its slotted content lean towards the cursor while hovered, then spring
 * back when the pointer leaves. Used on nav links and buttons.
 *
 * THE MATHS
 * On mousemove we get the element's bounding box, find its centre, and measure
 * how far the pointer is from that centre. Multiplying by `strength` (0..1)
 * gives a small offset — at strength 0.4 the element moves 40% of the way
 * towards the cursor. The label inside moves a little more than the wrapper,
 * which sells the effect as depth rather than a flat slide.
 *
 * On leave we use an elastic ease so it overshoots slightly and settles. That
 * overshoot is the difference between "moves back" and "snaps back".
 */

interface Props {
  /** 0 = inert, 1 = the element pins itself to the cursor. 0.3–0.5 is tasteful. */
  strength?: number
  /** Extra pixels of hit area around the element, so the pull starts early. */
  padding?: number
  as?: string
}

const props = withDefaults(defineProps<Props>(), {
  strength: 0.35,
  padding: 16,
  as: 'div',
})

const el = ref<HTMLElement | null>(null)
const reduced = useReducedMotion()

onMounted(() => {
  // Skip entirely on touch (no hover) or if the visitor asked for less motion.
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  if (!canHover || reduced.value || !el.value) return

  const node = el.value
  const inner = node.firstElementChild as HTMLElement | null

  const xTo = gsap.quickTo(node, 'x', { duration: 0.6, ease: 'power3.out' })
  const yTo = gsap.quickTo(node, 'y', { duration: 0.6, ease: 'power3.out' })
  const xInner = inner ? gsap.quickTo(inner, 'x', { duration: 0.8, ease: 'power3.out' }) : null
  const yInner = inner ? gsap.quickTo(inner, 'y', { duration: 0.8, ease: 'power3.out' }) : null

  const onMove = (e: MouseEvent) => {
    // getBoundingClientRect is read fresh each move: the page scrolls, so a
    // cached rect would drift out of date.
    const rect = node.getBoundingClientRect()
    const relX = e.clientX - (rect.left + rect.width / 2)
    const relY = e.clientY - (rect.top + rect.height / 2)

    xTo(relX * props.strength)
    yTo(relY * props.strength)
    // The inner element travels further — a subtle parallax between the two.
    xInner?.(relX * props.strength * 0.4)
    yInner?.(relY * props.strength * 0.4)
  }

  const onLeave = () => {
    // `elastic.out(1, 0.35)` — amplitude 1, period 0.35. Lower period = snappier.
    gsap.to(node, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' })
    if (inner) gsap.to(inner, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.3)' })
  }

  node.addEventListener('mousemove', onMove)
  node.addEventListener('mouseleave', onLeave)

  onUnmounted(() => {
    node.removeEventListener('mousemove', onMove)
    node.removeEventListener('mouseleave', onLeave)
    gsap.killTweensOf([node, inner].filter(Boolean) as HTMLElement[])
  })
})
</script>

<template>
  <component
    :is="as"
    ref="el"
    class="inline-block will-change-transform"
    :style="{ padding: `${padding}px`, margin: `-${padding}px` }"
  >
    <!-- Wrapping the slot in one element gives us the inner parallax layer. -->
    <span class="inline-block will-change-transform">
      <slot />
    </span>
  </component>
</template>
