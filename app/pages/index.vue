<script setup lang="ts">
import { seo } from '~/data/site'

/**
 * The home page. Each section is its own component so this file stays a
 * readable table of contents for the whole experience.
 *
 * The scroll axis changes deliberately as you move down:
 *   Hero        — vertical, with depth (3D + parallax)
 *   About       — vertical, scroll-driven text reveal
 *   Skills      — HORIZONTAL, skewed marquees running against each other
 *   Work        — HORIZONTAL, pinned panel scrolling sideways
 *   Process     — DEPTH, pinned cards stacking towards the viewer
 *   Experience  — vertical, with a drawing progress line
 *   Contact     — vertical, settling back to calm
 *
 * Changing axis is what stops a long page from feeling like one endless column.
 */

useSeoMeta({
  title: '',
  description: seo.description,
})
</script>

<template>
  <div>
    <HeroSection />
    <AboutSection />
    <SkillsSection />
    <WorkSection />
    <ProcessSection />
    <ExperienceSection />
    <ContactSection />
  </div>
</template>
