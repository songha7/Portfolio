<script setup lang="ts">
import * as THREE from 'three'
import { useLoop } from '@tresjs/core'
import vertexShader from '~/shaders/blob.vert.glsl'
import fragmentShader from '~/shaders/blob.frag.glsl'

/**
 * The hero's centrepiece: a sphere deformed by animated 3D noise.
 *
 * HOW TRESJS WORKS
 * Every three.js class becomes a component with a `Tres` prefix, and the
 * constructor arguments go in `:args`. So this:
 *   new THREE.IcosahedronGeometry(1.4, 64)
 * becomes:
 *   <TresIcosahedronGeometry :args="[1.4, 64]" />
 * Nesting a geometry and a material inside a `<TresMesh>` attaches them, the
 * same way `new Mesh(geometry, material)` would.
 *
 * WHY AN ICOSAHEDRON, NOT A SPHERE
 * SphereGeometry lays vertices out in latitude/longitude rings, so they bunch
 * up at the poles — displace it and you get visible pinching there.
 * IcosahedronGeometry subdivides a 20-sided solid, giving near-uniform triangle
 * sizes across the whole surface. Detail level 64 is roughly 40k triangles.
 */

interface Props {
  /** Sphere radius before displacement. */
  radius?: number
  /** Subdivision level. Higher = smoother but heavier. 40–80 is the sweet spot. */
  detail?: number
  /** Mouse position, normalised to -1..1. Passed down from the parent canvas. */
  pointer?: { x: number; y: number }
  /** Scroll progress 0..1, used to rotate and shrink the blob as you scroll. */
  scroll?: number
  /**
   * Horizontal offset in world units. On wide screens we push the blob to the
   * right so the headline has clear space on the left — a full-bleed object
   * behind text is the fastest way to make a hero unreadable.
   */
  offsetX?: number
  /** Vertical offset in world units. Positive moves the blob up. */
  offsetY?: number
  /** Overall size multiplier, so small screens get a smaller object. */
  sizeScale?: number
  colorLow?: string
  colorHigh?: string
  colorRim?: string
  /* --- Live shader controls (driven by the sliders on /playground) --------- */
  /** Frequency of the noise. Low = big lazy lumps, high = crumpled. */
  noiseScale?: number
  /** How far the surface is pushed out along its radius. */
  displace?: number
  /** Tightness of the rim light. 1 = broad wash, 6 = thin bright edge. */
  fresnelPower?: number
  /** Speed multiplier for the whole animation. */
  speed?: number
  /** Turn the mesh into a wireframe — useful for seeing the actual geometry. */
  wireframe?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  radius: 1.25,
  detail: 64,
  pointer: () => ({ x: 0, y: 0 }),
  scroll: 0,
  offsetX: 0,
  offsetY: 0,
  sizeScale: 1,
  colorLow: '#5a3a12',
  colorHigh: '#f0c069',
  colorRim: '#ffd894',
  noiseScale: 0.55,
  displace: 0.24,
  fresnelPower: 2.6,
  speed: 1,
  wireframe: false,
})

const meshRef = ref<THREE.Mesh | null>(null)

/**
 * Uniforms are the bridge between JavaScript and GLSL.
 *
 * IMPORTANT: this object must NOT be reactive in the Vue sense. Vue's proxy
 * would wrap the THREE.Color and Vector2 instances, and three.js checks
 * `instanceof` when uploading them — a proxy fails that check and the uniform
 * silently never updates. `shallowRef` on the object, and mutating `.value`
 * directly in the render loop, is the pattern that works.
 */
const uniforms = {
  uTime: { value: 0 },
  // Lower scale = larger, lazier lumps. Above ~0.8 the surface starts to look
  // crumpled rather than liquid.
  uNoiseScale: { value: props.noiseScale },
  uDisplace: { value: props.displace },
  uMouseInfluence: { value: 0 },
  uColorLow: { value: new THREE.Color(props.colorLow) },
  uColorHigh: { value: new THREE.Color(props.colorHigh) },
  uColorRim: { value: new THREE.Color(props.colorRim) },
  uFresnelPower: { value: props.fresnelPower },
  uOpacity: { value: 1 },
}

