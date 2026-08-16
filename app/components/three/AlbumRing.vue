<script setup lang="ts">
import * as THREE from 'three'
import { useLoop } from '@tresjs/core'
import { projects } from '~/data/site'

/**
 * A ring of images orbiting the blob, each one CURVED so it wraps the ball's
 * surface rather than floating in front of it as a flat card.
 *
 * HOW THE CURVE WORKS — the whole trick is the geometry choice.
 * A `PlaneGeometry` would give flat billboards. Instead each panel is a slice
 * of a cylinder wall:
 *
 *     new THREE.CylinderGeometry(r, r, height, seg, 1, true, thetaStart, thetaLength)
 *                                                   ^open-ended  ^just this arc
 *
 * `openEnded: true` drops the top and bottom caps, leaving only the curved
 * wall. Giving each panel its own `thetaStart` spaces them around the ring, and
 * `thetaLength` sets how much of the circle each one covers. The result is an
 * image bent along the same radius as the ball, so it reads as wrapped around
 * it. Three's UV mapping runs 0..1 across whatever arc you asked for, so the
 * texture fills the panel with no manual UV work.
 *
 * IMAGES: drop files into `public/album/` and pass their paths via the `images`
 * prop. With none supplied it generates on-brand tiles from your project
 * accents, so the ring looks deliberate before you have any photos.
 */

interface Props {
  /** Distance of the ring from the centre of the blob. */
  radius?: number
  /** Vertical size of each panel, in world units. */
  height?: number
  /** How many panels go around the ring. */
  count?: number
  /** Gap between panels, in degrees. */
  gap?: number
  /** Radians per second of orbit. Negative spins the other way. */
  speed?: number
  /** Tilt of the whole ring, in degrees — 0 is edge-on and reads as a flat line. */
  tilt?: number
  /**
   * Optional real images, e.g. ['/album/one.jpg', '/album/two.jpg'].
   * Fewer images than `count` is fine — they repeat around the ring.
   */
  images?: string[]

  /* --- These mirror NoiseBlob so the ring tracks the ball exactly --------- */
  offsetX?: number
  offsetY?: number
  sizeScale?: number
  scroll?: number
  pointer?: { x: number; y: number }
}

const props = withDefaults(defineProps<Props>(), {
  // Just outside the blob's maximum displaced radius (~1.55) so the panels
  // skim the surface without intersecting it. Push this much further out and
  // the front-most panel sits close to the camera, balloons in perspective,
  // and starts colliding with the headline.
  radius: 1.9,
  height: 0.74,
  count: 9,
  gap: 5,
  speed: 0.22,
  tilt: 14,
  images: () => [],
  offsetX: 0,
  offsetY: 0,
  sizeScale: 1,
  scroll: 0,
  pointer: () => ({ x: 0, y: 0 }),
})

/** Outer group carries position/scale/tilt; inner group does the spinning. */
const outer = ref<THREE.Group | null>(null)
const spinner = ref<THREE.Group | null>(null)

/* -------------------------------------------------------------- textures -- */

/**
 * Guard against a CSS colour the canvas cannot parse.
 *
 * Setting an invalid value on `fillStyle` is silently ignored, leaving the
 * previous one in place — so we prime it with black, assign, and see whether it
 * moved. `oklch()` works in current Chrome/Safari/Firefox but this keeps older
 * browsers from rendering a ring of black rectangles.
 */
function safeColor(css: string, fallback: string) {
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return fallback
  ctx.fillStyle = '#000000'
  ctx.fillStyle = css
  return ctx.fillStyle === '#000000' ? fallback : css
}

/** Builds a placeholder tile: brand gradient, hairline grid, project label. */
function makePlaceholderTexture(title: string, year: string, a: string, b: string) {
  const w = 640
  const h = 420
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, safeColor(a, '#e0a94f'))
  grad.addColorStop(1, safeColor(b, '#7d4f14'))
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Hairline grid, matching the `bg-grid` utility used across the site.
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'
  ctx.lineWidth = 1
  for (let x = 0; x <= w; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let y = 0; y <= h; y += 64) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }

  // Darken the lower third so the label always has contrast.
  const scrim = ctx.createLinearGradient(0, h * 0.45, 0, h)
  scrim.addColorStop(0, 'rgba(0,0,0,0)')
  scrim.addColorStop(1, 'rgba(0,0,0,0.62)')
  ctx.fillStyle = scrim
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.font = '600 46px Geist, ui-sans-serif, system-ui, sans-serif'
  ctx.fillText(title, 34, h - 62)

  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '500 24px "Geist Mono", ui-monospace, monospace'
  ctx.fillText(year, 34, h - 28)

  const texture = new THREE.CanvasTexture(canvas)
  // Without this the tile renders washed out — three assumes linear otherwise.
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/**
 * `shallowRef`, not `ref`: Vue must NOT deep-proxy three.js objects. Textures
 * and geometries are checked with `instanceof` internally, and a reactive Proxy
 * fails that check — the classic symptom is a silently black material.
 */
const panels = shallowRef<{ geometry: THREE.CylinderGeometry; texture: THREE.Texture }[]>([])

