<script setup lang="ts">
import * as THREE from 'three'
import { RotateCcw } from '@lucide/vue'
import { labItems } from '~/data/site'

/**
 * /playground — a live shader lab.
 *
 * This page is the reason the blob's parameters are props rather than
 * hard-coded constants: every slider below writes straight into a GLSL uniform,
 * and you see the change on the next frame. It is by far the fastest way to
 * build an intuition for what each number in a shader actually controls.
 *
 * Try this order:
 *   1. Turn WIREFRAME on — now you can see the actual triangles being moved.
 *   2. Push DISPLACE up. Watch the geometry stretch along each vertex's radius.
 *   3. Push NOISE SCALE up. Same displacement, but far more lumps.
 *   4. Drop FRESNEL to 1. The rim light floods the whole surface.
 */

useSeoMeta({
  title: 'Playground',
  description:
    'A live GLSL shader lab — drag the sliders and watch the uniforms change in real time.',
})

/** The defaults, kept separate so "reset" has something to restore. */
const DEFAULTS = {
  noiseScale: 0.55,
  displace: 0.24,
  fresnelPower: 2.6,
  speed: 1,
  detail: 48,
  wireframe: false,
}

const controls = reactive({ ...DEFAULTS })

function reset() {
  Object.assign(controls, DEFAULTS)
}

/** Slider definitions — declared as data so the markup stays a single loop. */
const sliders = [
  {
    key: 'noiseScale' as const,
    label: 'Noise scale',
    min: 0.1,
    max: 2.5,
    step: 0.05,
    hint: 'Frequency of the noise field. Low = a few big lazy lumps. High = crumpled foil.',
  },
  {
    key: 'displace' as const,
    label: 'Displacement',
    min: 0,
    max: 0.8,
    step: 0.01,
    hint: 'How far each vertex is pushed along its own radius. At 0 you get a plain sphere.',
  },
  {
    key: 'fresnelPower' as const,
    label: 'Fresnel power',
    min: 0.5,
    max: 8,
    step: 0.1,
    hint: 'Tightness of the rim light. 1 washes the whole surface, 8 leaves a thin bright edge.',
  },
  {
    key: 'speed' as const,
    label: 'Speed',
    min: 0,
    max: 3,
    step: 0.05,
    hint: 'Multiplier on the shader clock. At 0 the surface freezes — handy for inspecting a shape.',
  },
  {
    key: 'detail' as const,
    label: 'Geometry detail',
    min: 4,
    max: 80,
    step: 4,
    hint: 'Subdivision level of the icosahedron. Below ~20 you can see the polygons.',
  },
]

/** Roughly how many triangles the current detail level produces. */
const triangleCount = computed(() => (20 * controls.detail ** 2).toLocaleString())

/** See the note in HeroCanvas.vue — TresJS's types want a real Vector3. */
const cameraPosition = new THREE.Vector3(0, 0, 4.6)
</script>

