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
  /**
   * Seconds the card takes to catch up to the pointer.
   *
   * This is the "weight" dial. Because `quickTo` retargets a running tween on
   * every mouse move, a SHORT duration means the card tracks your cursor almost
   * 1:1 and feels twitchy; a LONGER one makes it lag slightly behind and read as
   * a heavy physical object. Below ~0.6 it starts to flick.
   */
  smoothing?: number
  /**
   * Seconds of hovering before the tilt reaches full strength.
   *
   * This is what separates an accidental brush from a deliberate hover. The
   * effect is scaled by a value ramping 0 -> 1 over this window, so clipping
   * the edge of the card in passing barely moves it, while resting on it gives
   * the full effect. Set to 0 to react instantly to any contact.
   */
  engage?: number
  /**
   * Tailwind radius utility to clip the card to, e.g. `'rounded-2xl'`. Pass
   * the SAME value the slotted content uses for its own rounded corners.
   *
   * WHY THIS IS A PROP RATHER THAN SOMETHING THE SLOT HANDLES ITSELF: the
   * glare highlight below is a SIBLING of `<slot />`, not a child of it — it
   * has to cover the whole card regardless of what markup the slot contains.
   * That means it can never pick up a radius the slot's own content sets on
   * itself; `border-radius: inherit` (the previous approach) only reaches a
   * direct parent's computed value, and the direct parent here (`card`) had
   * no radius of its own. The visible bug was a squared-off white glow
   * poking past the photo's rounded corners right at the edge of a hover.
   *
   * Applying the SAME class to `card` and the glare guarantees pixel-perfect
   * agreement, and it also fixes a second bug for free: rounding + clipping
   * the element that directly receives the 3D rotation (rather than a nested
   * child two levels down) sidesteps the Chrome/Safari quirk where
   * `border-radius` + `overflow-hidden` stop being respected on a *child* of
   * a live 3D-transformed ancestor — corners would square off mid-tilt.
   */
  radius?: string
}

