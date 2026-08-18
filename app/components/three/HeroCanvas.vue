<script setup lang="ts">
import * as THREE from 'three'
import type Lenis from 'lenis'

/**
 * The WebGL layer behind the hero.
 *
 * This component owns the *scene* — camera, canvas settings, and the shared
 * inputs (pointer position, scroll progress) that the objects inside react to.
 * The objects themselves are separate components so each one stays readable.
 *
 * IT MUST BE CLIENT-ONLY. There is no WebGL on a Node server, so the parent
 * wraps this in <ClientOnly> and shows the static fallback below during SSR.
 */

const colorMode = useColorMode()
const reduced = useReducedMotion()

const container = ref<HTMLElement | null>(null)

/* ------------------------------------------------------------------ pointer */
/**
 * VueUse's `useMouse` gives page coordinates. We convert them to Normalised
 * Device Coordinates: -1 at the left/bottom edge, +1 at the right/top.
 * That is the range every 3D calculation expects, and it makes the maths
 * independent of the window size.
 *
 * Note Y is flipped: screen coordinates grow downward, 3D space grows upward.
 */
const { x: mouseX, y: mouseY } = useMouse({ type: 'client' })
const { width: winW, height: winH } = useWindowSize()

const pointer = computed(() => ({
  x: winW.value ? (mouseX.value / winW.value) * 2 - 1 : 0,
  y: winH.value ? -((mouseY.value / winH.value) * 2 - 1) : 0,
}))

/* ------------------------------------------------------------------- scroll */
/**
 * How far through the first viewport the visitor has scrolled, 0..1.
 * We read it from Lenis rather than a scroll listener so it is already smoothed
 * and arrives on the same frame as everything else.
 */
const scrollProgress = ref(0)
const nuxtApp = useNuxtApp()

onMounted(() => {
  const lenis = nuxtApp.$lenis as Lenis | undefined
  if (!lenis) return
  const onScroll = ({ scroll }: { scroll: number }) => {
    scrollProgress.value = Math.min(1, Math.max(0, scroll / window.innerHeight))
  }
  lenis.on('scroll', onScroll)
  onUnmounted(() => lenis.off('scroll', onScroll))
})

/* -------------------------------------------------------------- performance */
/**
 * Rendering a 40k-triangle shader at 60fps while the canvas is scrolled off
 * screen is pure waste — it drains battery and steals frames from the scroll
 * animations that ARE visible.
 *
 * `isVisible` is handed to <SceneRenderGate> inside the canvas, which pauses
 * and resumes the render loop. See that component for why we do NOT do this by
 * toggling the `render-mode` prop — that approach freezes the scene forever.
 */
const isVisible = ref(true)
useIntersectionObserver(
  container,
  ([entry]) => (isVisible.value = entry?.isIntersecting ?? true),
  { threshold: 0 },
)

/* --------------------------------------------------------------- capability */
/**
 * Not every device can run this: old GPUs, disabled WebGL, and anyone who has
 * asked for reduced motion. Detect it once and fall back to a CSS gradient that
 * looks deliberate rather than broken.
 */
const supportsWebGL = ref(false)

onMounted(() => {
  if (reduced.value) return
  try {
    const canvas = document.createElement('canvas')
    supportsWebGL.value = Boolean(
      canvas.getContext('webgl2') || canvas.getContext('webgl'),
    )
  } catch {
    supportsWebGL.value = false
  }
})

/* ------------------------------------------------------------------- camera */
/**
 * A real Vector3 rather than the `[0, 0, 6.5]` shorthand.
 *
 * TresJS happily accepts an array at runtime, but its generated prop types
 * mirror three.js exactly and want a `Vector3` — so the array form fails
 * `nuxt typecheck` even though it works in the browser. Constructing it once
 * here keeps the template typed and avoids allocating a vector every render.
 */
const cameraPosition = new THREE.Vector3(0, 0, 6.5)

/* ------------------------------------------------------------------- layout */
/**
 * Push the blob to the right on wide screens so the headline sits on clean
 * background, and centre it on phones where the text sits below it anyway.
 *
 * The value is in world units, not pixels: at the camera distance and field of
 * view we use, 1.6 puts the blob's centre roughly two-thirds across.
 */
const blobOffsetX = computed(() => {
  if (winW.value >= 1280) return 1.9
  if (winW.value >= 768) return 1.3
  return 0
})

/**
 * On a phone there is no room beside the text, so the blob moves ABOVE it and
 * shrinks. A full-bleed object behind body copy is unreadable no matter how
 * much vignette you pile on top — the honest fix is to get it out of the way.
 */
const isMobile = computed(() => winW.value > 0 && winW.value < 768)
const blobOffsetY = computed(() => (isMobile.value ? 2.15 : 0))
const blobScale = computed(() => (isMobile.value ? 0.55 : 1))