<template>
  <div class="pt-28 pb-24 sm:pt-32">
    <div class="mx-auto max-w-350 px-5 sm:px-8 lg:px-12">
      <SectionHeading
        index="Lab"
        label="Playground"
        title="Pull the levers,"
        accent="break something."
        description="Every slider writes directly into a GLSL uniform on the mesh below. Nothing is pre-rendered — you are editing the shader as it runs."
      />

      <!-- ------------------------------------------------- the live canvas -->
      <div class="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-12">
        <div class="lg:col-span-7">
          <div class="border-border/70 relative aspect-square overflow-hidden rounded-3xl border sm:aspect-4/3">
            <div
              class="absolute inset-0"
              style="background: radial-gradient(circle at 50% 45%, color-mix(in oklch, var(--brand) 7%, transparent), transparent 70%), var(--card)"
            />
            <div class="bg-grid absolute inset-0 opacity-40" />

            <!-- ClientOnly: WebGL does not exist during server rendering. -->
            <ClientOnly>
              <TresCanvas
                :alpha="true"
                :antialias="true"
                clear-color="#000000"
                :clear-alpha="0"
                render-mode="always"
                class="absolute! inset-0"
              >
                <TresPerspectiveCamera :position="cameraPosition" :fov="42" />
                <NoiseBlob
                  :radius="1.3"
                  :detail="controls.detail"
                  :noise-scale="controls.noiseScale"
                  :displace="controls.displace"
                  :fresnel-power="controls.fresnelPower"
                  :speed="controls.speed"
                  :wireframe="controls.wireframe"
                />
              </TresCanvas>

              <template #fallback>
                <div class="text-muted-foreground absolute inset-0 flex items-center justify-center font-mono text-xs">
                  Starting WebGL…
                </div>
              </template>
            </ClientOnly>

            <!-- Live readout -->
            <div class="text-muted-foreground pointer-events-none absolute bottom-4 left-4 font-mono text-[10px] tracking-widest uppercase">
              {{ triangleCount }} tris · icosahedron
            </div>
          </div>
        </div>

        <!-- ---------------------------------------------------- the controls -->
        <div class="lg:col-span-5">
          <div class="glass border-border/70 rounded-3xl border p-6 sm:p-8">
            <div class="mb-6 flex items-center justify-between">
              <h2 class="font-mono text-[11px] tracking-[0.25em] uppercase">Uniforms</h2>
              <Button variant="ghost" size="sm" class="gap-2 text-xs" @click="reset">
                <RotateCcw class="size-3" />
                Reset
              </Button>
            </div>

            <div class="space-y-7">
              <div v-for="slider in sliders" :key="slider.key">
                <div class="mb-2 flex items-baseline justify-between gap-3">
                  <label :for="slider.key" class="text-sm">{{ slider.label }}</label>
                  <output :for="slider.key" class="text-brand font-mono text-xs tabular-nums">
                    {{ controls[slider.key] }}
                  </output>
                </div>

                <!-- A native range input: fully accessible by keyboard out of the
                     box, and `accent-color` is all it takes to brand it. -->
                <input
                  :id="slider.key"
                  v-model.number="controls[slider.key]"
                  type="range"
                  :min="slider.min"
                  :max="slider.max"
                  :step="slider.step"
                  class="accent-brand h-1 w-full cursor-pointer appearance-none rounded-full"
                  style="background: color-mix(in oklch, var(--foreground) 15%, transparent)"
                >

                <p class="text-muted-foreground mt-2 text-xs leading-relaxed">
                  {{ slider.hint }}
                </p>
              </div>

              <!-- Wireframe toggle -->
              <div class="border-border/60 flex items-start justify-between gap-4 border-t pt-6">
                <div>
                  <label for="wireframe" class="text-sm">Wireframe</label>
                  <p class="text-muted-foreground mt-1 text-xs leading-relaxed">
                    Draw the triangles instead of the surface. This is what the vertex shader is actually moving.
                  </p>
                </div>
                <input
                  id="wireframe"
                  v-model="controls.wireframe"
                  type="checkbox"
                  class="accent-brand mt-1 size-4 shrink-0 cursor-pointer"
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ------------------------------------------------------ other bits -->
      <div class="mt-24">
        <h2 class="font-serif text-3xl tracking-tight">Other things I keep poking at</h2>
        <p class="text-muted-foreground mt-3 max-w-xl leading-relaxed">
          Unfinished experiments, mostly. This is where techniques get tested before they earn a place in real work.
        </p>

        <RevealOnScroll
          :stagger="0.08"
          class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <article
            v-for="item in labItems"
            :key="item.title"
            class="group border-border/70 hover:border-brand/40 relative overflow-hidden rounded-2xl border p-6 transition-colors"
          >
            <div
              class="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style="background: radial-gradient(circle at 20% 0%, color-mix(in oklch, var(--brand) 12%, transparent), transparent 60%)"
              aria-hidden="true"
            />
            <div class="relative">
              <Badge variant="tech" class="mb-4">{{ item.kind }}</Badge>
              <h3 class="font-serif text-xl tracking-tight">{{ item.title }}</h3>
              <p class="text-muted-foreground mt-2 text-sm leading-relaxed">
                {{ item.description }}
              </p>
            </div>
          </article>
        </RevealOnScroll>
      </div>
    </div>
  </div>
</template>