// Keep the colours in sync if the theme changes them at runtime.
// `.set()` mutates the existing THREE.Color rather than replacing the object —
// important, because three.js caches the uniform by reference.
watch(
  () => [props.colorLow, props.colorHigh, props.colorRim],
  ([low, high, rim]) => {
    uniforms.uColorLow.value.set(low!)
    uniforms.uColorHigh.value.set(high!)
    uniforms.uColorRim.value.set(rim!)
  },
)

// Numeric uniforms driven by the playground sliders.
watch(() => props.noiseScale, (v) => (uniforms.uNoiseScale.value = v))
watch(() => props.displace, (v) => (uniforms.uDisplace.value = v))
watch(() => props.fresnelPower, (v) => (uniforms.uFresnelPower.value = v))

/** Smoothed pointer values, so the blob eases towards the cursor. */
let smoothX = 0
let smoothY = 0
let smoothInfluence = 0
/**
 * Our own clock, so the `speed` slider can change the rate without the blob
 * jumping. If we multiplied `elapsed` by speed directly, halving the speed
 * would instantly rewind the animation to half its current time.
 * Accumulating scaled deltas keeps the surface continuous.
 */
let clock = 0

/**
 * `onBeforeRender` fires once per frame, just before three.js draws.
 * `delta` is seconds since the last frame — always multiply movement by it, or
 * your animation runs at double speed on a 120Hz display.
 */
const { onBeforeRender } = useLoop()

onBeforeRender(({ delta, elapsed }) => {
  const mesh = meshRef.value
  if (!mesh) return

  // Drive the shader's clock (see the note on `clock` above).
  clock += delta * props.speed
  uniforms.uTime.value = clock

  // Ease the pointer influence. `1 - exp(-k * delta)` is a frame-rate
  // independent version of the usual lerp factor — it behaves identically at
  // 30fps and 144fps, which a plain `lerp(a, b, 0.1)` does not.
  const ease = 1 - Math.exp(-4 * delta)
  smoothX += (props.pointer.x - smoothX) * ease
  smoothY += (props.pointer.y - smoothY) * ease

  // Distance of the cursor from centre, 0 (centre) .. 1 (corner).
  const target = Math.min(1, Math.hypot(props.pointer.x, props.pointer.y))
  smoothInfluence += (target - smoothInfluence) * ease
  uniforms.uMouseInfluence.value = smoothInfluence

  // Slow constant rotation, plus a tilt that follows the cursor.
  mesh.rotation.y = elapsed * 0.12 + smoothX * 0.4
  mesh.rotation.x = smoothY * 0.3
  // Scroll pushes the blob back and spins it — this is what ties the 3D to the
  // page instead of leaving it as an unrelated decoration.
  mesh.rotation.z = props.scroll * Math.PI * 0.6

  // Position: the offsets stay fixed, while scroll pushes the blob away from
  // the camera and drifts it upward as the hero leaves.
  mesh.position.x = props.offsetX
  mesh.position.y = props.offsetY + props.scroll * 0.8
  mesh.position.z = -props.scroll * 3

  // `sizeScale` is the responsive base size; the scroll term shrinks it on top.
  const scale = props.sizeScale * (1 - props.scroll * 0.35)
  mesh.scale.setScalar(Math.max(0.2, scale))
})
</script>

<template>
  <TresMesh ref="meshRef">
    <TresIcosahedronGeometry :args="[radius, detail]" />
    <!--
      A raw ShaderMaterial: no built-in lighting, no automatic anything. We are
      responsible for every pixel — which is the point. `:uniforms` is passed by
      reference, so mutating uniforms.uTime.value above reaches the GPU.
    -->
    <TresShaderMaterial
      :vertex-shader="vertexShader"
      :fragment-shader="fragmentShader"
      :uniforms="uniforms"
      :transparent="false"
      :wireframe="wireframe"
    />
  </TresMesh>
</template>
