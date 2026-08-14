<script setup lang="ts">
import gsap from 'gsap'

/**
 * A card that tilts in 3D towards the cursor, with a glare that tracks the
 * light source. This is the "different angle" trick applied at component scale.
 *
 * HOW 3D WORKS IN CSS
 *  - The PARENT needs `perspective`. It defines how far the viewer's eye is
 *    from the screen. Small values (500px) = dramatic, wide-angle distortion.
 *    Large values (2000px) = subtle, telephoto. 1000px is a good middle.
 *  - The CHILD then responds to rotateX / rotateY.
 *  - `transform-style: preserve-3d` lets that child's own children keep their
 *    own Z positions instead of being flattened into the card's plane.
 *
 * SIGN CONVENTION (the bit everyone gets backwards)
 *  rotateX is pitch, around the horizontal axis. Moving the mouse DOWN should
 *  tilt the top of the card AWAY from you, which is a NEGATIVE rotateX. So the
 *  Y offset gets a minus sign and the X offset does not.
 */

interface Props {
  /** Maximum tilt in degrees at the very corner of the card. */
  max?: number
  /** How far the card lifts towards the viewer on hover, in px. */
  lift?: number
  /** Show the moving specular highlight. */
  glare?: boolean
  /** Perspective distance on the wrapper. Smaller = more extreme. */
  perspective?: number
}

const props = withDefaults(defineProps<Props>(), {
  max: 9,
  lift: 24,
  glare: true,
  perspective: 1000,
})

const wrapper = ref<HTMLElement | null>(null)
const card = ref<HTMLElement | null>(null)
const glareEl = ref<HTMLElement | null>(null)
const reduced = useReducedMotion()

onMounted(() => {
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  if (!canHover || reduced.value || !wrapper.value || !card.value) return

  const node = wrapper.value
  const target = card.value

  const rotX = gsap.quickTo(target, 'rotationX', { duration: 0.5, ease: 'power3.out' })
  const rotY = gsap.quickTo(target, 'rotationY', { duration: 0.5, ease: 'power3.out' })
  const zTo = gsap.quickTo(target, 'z', { duration: 0.5, ease: 'power3.out' })

  const onMove = (e: MouseEvent) => {
    const rect = node.getBoundingClientRect()
    // Normalise the pointer to -0.5 .. +0.5 across the card. Working in a
    // unit range keeps the maths independent of the card's actual size.
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5

    rotY(px * props.max * 2)
    rotX(-py * props.max * 2) // note the minus — see the comment above
    zTo(props.lift)

    // Move the glare to the opposite side of the tilt, like a real reflection
    // sliding across a glossy surface.
    if (props.glare && glareEl.value) {
      gsap.to(glareEl.value, {
        opacity: 0.5,
        // Convert the -0.5..0.5 range into a 0%..100% background position.
        '--glare-x': `${(px + 0.5) * 100}%`,
        '--glare-y': `${(py + 0.5) * 100}%`,
        duration: 0.4,
        ease: 'power2.out',
      })
    }
  }

  const onLeave = () => {
    // Return to flat. A slight elastic makes it feel like a physical object
    // settling rather than a value being reset.
    gsap.to(target, {
      rotationX: 0,
      rotationY: 0,
      z: 0,
      duration: 1.1,
      ease: 'elastic.out(1, 0.5)',
    })
    if (glareEl.value) gsap.to(glareEl.value, { opacity: 0, duration: 0.5 })
  }

  node.addEventListener('mousemove', onMove)
  node.addEventListener('mouseleave', onLeave)

  onUnmounted(() => {
    node.removeEventListener('mousemove', onMove)
    node.removeEventListener('mouseleave', onLeave)
    gsap.killTweensOf([target, glareEl.value].filter(Boolean) as HTMLElement[])
  })
})
</script>

<template>
  <div
    ref="wrapper"
    :style="{ perspective: `${perspective}px` }"
  >
    <div
      ref="card"
      class="relative h-full will-change-transform"
      style="transform-style: preserve-3d"
    >
      <slot />

      <!-- The specular highlight. A radial gradient whose centre is driven by
           two CSS custom properties that GSAP animates. `mix-blend-mode` makes
           it brighten what is underneath rather than washing it out. -->
      <div
        v-if="glare"
        ref="glareEl"
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 mix-blend-soft-light"
        style="
          --glare-x: 50%;
          --glare-y: 50%;
          background: radial-gradient(
            circle at var(--glare-x) var(--glare-y),
            oklch(1 0 0 / 55%),
            transparent 55%
          );
        "
      />
    </div>
  </div>
</template>
