# Asuna — Portfolio

A portfolio built to be **read**, not just looked at. Every file is commented
with the reasoning behind the code, not just a description of it.

Nuxt 4 · Vue 3 · Tailwind v4 · shadcn-vue · TresJS (three.js) · GLSL · GSAP · Lenis

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

| Command             | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Dev server with hot reload                                 |
| `npm run build`     | Production build into `.output/`                           |
| `npm run preview`   | Run the production build locally                           |
| `npm run typecheck` | Check every type without building                          |

---

## 1. Make it yours first

**Everything the site says about you lives in one file: [`app/data/site.ts`](app/data/site.ts).**
Name, role, bio, projects, jobs, skills, social links, SEO. No text is
hard-coded inside a component, so you can rewrite the entire site without
touching a single `.vue` file.

The colours are all in [`app/assets/css/main.css`](app/assets/css/main.css),
in the `:root` and `.dark` blocks at the top.

---

## 2. Where things are

```
app/
├── data/site.ts          ← ✏️  ALL your content
├── types/portfolio.ts        Shapes of that content
├── assets/css/main.css   ← 🎨  Design tokens, theme, custom utilities
│
├── app.vue                   Root — preloader, cursor, grain, toasts
├── error.vue                 404 / error page
├── layouts/default.vue       Header + page + footer
│
├── pages/
│   ├── index.vue             Home (composes the seven sections)
│   ├── playground.vue        Live shader lab with sliders
│   └── work/
│       ├── index.vue         Filterable archive
│       └── [slug].vue        Case study (dynamic route)
│
├── components/
│   ├── ui/                   shadcn-vue components (yours to edit)
│   ├── layout/               Header, footer, theme toggle, ⌘K palette
│   ├── fx/                   Preloader, cursor, split text, tilt, marquee…
│   ├── three/                WebGL scene components
│   └── sections/             The seven home-page sections
│
├── composables/
│   ├── useAnimation.ts       GSAP contexts, reduced motion, app-ready state
│   └── useSmoothScroll.ts    Lenis wrapper + scroll progress
│
├── plugins/
│   ├── gsap.client.ts        Registers ScrollTrigger
│   └── lenis.client.ts       Smooth scroll, wired into GSAP's ticker
│
└── shaders/                  Real .glsl files (heavily commented)

server/api/contact.post.ts    The contact form's backend
```

---

## 3. The four scroll axes

The page deliberately changes direction as you go down. That is what stops a
long page feeling like one endless column.

| Section        | Axis           | Technique                                            |
| -------------- | -------------- | ---------------------------------------------------- |
| **Hero**       | Depth          | WebGL blob + text parallax on `scrub`                |
| **About**      | Vertical       | Word-by-word illumination driven by scroll position  |
| **Skills**     | Diagonal       | Marquee rows inside a `rotate(-4deg)` band           |
| **Work**       | **Horizontal** | `pin: true` + translate a wide track on X            |
| **Process**    | **Z / depth**  | `position: sticky` cards scaling and tipping back    |
| **Experience** | Vertical       | A progress line that draws itself                    |
| **Contact**    | Vertical       | Settles back to calm                                 |

---

## 4. Ideas worth understanding

Each of these is explained in full in the comments of the file named.

**One animation loop, not two** — `plugins/lenis.client.ts`
GSAP and Lenis both want a `requestAnimationFrame` loop. Running both makes
pinned sections jitter. We disable Lenis's loop (`autoRaf: false`) and drive it
from GSAP's ticker, so there is exactly one loop with a guaranteed order.

**Animate `transform`, never `width`/`height`** — everywhere
Transforms are handled by the compositor. Width and height force the browser to
recalculate layout on every frame. That is why every progress bar here uses
`scaleX` and every reveal uses `translate`.

**`gsap.context()` for cleanup** — `composables/useAnimation.ts`
A ScrollTrigger holds a reference to its element forever. Navigate away and it
leaks. `context.revert()` undoes everything created inside it in one line.

**Masked text reveal** — `components/fx/SplitText.vue`
Each word sits in an `overflow: hidden` box; the letters animate from
`yPercent: 110`. They appear to rise out of a solid edge instead of fading in.
Two traps are documented in that file — both of them silently delete the spaces
between your words.

**A vertex shader is just maths per point** — `shaders/blob.vert.glsl`
Simplex noise decides how far to push each of ~40,000 vertices along its radius.
The surface normal is then recalculated by sampling two neighbouring points —
which is why the lighting follows the bumps instead of staying flat.

**Fresnel** — `shaders/blob.frag.glsl`
`pow(1 - dot(normal, viewDir), power)` is bright exactly where a surface curves
away from you. It is the cheapest trick in real-time rendering for making
something look expensive.

**Client validation is UX; server validation is the rule** — `server/api/contact.post.ts`
The form checks itself for the visitor's benefit. The endpoint checks again
because anyone can POST to it with curl. Also covers honeypots and rate
limiting, including where the naive in-memory approach breaks down.

**Reduced motion is not optional** — `composables/useAnimation.ts`
Large parallax can cause genuine nausea for people with vestibular disorders.
Every animation checks `prefers-reduced-motion` before it starts, and the CSS
has a global fallback.

---

## 5. Things to try

The fastest way to learn this codebase is to break it.

1. **See the scroll triggers.** In `plugins/gsap.client.ts`, set
   `ScrollTrigger.defaults({ markers: true })`. Coloured start/end lines appear
   on screen. This is the single most useful debugging tool in scroll animation.
2. **Play with the shader.** Go to `/playground`, turn on **wireframe**, then
   push **displacement** up. You are watching the vertex shader move geometry.
3. **Break the loop.** In `plugins/lenis.client.ts`, set `autoRaf: true`. Scroll
   the Work section and watch the pinned panel judder — that is what two
   competing animation loops look like.
4. **Change the whole palette.** In `main.css`, change `--brand` in both
   `:root` and `.dark`. One value re-themes the entire site, including the 3D.
5. **Add a project.** Append an object to `projects` in `app/data/site.ts`. It
   appears in the horizontal showcase, the archive, the ⌘K palette, and gets its
   own prerendered case-study page — with no other edits.

---

## 6. Notes and honest limitations

- **The contact form logs to your terminal.** It does not send email yet.
  `server/api/contact.post.ts` has step-by-step instructions at the bottom for
  wiring up a real provider, including why the API key must not go in
  `runtimeConfig.public`.
- **Rate limiting is in-memory.** It resets on redeploy and does not work across
  multiple server instances or on serverless. Fine for a portfolio; use Redis
  for anything that matters. This is explained in the file.
- **Social links point at placeholders.** LinkedIn in particular is a bare URL —
  update `socials` in `app/data/site.ts`.
- **The "portrait" is a CSS gradient**, not a photo. Drop a real image into
  `AboutSection.vue`; the `TiltCard` wrapper works the same either way.
- **The numbers in `profile.stats` and `project.metrics` are placeholders.**
  Change them to real ones or delete them — invented metrics are the fastest way
  to lose a reader's trust.
- **shadcn components are yours.** Re-running `npx shadcn-vue add button -o`
  overwrites `app/components/ui/button/index.ts` and wipes the custom `brand`,
  `glass` and `hairline` variants. Drop the `-o` flag.

---

## 7. Deploying

The build output is a standard Nitro server, so it runs anywhere:

```bash
npm run build
node .output/server/index.mjs
```

Vercel, Netlify and Cloudflare all detect Nuxt and need no configuration. Every
route is prerendered to static HTML at build time (`nitro.prerender.crawlLinks`
in `nuxt.config.ts`), so pages are served instantly and index cleanly.