/* ------------------------------------------------------------------- colours */
/**
 * The blob's palette per theme.
 *
 * These are NOT the same colours at different lightness — the two themes need
 * opposite strategies. On a near-black page the object must be LIGHTER than the
 * background and the fresnel rim is a bright highlight. On a bone-white page it
 * must be DARKER than the background, and a bright rim would erase the
 * silhouette entirely — so the light theme uses a deep bronze rim that
 * separates the edge instead of dissolving it.
 */
const isLight = computed(() => colorMode.value === 'light')

const palette = computed(() =>
  isLight.value
    ? { low: '#7d4f14', high: '#e0a94f', rim: '#583409', particles: '#8a6224' }
    : { low: '#4a2f0e', high: '#f2c377', rim: '#ffe6b8', particles: '#e8c27a' },
)

/* -------------------------------------------------------------- ring images */
/**
 * The photos on the orbiting ring, declared as a CONSTANT rather than written
 * inline as :images="[...]" in the template.
 *
 * THIS IS NOT A STYLE PREFERENCE — the inline form crashes the page.
 * A `[...]` literal in a template is re-evaluated on every render, so the child
 * receives a brand-new array *reference* each time even though the contents are
 * identical. This component re-renders on every mouse move (the `pointer`
 * computed above updates from useMouse), and AlbumRing watches `images` to know
 * when to rebuild. The result is a full teardown and re-upload of every panel's
 * geometry and texture, dozens of times a second, until the GPU process dies.
 *
 * Declared out here the reference never changes, so the watcher stays quiet.
 */
const ringImages = [
  '/images/profile.jpeg',
  '/images/ring1.JPG',
  '/images/ring2.jpg',
  '/images/ring3.jpeg',
]
</script>

<template>
  <div ref="container" class="absolute inset-0">
    <!-- WEBGL SCENE -->
    <TresCanvas
      v-if="supportsWebGL"
      :alpha="true"
      :antialias="true"
      clear-color="#000000"
      :clear-alpha="0"
      power-preference="high-performance"
      render-mode="always"
      class="!absolute inset-0"
    >
      <!-- Pauses the render loop when the hero scrolls out of view. Must be
           inside the canvas — it reads the renderer context via inject. -->
      <SceneRenderGate :active="isVisible" />
      <!-- A narrow field of view (40°) is the 3D equivalent of a portrait lens:
           less perspective distortion, everything reads as more premium.
           Wide angles (75°+) look like a GoPro. -->
      <TresPerspectiveCamera :position="cameraPosition" :fov="40" :near="0.1" :far="100" />

      <NoiseBlob
        :pointer="pointer"
        :scroll="scrollProgress"
        :offset-x="blobOffsetX"
        :offset-y="blobOffsetY"
        :size-scale="blobScale"
        :color-low="palette.low"
        :color-high="palette.high"
        :color-rim="palette.rim"
      />

      <!--
        Curved image panels orbiting the blob. Given the same offsets and
        scroll value as NoiseBlob so the two move as one object.

        Real photos live in public/images/ and repeat around the 9 panels
        (props.images[i % props.images.length] in AlbumRing.vue), so two
        images is enough to fill the whole ring.

        DESKTOP ONLY. On a phone the blob is deliberately pushed to the very top
        of the viewport to keep the headline readable, and the ring inherits
        that offset — so it lands half off-screen and cuts across the header.
        A clipped band of photos behind the nav looks like a bug, so below
        768px the blob carries the hero on its own.
      -->
      <AlbumRing
        v-if="!isMobile"
        :pointer="pointer"
        :scroll="scrollProgress"
        :offset-x="blobOffsetX"
        :offset-y="blobOffsetY"
        :size-scale="blobScale"
        :radius="1.9"
        :count="9"
        :height="0.74"
        :gap="5"
        :images="ringImages"
      />

      <ParticleField
        :pointer="pointer"
        :scroll="scrollProgress"
        :color="palette.particles"
        :additive="!isLight"
        :count="isLight ? 1100 : 2600"
        :size="isLight ? 5 : 7"
      />
    </TresCanvas>

    <!-- FALLBACK: a pure-CSS orb for devices without WebGL and for anyone who
         asked for reduced motion. Static, but visually consistent. -->
    <div
      v-else
      aria-hidden="true"
      class="absolute inset-0 flex items-center justify-center"
    >
      <div
        class="size-[min(60vw,32rem)] rounded-full blur-2xl"
        style="
          background: radial-gradient(
            circle at 35% 30%,
            color-mix(in oklch, var(--brand-soft) 85%, transparent),
            color-mix(in oklch, var(--brand) 55%, transparent) 45%,
            color-mix(in oklch, var(--brand-deep) 30%, transparent) 70%,
            transparent 78%
          );
        "
      />
    </div>
  </div>
</template>
