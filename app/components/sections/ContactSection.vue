<script setup lang="ts">
import { Check, Loader2, Send } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { profile, socials } from '~/data/site'

/**
 * Contact — a real, working form.
 *
 * It posts to `/api/contact`, a Nitro server route that lives in this same
 * project (see server/api/contact.post.ts). That is the "full-stack" part of
 * Nuxt: no separate backend, no CORS, and the endpoint is typed.
 *
 * VALIDATION HAPPENS TWICE, ON PURPOSE
 * Once here, so the visitor gets an instant answer, and again on the server,
 * because anyone can POST straight to the endpoint with curl. Client-side
 * validation is a convenience; server-side validation is the actual rule.
 */

const root = ref<HTMLElement | null>(null)

/** `reactive` suits a form: one object, mutated field by field. */
const form = reactive({
  name: '',
  email: '',
  message: '',
  /** Honeypot — see the note on the hidden field in the template. */
  company: '',
})

const errors = reactive<Record<string, string>>({})
const isSubmitting = ref(false)
const isSent = ref(false)

/**
 * Deliberately permissive. Strict email regexes reject valid addresses
 * (apostrophes, new TLDs, plus-addressing) far more often than they catch
 * typos. "Has an @ with something either side, and a dot after it" is enough —
 * the real test is whether the mail sends.
 */
function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validate() {
  // Clear previous errors so fixed fields stop showing stale messages.
  Object.keys(errors).forEach((key) => delete errors[key])

  if (form.name.trim().length < 2) errors.name = 'Please tell me your name.'
  if (!isValidEmail(form.email)) errors.email = 'That does not look like an email address.'
  if (form.message.trim().length < 10) errors.message = 'A little more detail would help.'

  return Object.keys(errors).length === 0
}

async function onSubmit() {
  if (!validate()) {
    toast.error('Some fields need attention.')
    return
  }

  isSubmitting.value = true

  try {
    // `$fetch` is Nuxt's built-in HTTP client. On the server it calls the
    // handler directly without a network round-trip; in the browser it is a
    // normal fetch with sensible defaults and automatic JSON parsing.
    await $fetch('/api/contact', {
      method: 'POST',
      body: { ...form },
    })

    isSent.value = true
    toast.success('Message sent.', {
      description: 'I read everything and usually reply within a day or two.',
    })

    form.name = ''
    form.email = ''
    form.message = ''
  } catch (error) {
    // `$fetch` throws on any non-2xx response. The server puts a readable
    // reason in `statusMessage`, so surface that rather than a generic failure.
    const message =
      (error as { statusMessage?: string })?.statusMessage ??
      'Something went wrong. Email me directly instead?'
    toast.error(message)
  } finally {
    // `finally` guarantees the button unlocks even if the request threw.
    isSubmitting.value = false
  }
}

// No bespoke GSAP here — the RevealOnScroll wrappers in the template handle the
// entrance, which is exactly what that component is for.
</script>

