/**
 * POST /api/contact — the contact form's backend.
 *
 * This is a Nitro server route. The filename is the contract:
 *   server/api/contact.post.ts  ->  POST /api/contact
 * A `.get.ts` file would handle GET on the same path. No router config, no
 * Express app — Nuxt's server engine wires it up from the path alone.
 *
 * This code runs ONLY on the server. Secrets read here (an API key, a database
 * URL) are never sent to the browser, which is the whole reason to put form
 * handling in a server route instead of calling a third-party API from the
 * component.
 *
 * WHAT IT DOES TODAY: validates, rate-limits, and logs the message to your
 * terminal. Wiring up real delivery is a few lines — see the note at the bottom.
 */

interface ContactBody {
  name?: string
  email?: string
  message?: string
  /** Honeypot field — must be empty. */
  company?: string
}

/* -------------------------------------------------------------------------- */
/*  Rate limiting                                                             */
/* -------------------------------------------------------------------------- */

/**
 * A Map of IP -> recent request timestamps.
 *
 * HONEST LIMITATION: this lives in the memory of one server process. It resets
 * on redeploy and does not work across multiple instances or on serverless
 * platforms where each request may get a fresh container. For a portfolio
 * contact form that is fine — it stops a naive script hammering the endpoint.
 * For anything that matters, put this in Redis or use your platform's built-in
 * rate limiting.
 */
const requestLog = new Map<string, number[]>()

const RATE_LIMIT = 3 // messages…
const RATE_WINDOW_MS = 10 * 60 * 1000 // …per 10 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  // Keep only the timestamps still inside the window.
  const recent = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS)

  if (recent.length >= RATE_LIMIT) {
    requestLog.set(ip, recent)
    return true
  }

  recent.push(now)
  requestLog.set(ip, recent)

  // Stop the Map growing without bound on a long-running server.
  if (requestLog.size > 5000) {
    for (const [key, times] of requestLog) {
      if (times.every((t) => now - t > RATE_WINDOW_MS)) requestLog.delete(key)
    }
  }

  return false
}

/* -------------------------------------------------------------------------- */

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default defineEventHandler(async (event) => {
  // `readBody` parses JSON (or form data) from the request.
  const body = await readBody<ContactBody>(event)

  // `getRequestIP` understands proxy headers like X-Forwarded-For, which is
  // what you actually get behind Vercel/Netlify/nginx.
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'

  if (isRateLimited(ip)) {
    // 429 is the correct status for "slow down".
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many messages. Please try again a little later.',
    })
  }

  /* --- Honeypot ----------------------------------------------------------
     A real person never sees the `company` field, so they never fill it.
     Bots fill everything. We return 200 rather than an error on purpose:
     telling a bot it was detected just teaches whoever wrote it to adapt. */
  if (body.company) {
    console.warn(`[contact] honeypot triggered from ${ip}`)
    return { ok: true }
  }

  /* --- Validation --------------------------------------------------------
     Repeating the client-side checks, because anyone can POST here directly
     with curl. Client validation is UX; server validation is the rule. */
  const name = body.name?.trim() ?? ''
  const email = body.email?.trim() ?? ''
  const message = body.message?.trim() ?? ''

  if (name.length < 2 || name.length > 100) {
    throw createError({ statusCode: 400, statusMessage: 'Please provide your name.' })
  }
  if (!isValidEmail(email) || email.length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'Please provide a valid email address.' })
  }
  if (message.length < 10 || message.length > 2000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Your message should be between 10 and 2000 characters.',
    })
  }

  /* --- Delivery ----------------------------------------------------------
     Right now: logged to the terminal running `npm run dev`. Submit the form
     and you will see it appear there — proof the round-trip works end to end. */
  console.info('\n📬 New contact message')
  console.info('   From:', `${name} <${email}>`)
  console.info('   IP:  ', ip)
  console.info('   Body:', message.replace(/\n/g, '\n         '))
  console.info('')

  /* TO SEND REAL EMAIL
     1. Pick a provider (Resend, Postmark, SendGrid) and get an API key.
     2. Put it in a .env file as NUXT_CONTACT_API_KEY — never in the code.
     3. Expose it via runtimeConfig in nuxt.config.ts:
          runtimeConfig: { contactApiKey: '' }
        Keys directly on runtimeConfig are server-only. Anything under
        runtimeConfig.public is bundled into the browser — do not put secrets there.
     4. Then here:
          const config = useRuntimeConfig()
          await $fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${config.contactApiKey}` },
            body: { from: 'site@yourdomain.com', to: 'you@yourdomain.com',
                    subject: `Portfolio message from ${name}`, text: message },
          })
     Note `from` must be a domain you have verified with the provider — you
     cannot send as the visitor's address. Put THEIR address in `reply_to`. */

  return {
    ok: true,
    message: 'Thanks — your message is on its way.',
  }
})
