<script setup lang="ts">
/**
 * The default layout: header, page content, footer.
 *
 * Nuxt applies this to every page automatically. A page can opt out or choose
 * another with `definePageMeta({ layout: 'other' })`.
 */
</script>

<template>
  <!--
    `100dvh`, not `min-h-screen` (which is 100vh).

    On iOS Safari `100vh` is the height of the viewport with the address bar
    HIDDEN — a value the page never actually has when it first loads. Using it
    makes every page taller than the visible area, so even an empty page can be
    scrolled a little, and the footer sits below the fold for no reason.
    `dvh` is the *dynamic* viewport height: it tracks the address bar as it
    collapses, so the number is always the space really available.
  -->
  <div class="relative min-h-dvh">
    <ScrollProgressBar />
    <SiteHeader />

    <!-- `id="main"` is the target of the skip link in app.vue. -->
    <main id="main">
      <slot />
    </main>

    <SiteFooter />
  </div>
</template>
