/* ===========================================================================
   ✏️  EDIT ME FIRST

   This is the only file you need to touch to make the site yours.
   Every headline, project, job and social link on the whole website is read
   from here — no text is hard-coded inside components.

   I filled it in from the projects sitting next to this folder (the Nuxt
   "Roomie" app, the MediaPipe hand-tracking camera, the focus timer, the
   sakura CSS piece) plus your Nuxt research notes. Change anything that isn't
   right — the layout adapts automatically.
   =========================================================================== */

import type {
  Experience,
  LabItem,
  Project,
  SkillGroup,
  SocialLink,
} from '~/types/portfolio'

/* ---------------------------------------------------------------- identity */

export const profile = {
  name: 'Sros Songha',
  /** Shown in the hero as two stacked lines. */
  firstName: 'Sros',
  lastName: 'Songha',
  role: 'Software Engineering',
  /** The one-liner under the big name. */
  tagline: 'I build interfaces that feel alive.',
  /** Two or three sentences for the About section. */
  bio: [
    'I am a full-stack engineer who lives in the space between product and craft. Most days that means Nuxt and Vue on the front, a typed API underneath, and an unreasonable amount of attention paid to how a transition eases.',
    'The other half of my work is computer vision — real-time hand tracking, identity verification, anything where a camera has to understand what it is looking at before the frame is gone.',
    'I care about the small things: a loading state that respects your time, a layout that survives a 320px phone, motion that means something instead of just moving.',
  ],
  location: 'Remote · UTC+7',
  availability: 'Open to new work',
  email: 'sanghakh122333@gmail.com',
  /** Numbers in the hero strip. `suffix` is appended after the counter. */
  stats: [
    { value: 5, suffix: '+', label: 'Years building' },
    { value: 30, suffix: '+', label: 'Projects shipped' },
    { value: 12, suffix: '', label: 'Tech in daily use' },
    { value: 60, suffix: 'fps', label: 'Non-negotiable' },
  ],
}

export const socials: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/songha7', handle: '@songha7' },
  { label: 'LinkedIn', href: 'https://linkedin.com/', handle: '/in/asuna' },
  { label: 'Email', href: `mailto:${profile.email}`, handle: profile.email },
]

/* ---------------------------------------------------------------- projects */