<template>
  <section id="contact" ref="root" class="relative overflow-hidden py-28 sm:py-36 lg:py-44">
    <!-- A warm glow anchoring the bottom of the page. -->
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-[60%]"
      aria-hidden="true"
      style="background: radial-gradient(ellipse 70% 100% at 50% 100%, color-mix(in oklch, var(--brand) 10%, transparent), transparent 70%)"
    />

    <div class="relative mx-auto max-w-350 px-5 sm:px-8 lg:px-12">
      <div class="grid gap-16 lg:grid-cols-12 lg:gap-20">
        <!-- ------------------------------------------------------- pitch -->
        <div class="lg:col-span-5">
          <SectionHeading
            index="06"
            label="Contact"
            title="Got something"
            accent="worth building?"
            description="Freelance projects, full-time roles, or a question about how something on this page works — all equally welcome."
          />

          <RevealOnScroll :stagger="0.08" class="mt-12 space-y-6">
            <div>
              <p class="text-muted-foreground font-mono text-[10px] tracking-[0.25em] uppercase">
                Email
              </p>
              <a
                :href="`mailto:${profile.email}`"
                class="hover:text-brand mt-2 block font-serif text-2xl break-all transition-colors sm:text-3xl"
                data-cursor-label="Copy"
              >
                {{ profile.email }}
              </a>
            </div>

            <div>
              <p class="text-muted-foreground font-mono text-[10px] tracking-[0.25em] uppercase">
                Elsewhere
              </p>
              <div class="mt-3 flex flex-wrap gap-2">
                <a
                  v-for="social in socials"
                  :key="social.href"
                  :href="social.href"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Badge variant="tech" class="px-3 py-1">{{ social.label }} ↗</Badge>
                </a>
              </div>
            </div>
          </RevealOnScroll>
        </div>

        <!-- -------------------------------------------------------- form -->
        <div class="lg:col-span-7">
          <RevealOnScroll direction="up">
            <form
              class="glass border-border/70 rounded-3xl border p-6 sm:p-10"
              novalidate
              @submit.prevent="onSubmit"
            >
              <!-- HONEYPOT.
                   A field a human never sees and never fills in. Bots fill every
                   input they find, so a non-empty value here is a near-certain
                   spam signal. `tabindex="-1"` and `aria-hidden` keep it away
                   from keyboard and screen-reader users. -->
              <div class="absolute left-[-9999px]" aria-hidden="true">
                <label for="company">Company (leave blank)</label>
                <input
                  id="company"
                  v-model="form.company"
                  type="text"
                  tabindex="-1"
                  autocomplete="off"
                >
              </div>

              <div class="grid gap-6 sm:grid-cols-2">
                <div>
                  <label for="name" class="mb-2 block font-mono text-[10px] tracking-[0.2em] uppercase">
                    Your name
                  </label>
                  <Input
                    id="name"
                    v-model="form.name"
                    name="name"
                    placeholder="Ada Lovelace"
                    autocomplete="name"
                    :aria-invalid="Boolean(errors.name)"
                    :aria-describedby="errors.name ? 'name-error' : undefined"
                    class="h-12 rounded-xl"
                  />
                  <!-- role="alert" makes screen readers announce the error the
                       moment it appears, without moving focus. -->
                  <p v-if="errors.name" id="name-error" role="alert" class="text-destructive mt-2 text-xs">
                    {{ errors.name }}
                  </p>
                </div>

                <div>
                  <label for="email" class="mb-2 block font-mono text-[10px] tracking-[0.2em] uppercase">
                    Email
                  </label>
                  <Input
                    id="email"
                    v-model="form.email"
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    autocomplete="email"
                    :aria-invalid="Boolean(errors.email)"
                    :aria-describedby="errors.email ? 'email-error' : undefined"
                    class="h-12 rounded-xl"
                  />
                  <p v-if="errors.email" id="email-error" role="alert" class="text-destructive mt-2 text-xs">
                    {{ errors.email }}
                  </p>
                </div>
              </div>

              <div class="mt-6">
                <label for="message" class="mb-2 block font-mono text-[10px] tracking-[0.2em] uppercase">
                  Message
                </label>
                <Textarea
                  id="message"
                  v-model="form.message"
                  name="message"
                  rows="6"
                  placeholder="What are you building, and where are you stuck?"
                  :aria-invalid="Boolean(errors.message)"
                  :aria-describedby="errors.message ? 'message-error' : undefined"
                  class="resize-none rounded-xl"
                />
                <div class="mt-2 flex items-start justify-between gap-4">
                  <p v-if="errors.message" id="message-error" role="alert" class="text-destructive text-xs">
                    {{ errors.message }}
                  </p>
                  <span class="text-muted-foreground ml-auto font-mono text-[10px] tabular-nums">
                    {{ form.message.length }} / 2000
                  </span>
                </div>
              </div>

              <div class="mt-8 flex flex-wrap items-center gap-4">
                <Button
                  type="submit"
                  variant="brand"
                  size="pill"
                  :disabled="isSubmitting"
                  class="min-w-44"
                >
                  <!-- Three visual states in one button: idle, in-flight, done.
                       Swapping the label is what tells someone the click landed. -->
                  <template v-if="isSubmitting">
                    <Loader2 class="size-4 animate-spin" />
                    Sending
                  </template>
                  <template v-else-if="isSent">
                    <Check class="size-4" />
                    Sent — send another?
                  </template>
                  <template v-else>
                    Send message
                    <Send class="size-4" />
                  </template>
                </Button>

                <p class="text-muted-foreground text-xs">
                  Or just email me. I do not mind which.
                </p>
              </div>
            </form>
          </RevealOnScroll>
        </div>
      </div>
    </div>
  </section>
</template>
