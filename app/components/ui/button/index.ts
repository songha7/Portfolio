import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

/**
 * `cva` = class variance authority.
 *
 * It builds a function that turns props into a class string:
 *   buttonVariants({ variant: 'brand', size: 'pill' })
 *     -> "inline-flex items-center ... bg-brand ... h-12 rounded-full px-7"
 *
 * The first argument is the base classes every button gets; `variants` holds
 * the swappable sets. This is *the* pattern behind shadcn — the component file
 * stays tiny and every styling decision lives in one table.
 *
 * These files are yours: shadcn copies the source into your repo instead of
 * installing it from npm, so adding the `brand`/`glass`/`hairline` variants
 * below is the intended way to work, not a hack.
 *
 * ⚠️ Re-running `npx shadcn-vue add button -o` overwrites this file and wipes
 * these additions. Drop the `-o` flag, or re-apply them afterwards.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",

        /* --- Custom variants added for this portfolio --------------------- */

        /** Solid gold. The single most important call-to-action on a page. */
        brand:
          "bg-brand text-[oklch(0.16_0.01_65)] font-semibold shadow-[0_1px_0_0_oklch(1_0_0/40%)_inset,0_8px_24px_-8px_var(--brand)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0",

        /** Frosted panel. Sits on top of the 3D canvas without hiding it. */
        glass:
          "glass text-foreground hover:border-brand/40 hover:bg-brand/10 backdrop-blur-xl",

        /** Hairline outline that warms to gold on hover. */
        hairline:
          "border border-border text-foreground relative overflow-hidden hover:border-brand/50 hover:text-brand",
      },
      size: {
        "default": "h-9 px-4 py-2 has-[>svg]:px-3",
        /** Roomy pills for hero CTAs. */
        "pill": "h-12 rounded-full px-7 text-sm has-[>svg]:px-6",
        "pill-lg": "h-14 rounded-full px-9 text-base has-[>svg]:px-8",
        "xs": "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        "sm": "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        "lg": "h-10 rounded-md px-6 has-[>svg]:px-4",
        "icon": "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)
export type ButtonVariants = VariantProps<typeof buttonVariants>