export const projects: Project[] = [
  {
    slug: 'roomie',
    title: 'Roomie',
    tagline: 'A room-rental marketplace built on Nuxt 4.',
    description:
      'A full marketplace for finding rooms and roommates: search with live filters, saved listings, host onboarding, messaging and a multi-language interface. Built to explore how far Nuxt 4 conventions can carry a real product before you need to reach for anything custom.',
    year: '2026',
    role: 'Design & full-stack build',
    stack: ['Nuxt 4', 'Vue 3', 'TypeScript', 'Supabase', 'Clerk', 'Nuxt i18n'],
    tags: ['Product', 'Full-stack'],
    links: [
      { label: 'Source', href: 'https://github.com/songha7', icon: 'github' },
      { label: 'Case study', href: '/work/roomie', icon: 'docs' },
    ],
    highlights: [
      'File-based routing with dynamic listing pages and nested host flows.',
      'Nitro server routes serve filtered listings so the first paint is already populated — no client-side loading spinner on entry.',
      'Auth handled by Clerk, data by Supabase, with row-level security keeping each host scoped to their own listings.',
      'Full i18n with a language switcher that persists across navigation.',
      'Saved-listings composable backed by local storage, sharing one reactive source of truth across every card on the page.',
    ],
    metrics: [
      { value: '9', label: 'Route groups' },
      { value: '100%', label: 'Typed API surface' },
      { value: '2', label: 'Languages' },
    ],
    accent: ['oklch(0.78 0.14 78)', 'oklch(0.62 0.15 42)'],
    featured: true,
    status: 'shipped',
  },
  {
    slug: 'hand-filter-cam',
    title: 'Hand Filter Cam',
    tagline: 'Your hands are the mask. Real-time gesture-driven video filters.',
    description:
      'A webcam app that tracks both hands with MediaPipe and applies a filter only inside the area your hands cover. The filtered region is the convex hull of every landmark, so one hand gives you a patch and two hands bridge into a single shape spanning the space between them.',
    year: '2026',
    role: 'Solo build — CV & real-time graphics',
    stack: ['Python', 'MediaPipe', 'OpenCV', 'NumPy'],
    tags: ['Computer Vision', 'Experiment'],
    links: [{ label: 'Source', href: 'https://github.com/songha7', icon: 'github' }],
    highlights: [
      'Convex-hull masking over all 21 landmarks per hand, unioned across both hands into one continuous filtered region.',
      'Finger counting drives the filter: fist for original, then grayscale, invert, sepia and pixelate as you raise fingers.',
      'A dedicated thumbs-up gesture cycles the bonus filters — cartoon, edge detect, thermal — so the thumb never confuses the counter.',
      'Every gesture has a keyboard fallback, because lighting and camera angle will eventually let you down in a demo.',
      'On-screen HUD reports active filter, hand count, detected gesture and live FPS.',
    ],
    metrics: [
      { value: '42', label: 'Landmarks tracked' },
      { value: '8', label: 'Filters' },
      { value: '30fps', label: 'On a laptop cam' },
    ],
    accent: ['oklch(0.74 0.1 205)', 'oklch(0.55 0.13 250)'],
    featured: true,
    status: 'shipped',
  },
  {
    slug: 'identity-flow',
    title: 'Identity Flow',
    tagline: 'Document capture and liveness that people actually complete.',
    description:
      'An electronic know-your-customer journey: guided document capture, edge and glare detection before upload, liveness checks, and a review queue for the humans on the other side. The engineering problem is accuracy; the design problem is that every extra second of friction costs you a real user.',
    year: '2025 — 2026',
    role: 'Front-end architecture & capture UX',
    stack: ['Vue 3', 'TypeScript', 'WebRTC', 'Canvas', 'REST'],
    tags: ['Product', 'Computer Vision'],
    links: [{ label: 'Private project', icon: 'docs' }],
    highlights: [
      'Live frame analysis in a canvas pipeline — blur, glare and edge checks run before the shutter, so users are corrected in the moment rather than rejected minutes later.',
      'A capture state machine with explicit, recoverable states instead of a pile of booleans.',
      'Camera permission and hardware failures treated as first-class UI states, not error toasts.',
      'Every step instrumented so drop-off can be traced to an exact instruction.',
    ],
    metrics: [
      { value: '<3s', label: 'Median capture' },
      { value: '6', label: 'Guided states' },
    ],
    accent: ['oklch(0.72 0.14 22)', 'oklch(0.5 0.13 12)'],
    featured: true,
    status: 'shipped',
  },
  {
    slug: 'focus-flow',
    title: 'Focus Flow',
    tagline: 'A timer that notices when you are actually working.',
    description:
      'A single-file focus tool: sessions, breaks, and a visual record of the day that rewards consistency instead of guilt-tripping you about streaks. Zero dependencies, zero build step, opens straight from the filesystem.',
    year: '2026',
    role: 'Solo build',
    stack: ['HTML', 'CSS', 'Vanilla JS', 'Web Audio'],
    tags: ['Tool', 'Experiment'],
    links: [{ label: 'Source', href: 'https://github.com/songha7', icon: 'github' }],
    highlights: [
      'Whole app in one file — no toolchain to rot, no install to explain.',
      'State persisted to local storage so a refresh never loses a session.',
      'Ambient audio cues generated with the Web Audio API rather than shipped as assets.',
    ],
    accent: ['oklch(0.76 0.13 145)', 'oklch(0.55 0.12 168)'],
    featured: true,
    status: 'shipped',
  },
  {
    slug: 'sakura',
    title: 'Sakura',
    tagline: 'A flower that blooms when you touch it. Pure CSS.',
    description:
      'A small piece of creative coding: layered radial gradients form the petals, a keyframed transform sends them drifting, and a click pauses the fall to bloom the flower. No canvas, no library — a study in how much life you can get out of transforms and easing alone.',
    year: '2025',
    role: 'Creative coding',
    stack: ['CSS', 'Keyframes', 'HTML'],
    tags: ['Creative', 'Experiment'],
    links: [{ label: 'Source', href: 'https://github.com/songha7', icon: 'github' }],
    highlights: [
      'Petals drawn with a single radial-gradient and an asymmetric border-radius.',
      'Bloom state toggles animation-play-state rather than swapping animations, so the motion never jumps.',
      'Runs on the compositor — transform and opacity only.',
    ],
    accent: ['oklch(0.82 0.11 350)', 'oklch(0.66 0.16 12)'],
    featured: false,
    status: 'shipped',
  },
  {
    slug: 'this-site',
    title: 'This Portfolio',
    tagline: 'WebGL, scroll choreography, and a lot of comments.',
    description:
      'The site you are reading. A GLSL blob deforming to simplex noise, a Lenis scroll loop feeding GSAP ScrollTrigger, a horizontal showcase, pinned card stacks and a command palette — written to be read, with the reasoning left in the comments.',
    year: '2026',
    role: 'Design & build',
    stack: ['Nuxt 4', 'TresJS', 'GLSL', 'GSAP', 'Lenis', 'Tailwind v4', 'shadcn-vue'],
    tags: ['Creative', 'Full-stack'],
    links: [{ label: 'You are here', icon: 'external' }],
    highlights: [
      'One Lenis instance drives scrolling and hands its position to ScrollTrigger, so JS scroll and pinning stay in lockstep.',
      'The hero blob is a custom vertex shader displacing an icosahedron with 3D simplex noise, lit by a fresnel rim in the fragment shader.',
      'Sections scroll on four different axes — vertical, horizontal, skewed and depth-based.',
      'Every animation checks prefers-reduced-motion before it starts.',
    ],
    accent: ['oklch(0.8 0.14 78)', 'oklch(0.6 0.16 30)'],
    featured: true,
    status: 'building',
  },
]

/* ------------------------------------------------------------------ skills */

