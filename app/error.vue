<script setup lang="ts">
import type { NuxtError } from '#app'
import { ArrowLeft } from '@lucide/vue'

/**
 * error.vue replaces the ENTIRE app when an unhandled error is thrown —
 * it sits outside layouts, so the header and footer are gone. That is why the
 * "back home" link below matters: without it there is no way out.
 *
 * `clearError({ redirect })` resets the error state and navigates. Using a
 * plain <NuxtLink> instead would leave the error state set and immediately
 * re-render this page.
 */

defineProps<{ error: NuxtError }>()

useSeoMeta({ title: 'Page not found', robots: 'noindex' })
</script>

<template>
  <div class="bg-background text-foreground relative flex min-h-screen items-center overflow-hidden">
    <!-- Same visual language as the hero, so a 404 still feels like the site. -->
    <div class="bg-grid mask-radial-fade absolute inset-0 opacity-50" aria-hidden="true" />
    <div
      class="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style="background: radial-gradient(ellipse 60% 50% at 50% 40%, color-mix(in oklch, var(--brand) 10%, transparent), transparent 70%)"
    />

    <div class="relative mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12">
      <p class="text-brand font-mono text-[11px] tracking-[0.3em] uppercase">
        Error {{ error?.statusCode ?? 500 }}
      </p>

      <h1 class="mt-6 font-serif text-[clamp(3rem,12vw,9rem)] leading-[0.85] tracking-[-0.04em]">
        Nothing<br >
        <em class="text-gradient not-italic italic">here.</em>
      </h1>

      <p class="text-muted-foreground mt-8 max-w-md leading-relaxed">
        {{
          error?.statusCode === 404
            ? 'That page does not exist — or it did once and I moved it. Either way, this is on me.'
            : 'Something broke on my end. Refreshing sometimes helps; if not, please tell me.'
        }}
      </p>

      <!-- The real reason for the failure, kept small. Useful when someone
           screenshots it for you, harmless otherwise. -->
      <p v-if="error?.statusMessage" class="text-muted-foreground/60 mt-3 font-mono text-xs">
        {{ error.statusMessage }}
      </p>

      <div class="mt-10 flex flex-wrap gap-3">
        <Button variant="brand" size="pill" @click="clearError({ redirect: '/' })">
          <ArrowLeft class="size-4" />
          Back to the start
        </Button>
        <Button variant="hairline" size="pill" @click="clearError({ redirect: '/work' })">
          See the work instead
        </Button>
      </div>
    </div>
  </div>
</template>
