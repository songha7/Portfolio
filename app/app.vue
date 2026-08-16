<script setup lang="ts">
import { seo } from '~/data/site'

/**
 * app.vue is the root of the whole application — it wraps every layout and
 * every page. Anything that must exist site-wide and never remount on
 * navigation belongs here: the preloader, the custom cursor, the grain overlay.
 *
 * (If you put the cursor inside a layout instead, it would be destroyed and
 * rebuilt on every route change, losing its position mid-move.)
 */

// Site-wide SEO defaults. Individual pages override these with their own
// useSeoMeta() call — later calls win, so pages do not need to repeat anything.
useSeoMeta({
  titleTemplate: (title) => (title ? `${title} — ${seo.title}` : seo.title),
  description: seo.description,
  ogTitle: seo.title,
  ogDescription: seo.description,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: seo.title,
  twitterDescription: seo.description,
})

/**
 * Toast placement.
 *
 * Bottom-right is right on a wide screen — it stays out of the reading column.
 * On a phone there is no "right": the toast spans almost the full width anyway,
 * so anchoring it to a corner just looks off-centre. Bottom-centre reads as
 * deliberate, and sits where the thumb already is.
 *
 * `useMediaQuery` is SSR-safe (false on the server, correct after hydration),
 * which matters because this renders inside the server-rendered shell.
 */
const isMobile = useMediaQuery('(max-width: 639px)')
const toastPosition = computed(() =>
  isMobile.value ? ('bottom-center' as const) : ('bottom-right' as const),
)
</script>

<template>
  <div>
    <!-- Announces route changes to screen readers, which otherwise get no
         signal that the page content was replaced. Nuxt provides it built-in. -->
    <NuxtRouteAnnouncer />

    <!-- Skip link: the first thing a keyboard user tabs to. Without it they
         must tab through the entire header on every page. -->
    <a href="#main" class="sr-only-focusable glass rounded-lg px-4 py-2 text-sm font-medium">
      Skip to content
    </a>

    <PreloaderScreen />
    <CustomCursor />

    <!-- Film grain over everything. Purely decorative, hence aria-hidden. -->
    <div class="grain-overlay" aria-hidden="true" />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Toast host. It must live at the root so a toast fired from any page
         survives navigation and is never clipped by a parent's overflow. -->
    <!-- `offset` lifts the stack clear of the iPhone home indicator; on a
         device without one the inset is 0 and this is the plain 16px. -->
    <Toaster
      :position="toastPosition"
      :duration="4500"
      :offset="'calc(1rem + env(safe-area-inset-bottom))'"
      close-button
    />
  </div>
</template>