function buildPanels() {
  disposePanels()

  const loader = new THREE.TextureLoader()
  const gapRad = (props.gap * Math.PI) / 180
  const step = (Math.PI * 2) / props.count
  const thetaLength = step - gapRad

  /**
   * Load each UNIQUE url once and give every panel that asks for it the SAME
   * Texture object.
   *
   * `loader.load()` decodes the file and uploads it to the GPU every time it is
   * called — it does not deduplicate. With fewer images than panels,
   * `images[i % length]` hands the same url to several panels, so without this
   * cache one 4K photo spread over 5 panels is five separate full-resolution
   * uploads. Sharing the texture is also free to render: three.js binds it once.
   */
  const textureCache = new Map<string, THREE.Texture>()
  const loadCached = (url: string) => {
    let texture = textureCache.get(url)
    if (!texture) {
      texture = loader.load(url)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = 4
      textureCache.set(url, texture)
    }
    return texture
  }

  panels.value = Array.from({ length: props.count }, (_, i) => {
    const geometry = new THREE.CylinderGeometry(
      props.radius,
      props.radius,
      props.height,
      // 24 segments across the arc keeps the curve smooth; a low number here
      // makes the "curved" image look faceted.
      24,
      1,
      true, // openEnded — wall only, no caps
      i * step,
      thetaLength,
    )

    let texture: THREE.Texture
    if (props.images.length) {
      texture = loadCached(props.images[i % props.images.length]!)
    } else {
      const p = projects[i % projects.length]!
      texture = makePlaceholderTexture(p.title, p.year, p.accent[0], p.accent[1])
    }

    return { geometry, texture }
  })
}

function disposePanels() {
  // GPU memory is not garbage collected — without this, changing `count` at
  // runtime would leak a full set of geometries and textures every time.
  //
  // Panels can now SHARE a texture (see loadCached), so dispose each distinct
  // one only once. Disposing the same texture twice is harmless in three.js,
  // but tracking it keeps the intent obvious.
  const disposed = new Set<THREE.Texture>()
  panels.value.forEach(({ geometry, texture }) => {
    geometry.dispose()
    if (!disposed.has(texture)) {
      texture.dispose()
      disposed.add(texture)
    }
  })
  panels.value = []
}

onMounted(buildPanels)

/**
 * Rebuild only when something that changes the panels actually changes.
 *
 * TRAP: the obvious version of this line was
 *   watch(() => [props.count, ..., props.images], buildPanels, { deep: true })
 * and it is a page-killer. Two things compound:
 *
 *   1. A parent writing :images="['/a.jpg']" inline creates a NEW array on
 *      every one of its renders — and this canvas's parent re-renders on every
 *      mouse move — so `props.images` looks "changed" constantly.
 *   2. `deep: true` makes Vue skip its own equality check and fire the callback
 *      whenever the effect re-runs, so nothing filters the false alarms out.
 *
 * Together that tears down and re-uploads every geometry and texture dozens of
 * times a second until the GPU process dies.
 *
 * The getter below returns a single STRING, not an array. Vue compares a
 * watcher's result with Object.is, and two arrays built from identical values
 * are still two different objects — so returning an array would keep firing on
 * every render no matter what is inside it. A string of the same values
 * compares equal to itself, so an unchanged ring is correctly seen as no
 * change, however the parent chose to spell the prop.
 */
watch(
  () => [props.count, props.radius, props.height, props.gap, ...props.images].join('|'),
  buildPanels,
)
onUnmounted(disposePanels)

/* ------------------------------------------------------------- animation -- */

let spin = 0
let smoothX = 0
let smoothY = 0

const { onBeforeRender } = useLoop()

onBeforeRender(({ delta }) => {
  // Clamped for the same reason as NoiseBlob: SceneRenderGate pauses the loop
  // off-screen and THREE.Timer hands back one enormous delta on resume.
  const dt = Math.min(delta, 1 / 30)
  spin += dt * props.speed

  const group = outer.value
  const inner = spinner.value
  if (!group || !inner) return

  inner.rotation.y = spin

  // Ease the pointer so the ring leans towards the cursor, like the blob does.
  const ease = 1 - Math.exp(-3 * dt)
  smoothX += (props.pointer.x - smoothX) * ease
  smoothY += (props.pointer.y - smoothY) * ease

  const tiltRad = (props.tilt * Math.PI) / 180
  group.rotation.x = tiltRad + smoothY * 0.18
  group.rotation.z = smoothX * 0.1

  // Track the blob exactly — same offsets, same scroll response, same scale.
  group.position.x = props.offsetX
  group.position.y = props.offsetY + props.scroll * 0.8
  group.position.z = -props.scroll * 3

  const scale = props.sizeScale * (1 - props.scroll * 0.35)
  group.scale.setScalar(Math.max(0.2, scale))
})
</script>

<template>
  <TresGroup ref="outer">
    <TresGroup ref="spinner">
      <TresMesh
        v-for="(panel, i) in panels"
        :key="i"
      >
        <primitive :object="panel.geometry" attach="geometry" />
        <!--
          MeshBasicMaterial is UNLIT — it shows the texture's true colours
          rather than tinting them with scene lighting. That is what you want
          for photographs; a MeshStandardMaterial would darken them wherever the
          ring faces away from the light.

          DoubleSide so the far half of the ring is still drawn as it swings
          past, instead of being back-face culled and popping in and out.
        -->
        <TresMeshBasicMaterial
          :map="panel.texture"
          :side="THREE.DoubleSide"
          :transparent="true"
          :opacity="0.95"
          :tone-mapped="false"
        />
      </TresMesh>
    </TresGroup>
  </TresGroup>
</template>
