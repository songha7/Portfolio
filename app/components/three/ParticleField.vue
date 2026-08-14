<script setup lang="ts">
import * as THREE from 'three'
import { useLoop } from '@tresjs/core'
import vertexShader from '~/shaders/particles.vert.glsl'
import fragmentShader from '~/shaders/particles.frag.glsl'

/**
 * A drifting cloud of glowing points, rendered in a single draw call.
 *
 * WHAT A BUFFER GEOMETRY ACTUALLY IS
 * A flat JavaScript array of numbers that gets uploaded to GPU memory once.
 * For 10,000 particles the position array holds 30,000 floats: x,y,z, x,y,z, …
 * `itemSize: 3` tells three.js to read them three at a time.
 *
 * Adding our own attributes (aScale, aSpeed, aRandom) is how each particle gets
 * its own personality without any per-particle JavaScript. The GPU reads the
 * value for whichever vertex it is currently working on.
 */

interface Props {
  count?: number
  /** Half-width of the box particles are scattered through. */
  spread?: number
  color?: string
  size?: number
  pointer?: { x: number; y: number }
  scroll?: number
  /**
   * How the points blend with what is behind them.
   *
   * ADDITIVE looks like light — perfect for glowing motes on a dark page,
   * because adding colour to near-black makes it brighter.
   *
   * On a LIGHT page additive is wrong: adding to an almost-white background
   * clips to white, and the leftover alpha shows through as grey dust. So the
   * light theme switches to NORMAL blending, where the points behave like ink.
   */
  additive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  count: 2600,
  spread: 9,
  color: '#e8c27a',
  size: 7,
  pointer: () => ({ x: 0, y: 0 }),
  scroll: 0,
  additive: true,
})

/** Resolve the prop into the actual three.js blending constant. */
const blending = computed(() =>
  props.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
)

const pointsRef = ref<THREE.Points | null>(null)

/**
 * Build the raw attribute arrays once.
 *
 * These are plain `Float32Array`s — a fixed-length, typed block of memory that
 * can be handed straight to the GPU with no conversion. A normal JS array would
 * have to be copied and converted on every upload.
 *
 * `shallowRef` rather than `ref`: we do NOT want Vue to deep-proxy 30,000
 * floats. It would be slow, pointless (the contents never change reactively),
 * and three.js would receive a Proxy where it expects a real Float32Array.
 */
const attributes = shallowRef(buildAttributes())

function buildAttributes() {
  const count = props.count

  const positions = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  const speeds = new Float32Array(count)
  const randoms = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const i3 = i * 3

    // Scatter through a box, but bias towards the edges so the middle stays
    // clear for the blob. Cubing a -1..1 random pushes values away from zero.
    const bias = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), 0.6)

    positions[i3] = bias(Math.random() * 2 - 1) * props.spread
    positions[i3 + 1] = bias(Math.random() * 2 - 1) * props.spread * 0.62
    // Mostly behind the blob (negative Z is away from the camera).
    positions[i3 + 2] = (Math.random() * 2 - 1) * props.spread * 0.7 - 2

    // Most particles small, a few noticeably larger — an even distribution
    // looks artificial. Squaring the random skews it towards the low end.
    scales[i] = Math.pow(Math.random(), 2) * 1.8 + 0.25
    speeds[i] = Math.random() * 0.5 + 0.15

    randoms[i3] = Math.random()
    randoms[i3 + 1] = Math.random()
    randoms[i3 + 2] = Math.random()
  }

  return { positions, scales, speeds, randoms }
}

// Rebuild if the particle count is changed at runtime.
watch(() => props.count, () => (attributes.value = buildAttributes()))

const uniforms = {
  uTime: { value: 0 },
  uSize: { value: props.size },
  uColor: { value: new THREE.Color(props.color) },
  uMouse: { value: new THREE.Vector2(0, 0) },
  // Retina screens have twice the pixels, so a 7px point would look half the
  // size unless we scale by the device pixel ratio.
  uPixelRatio: { value: 1 },
}

onMounted(() => {
  // Capped at 2 — beyond that the extra pixels cost real performance and buy
  // nothing anyone can see.
  uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

watch(() => props.color, (c) => uniforms.uColor.value.set(c))
watch(() => props.size, (s) => (uniforms.uSize.value = s))

const { onBeforeRender } = useLoop()

onBeforeRender(({ delta, elapsed }) => {
  uniforms.uTime.value = elapsed

  // Ease the pointer towards its target (frame-rate independent, see NoiseBlob).
  const ease = 1 - Math.exp(-2.5 * delta)
  uniforms.uMouse.value.x += (props.pointer.x - uniforms.uMouse.value.x) * ease
  uniforms.uMouse.value.y += (props.pointer.y - uniforms.uMouse.value.y) * ease

  const points = pointsRef.value
  if (!points) return
  // The whole field counter-rotates slowly against the blob, and drifts as you
  // scroll — a cheap way to make the depth readable.
  points.rotation.y = -elapsed * 0.02
  points.position.y = props.scroll * 3
})

// TresJS disposes the geometry and material it created for us when this
// component unmounts, so there is no manual cleanup to do here. (If you build a
// geometry yourself with `new THREE.BufferGeometry()`, you DO have to call
// `.dispose()` — GPU memory is not garbage collected.)
</script>

<template>
  <TresPoints ref="pointsRef">
    <!--
      HOW ATTRIBUTES WORK IN TRESJS
      Any prop on a <TresBufferGeometry> that is not `args` is turned into a
      buffer attribute: the value is spread into `new THREE.BufferAttribute(...)`.
      So `:position="[array, 3]"` becomes `new BufferAttribute(array, 3)` and is
      set as the `position` attribute.

      Prop names are camel-cased, so `:a-scale` here matches
      `attribute float aScale` in particles.vert.glsl.
    -->
    <TresBufferGeometry
      :position="[attributes.positions, 3]"
      :a-scale="[attributes.scales, 1]"
      :a-speed="[attributes.speeds, 1]"
      :a-random="[attributes.randoms, 3]"
    />
    <TresShaderMaterial
      :vertex-shader="vertexShader"
      :fragment-shader="fragmentShader"
      :uniforms="uniforms"
      :transparent="true"
      :depth-write="false"
      :blending="blending"
    />
  </TresPoints>
</template>
