<script setup lang="ts">
/**
 * The shared section header: a numbered label, a big serif title, and an
 * optional supporting line.
 *
 * Keeping this in one component is what makes seven different sections feel
 * like one website. The moment you hand-roll each heading, the spacing drifts
 * and the page starts to look assembled rather than designed.
 */

interface Props {
  /** The small monospace index, e.g. "02". */
  index?: string
  /** The kicker above the title. */
  label: string
  title: string
  /** Optional italic serif fragment appended to the title. */
  accent?: string
  description?: string
  align?: 'left' | 'center'
}

withDefaults(defineProps<Props>(), {
  index: '',
  accent: '',
  description: '',
  align: 'left',
})
</script>

<template>
  <RevealOnScroll :stagger="0.09" :class="align === 'center' ? 'text-center' : ''">
    <!-- Kicker row -->
    <div
      class="mb-6 flex items-center gap-3"
      :class="align === 'center' ? 'justify-center' : ''"
    >
      <span v-if="index" class="text-brand font-mono text-[11px] tracking-[0.3em]">
        {{ index }}
      </span>
      <span class="bg-border h-px w-8" aria-hidden="true" />
      <span class="text-muted-foreground font-mono text-[11px] tracking-[0.3em] uppercase">
        {{ label }}
      </span>
    </div>

    <!-- Title. Mixing an upright serif with an italic fragment gives the page
         a voice without needing a second typeface. -->
    <h2 class="font-serif text-[clamp(2.2rem,6vw,4.5rem)] leading-[0.95] tracking-[-0.02em]">
      {{ title }}
      <em v-if="accent" class="text-gradient not-italic italic">{{ accent }}</em>
    </h2>

    <p
      v-if="description"
      class="text-muted-foreground mt-6 max-w-xl text-base leading-relaxed"
      :class="align === 'center' ? 'mx-auto' : ''"
    >
      {{ description }}
    </p>
  </RevealOnScroll>
</template>
