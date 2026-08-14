<script setup lang="ts">
/**
 * The default layout: header, page content, footer.
 *
 * Nuxt applies this to every page automatically. A page can opt out or choose
 * another with `definePageMeta({ layout: 'other' })`.
 */
</script>

<template>
  <div class="relative min-h-screen">
    <ScrollProgressBar />
    <SiteHeader />

    <!-- `id="main"` is the target of the skip link in app.vue. -->
    <main id="main">
      <slot />
    </main>

    <SiteFooter />
  </div>
</template>