export const skillGroups: SkillGroup[] = [
  {
    title: 'Front-end',
    summary: 'Where I spend most of my time. Component design, state, and motion.',
    items: [
      { name: 'Vue 3 / Nuxt 4', level: 95 },
      { name: 'TypeScript', level: 88 },
      { name: 'Tailwind CSS', level: 92 },
      { name: 'GSAP / Motion', level: 85 },
      { name: 'Three.js / GLSL', level: 74 },
    ],
  },
  {
    title: 'Back-end',
    summary: 'Typed endpoints, sensible data models, auth that does not leak.',
    items: [
      { name: 'Nitro / Node', level: 84 },
      { name: 'Supabase / Postgres', level: 80 },
      { name: 'REST & API design', level: 86 },
      { name: 'Auth (Clerk, JWT)', level: 78 },
    ],
  },
  {
    title: 'Vision & Python',
    summary: 'Getting a camera to understand a scene before the next frame arrives.',
    items: [
      { name: 'Python', level: 82 },
      { name: 'OpenCV', level: 80 },
      { name: 'MediaPipe', level: 76 },
      { name: 'NumPy', level: 74 },
    ],
  },
  {
    title: 'Craft',
    summary: 'The parts nobody lists but everybody notices.',
    items: [
      { name: 'Interaction design', level: 88 },
      { name: 'Accessibility', level: 80 },
      { name: 'Performance', level: 85 },
      { name: 'i18n', level: 82 },
    ],
  },
]

/** The endless ticker rows in the skills section. */
export const marqueeRows = [
  ['Nuxt', 'Vue', 'TypeScript', 'Tailwind', 'Vite', 'Pinia', 'Nitro', 'shadcn'],
  ['Three.js', 'GLSL', 'GSAP', 'Lenis', 'WebGL', 'Canvas', 'SVG', 'Motion'],
  ['Python', 'OpenCV', 'MediaPipe', 'NumPy', 'Supabase', 'Postgres', 'Clerk', 'Git'],
]

/* -------------------------------------------------------------- experience */

export const experiences: Experience[] = [
  {
    period: '2025 — Now',
    role: 'Full-stack Engineer',
    organisation: 'eKYC Platform',
    description:
      'Building identity verification journeys end to end — camera capture, liveness, and the review tooling behind them. Front-end architecture, plus the browser-side vision work that decides whether a frame is good enough to send.',
    tags: ['Vue', 'TypeScript', 'Computer Vision', 'WebRTC'],
  },
  {
    period: '2024 — 2025',
    role: 'Front-end Engineer',
    organisation: 'Product Teams',
    description:
      'Shipped marketplace and dashboard products on Nuxt. Introduced a typed component library, moved teams from ad-hoc CSS to a token-driven system, and cut first-paint times by moving data fetching to the server.',
    tags: ['Nuxt', 'Design systems', 'SSR', 'Performance'],
  },
  {
    period: '2023 — 2024',
    role: 'Creative Developer',
    organisation: 'Independent',
    description:
      'Interactive sites and interface experiments. Learned motion the slow way — by rebuilding the same hero section until the easing stopped feeling wrong.',
    tags: ['GSAP', 'WebGL', 'CSS', 'Prototyping'],
  },
  {
    period: 'Always',
    role: 'Perpetual Student',
    organisation: 'Late nights',
    description:
      'Currently working through shaders and real-time rendering. Next up: WebGPU compute, and getting better at writing the maths down before writing the code.',
    tags: ['Shaders', 'WebGPU', 'Rendering'],
  },
]

/* ------------------------------------------------------------- playground */

export const labItems: LabItem[] = [
  {
    title: 'Noise fields',
    description: 'Simplex noise driving vertex displacement on a subdivided sphere.',
    kind: 'shader',
  },
  {
    title: 'Particle drift',
    description: 'Ten thousand points, one draw call, mouse-reactive flow.',
    kind: 'particles',
  },
  {
    title: 'Spring physics',
    description: 'Stiffness and damping instead of durations and curves.',
    kind: 'physics',
  },
  {
    title: 'Kinetic type',
    description: 'Per-character choreography driven by scroll velocity.',
    kind: 'type',
  },
  {
    title: 'Hand tracking',
    description: '21 landmarks per hand, filters masked to the convex hull.',
    kind: 'cv',
  },
  {
    title: 'Audio reactive',
    description: 'FFT bins mapped to geometry scale in real time.',
    kind: 'audio',
  },
]

/* ------------------------------------------------------------- navigation */

export const navLinks = [
  { label: 'Work', to: '/#work', section: 'work' },
  { label: 'About', to: '/#about', section: 'about' },
  { label: 'Skills', to: '/#skills', section: 'skills' },
  { label: 'Lab', to: '/playground', section: 'lab' },
  { label: 'Contact', to: '/#contact', section: 'contact' },
]

/** Used for <title>, meta description and the OG card. */
export const seo = {
  title: `${profile.name} — ${profile.role}`,
  description:
    'Full-stack engineer working across Nuxt, real-time graphics and computer vision. Selected work, experiments and a lot of easing curves.',
  url: 'https://example.com',
}