const props = withDefaults(defineProps<Props>(), {
  max: 9,
  lift: 24,
  glare: true,
  perspective: 1000,
  // With the engagement ramp below absorbing accidental contact, the follow
  // itself can stay reasonably responsive for a deliberate hover.
  smoothing: 0.7,
  engage: 0.45,
  radius: '',
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

  // Pre-compiled setters, created ONCE and reused on every move. Each of these
  // is a single tween whose target value gets retargeted — not a new tween per
  // event. That distinction is the whole reason this stays smooth.
  //
  // EASE CHOICE MATTERS AS MUCH AS DURATION.
  // `power3.out` is extremely front-loaded — it covers ~49% of the distance in
  // the first 100ms, so the card snaps to full tilt the moment the pointer
  // touches it and then crawls the remainder. That is what reads as "flicking".
  // `power2.out` is far gentler off the mark (~21% in the same 100ms), which
  // gives the card the sense of being pushed rather than yanked.
  const follow = { duration: props.smoothing, ease: 'power2.out' }
  const rotX = gsap.quickTo(target, 'rotationX', follow)
  const rotY = gsap.quickTo(target, 'rotationY', follow)
  // The lift is a single 0 -> `lift` move on entry, so it gets a touch longer
  // still; a fast Z pop is the most noticeable part of an abrupt entrance.
  const zTo = gsap.quickTo(target, 'z', {
    duration: props.smoothing * 1.2,
    ease: 'power2.out',
  })
  const glareFade = glareEl.value
    ? gsap.quickTo(glareEl.value, 'opacity', { duration: 0.5, ease: 'power2.out' })
    : null

  /**
   * The return-to-flat tween, held so `onMove` can cancel it.
   *
   * WHY THIS IS NECESSARY: GSAP's default `overwrite` is `false`, so two tweens
   * touching the same property both keep writing to it every frame and the
   * result is whichever wrote last. Leaving the card starts a 1.1s elastic
   * tween on rotationX/Y/z; sweep the pointer back in before it finishes and it
   * is still running, fighting the quickTo setters above. The card then looks
   * frozen or jittery — and the faster you move, the more often you land inside
   * that 1.1s window. Killing it explicitly hands control cleanly back to the
   * pointer.
   */
  let leaveTween: gsap.core.Tween | null = null

  /**
   * ENGAGEMENT — the fix for "I brushed the card and it lurched".
   *
   * THE FLAW THIS SOLVES
   * Tilt strength is a function of pointer POSITION, and it peaks at the card's
   * edges (px = ±0.5). So the lightest possible contact — clipping an edge or a
   * corner on the way somewhere else — is precisely the input that commands
   * maximum tilt, on both axes at once. Speed tuning cannot fix that; the card
   * was being *told* to slam over.
   *
   * THE FIX
   * Multiply the whole effect by a strength value that ramps 0 -> 1 over
   * `engage` seconds after the pointer arrives. Now the card responds to
   * INTENT rather than mere contact:
   *   - a ~150ms accidental graze only ever reaches ~35% strength — a slight
   *     stir, not a lurch
   *   - a deliberate hover passes 0.45s and reaches the full effect
   * Leaving resets it to 0, so every fresh approach ramps again.
   */
  const engage = { v: 0 }
  /** Last known pointer position, in the -0.5..0.5 unit range. */
  let lastPx = 0
  let lastPy = 0
  let pointerInside = false

  /**
   * Push the current pointer position and engagement strength to the card.
   * Called both on mousemove AND from the ramp tween's onUpdate — the latter
   * matters because if you enter and hold perfectly still, no further
   * mousemove fires and the card would otherwise freeze at partial strength.
   */
  const applyTilt = () => {
    const s = engage.v
    rotY(lastPx * props.max * 2 * s)
    rotX(-lastPy * props.max * 2 * s) // note the minus — see the comment above
    zTo(props.lift * s)
    glareFade?.(0.5 * s)
  }

  const onEnter = () => {
    if (pointerInside) return
    pointerInside = true
    // Take back control from the return animation, if one is still playing.
    leaveTween?.kill()
    leaveTween = null
    gsap.killTweensOf(engage)
    gsap.to(engage, {
      v: 1,
      duration: props.engage,
      // `inOut`, NOT `out`. This ramp needs the opposite shape to the follow
      // tween: slow to commit at the start, so a brief graze accumulates almost
      // no strength, then catching up smoothly for a real hover. An `out` ease
      // here is front-loaded and reaches ~53% within 100ms, which defeats the
      // whole point. With inOut a 150ms brush reaches only ~22%.
      ease: 'power2.inOut',
      onUpdate: applyTilt,
    })
  }

  const onMove = (e: MouseEvent) => {
    // Safety net: if mouseenter was missed (it can be, when an element is
    // inserted under a stationary cursor), start the ramp from here.
    if (!pointerInside) onEnter()

    const rect = node.getBoundingClientRect()
    // Normalise the pointer to -0.5 .. +0.5 across the card. Working in a
    // unit range keeps the maths independent of the card's actual size.
    lastPx = (e.clientX - rect.left) / rect.width - 0.5
    lastPy = (e.clientY - rect.top) / rect.height - 0.5

    applyTilt()

    // Move the glare to follow the pointer, like a reflection sliding across a
    // glossy surface.
    //
    // The two positions are written STRAIGHT to the element rather than tweened.
    // A `gsap.to()` here would allocate a fresh tween on every mousemove —
    // around 60 a second, each living 0.4s, so ~24 of them stacked on one
    // element all animating the same two properties. That pile-up is what made
    // this card stop responding when the pointer moved quickly. The position
    // needs no easing anyway: the card's own tilt is already eased, so the
    // highlight tracking the cursor exactly reads as correct. (Its opacity IS
    // eased, and scales with engagement, inside `applyTilt`.)
    if (props.glare && glareEl.value) {
      const style = glareEl.value.style
      // Convert the -0.5..0.5 range into a 0%..100% gradient position.
      style.setProperty('--glare-x', `${(lastPx + 0.5) * 100}%`)
      style.setProperty('--glare-y', `${(lastPy + 0.5) * 100}%`)
    }
  }

  const onLeave = () => {
    pointerInside = false
    // Reset engagement so the NEXT approach has to earn full strength again.
    // Without this, a graze followed by a second graze would start at full tilt.
    gsap.killTweensOf(engage)
    engage.v = 0

    // Return to flat. A slight elastic makes it feel like a physical object
    // settling rather than a value being reset.
    leaveTween = gsap.to(target, {
      rotationX: 0,
      rotationY: 0,
      z: 0,
      duration: 1.2,
      // elastic.out(amplitude, period). RAISING the period softens it: 0.5
      // gives several visible bounces, 0.7 settles in roughly one gentle
      // overshoot. With the gentler entry above, the old springier value read
      // as inconsistent — the card arrived calmly and then boinged on the way out.
      ease: 'elastic.out(1, 0.7)',
      // Clear the reference once it finishes so `onMove` never kills a tween
      // that has already completed.
      onComplete: () => {
        leaveTween = null
      },
    })
    // Reuses the same quickTo as the hover state, so fading out can never end
    // up fighting a fade-in.
    glareFade?.(0)
  }

  node.addEventListener('mouseenter', onEnter)
  node.addEventListener('mousemove', onMove)
  node.addEventListener('mouseleave', onLeave)

  onUnmounted(() => {
    node.removeEventListener('mouseenter', onEnter)
    node.removeEventListener('mousemove', onMove)
    node.removeEventListener('mouseleave', onLeave)
    gsap.killTweensOf(engage)
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
      :class="['relative h-full overflow-hidden will-change-transform', radius]"
      style="transform-style: preserve-3d"
    >
      <slot />

      <!-- The specular highlight. A radial gradient whose centre is driven by
           two CSS custom properties that GSAP animates. `mix-blend-mode` makes
           it brighten what is underneath rather than washing it out. Same
           `radius` class as `card` above — see the prop comment for why this
           can't just inherit it. -->
      <div
        v-if="glare"
        ref="glareEl"
        aria-hidden="true"
        :class="['pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light', radius]"
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
