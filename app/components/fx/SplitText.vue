<script setup lang="ts">
/**
 * SplitText — breaks a string into per-character or per-word <span>s so each
 * piece can be animated separately.
 *
 * WHY: you cannot animate "the third letter" of a text node. The browser has no
 * handle on it. By rendering every character inside its own inline-block span,
 * GSAP suddenly has 40 targets it can stagger.
 *
 * THE MASK TRICK: each word sits inside a wrapper with `overflow: hidden`.
 * Animating the inner span from `y: 110%` makes the letters appear to rise out
 * of a solid edge instead of just fading in. That single detail is most of what
 * makes agency sites feel expensive.
 *
 * ACCESSIBILITY: a screen reader hitting 40 separate spans reads
 * "F. u. l. l. s. t. a. c. k." — awful. So the split output is `aria-hidden`
 * and the real text is exposed once via an `aria-label` on the wrapper.
 *
 * USAGE
 *   <SplitText text="Hello world" class="text-6xl" />
 *   then in GSAP:  gsap.from('.split-char', { yPercent: 110, stagger: 0.02 })
 */

interface Props {
  text: string
  /** Which HTML tag to render as the outer element. */
  as?: string
  /** Split into individual letters, or whole words. */
  type?: 'chars' | 'words'
  /** Extra classes applied to every character/word span. */
  partClass?: string
  /** Turn off the overflow-hidden mask (needed for letters with descenders
   *  when you are animating opacity rather than position). */
  masked?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  as: 'span',
  type: 'chars',
  partClass: '',
  masked: true,
})

/**
 * Split into words first, always. Even in `chars` mode we keep words grouped so
 * a word never breaks across two lines mid-letter.
 * The filter removes the empty strings that split() leaves around spaces.
 */
const words = computed(() =>
  props.text.split(' ').filter((w) => w.length > 0),
)
</script>

<template>
  <component
    :is="as"
    :aria-label="text"
    class="split-root inline-block"
  >
    <!-- aria-hidden: the visual pieces are decorative; the label above is the
         accessible text. -->
    <template v-for="(word, wordIndex) in words" :key="`${word}-${wordIndex}`">
      <span
        aria-hidden="true"
        class="split-word-mask inline-block align-top"
        :class="
          masked
            ? // The negative margin cancels the padding, so the extra room for
              // descenders (g, y, p) costs no layout height. Without it,
              // overflow-hidden slices the tail off every 'g'.
              'overflow-hidden pb-[0.14em] -mb-[0.14em]'
            : ''
        "
      >
        <!-- WORDS MODE: one animatable span per word -->
        <span
          v-if="type === 'words'"
          class="split-word inline-block will-change-transform"
          :class="partClass"
        >{{ word }}</span>

        <!-- CHARS MODE: one animatable span per letter -->
        <template v-else>
          <span
            v-for="(char, charIndex) in word.split('')"
            :key="charIndex"
            class="split-char inline-block will-change-transform"
            :class="partClass"
          >{{ char }}</span>
        </template>
      </span>

      <!--
        The space between words. Two separate traps here, both of which render
        "Full-stack Engineer" as "Full-stackEngineer":

        1. The space must live BETWEEN the masks, never inside one. An
           `overflow: hidden` inline-block is its own formatting context and
           collapses a trailing space away.

        2. It must be written as `{{ ' ' }}`, not as a literal space in the
           markup. Vue's template compiler runs in "condense" mode and deletes
           whitespace-only text nodes between elements — a literal space here
           silently never reaches the DOM. An interpolation is real content, so
           it survives. (`whitespace-pre` then stops the *browser* collapsing it.)
      -->
      <span
        v-if="wordIndex < words.length - 1"
        aria-hidden="true"
        class="whitespace-pre"
      >{{ ' ' }}</span>
    </template>
  </component>
</template>
