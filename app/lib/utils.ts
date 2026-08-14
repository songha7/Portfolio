import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * `cn` = "class names". This tiny helper is used by every shadcn component.
 *
 * It does two jobs:
 *  1. clsx     -> lets you pass conditionals: cn('p-4', isActive && 'bg-brand')
 *  2. twMerge  -> resolves Tailwind conflicts, keeping the LAST one.
 *
 * Without twMerge, `cn('p-2', 'p-8')` would render both classes and the winner
 * would depend on CSS source order (fragile). With it you get just `p-8`.
 * That's what makes component props like `class="p-8"` reliably override defaults.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Clamp a number between a minimum and a maximum.
 * Used constantly in animation maths (progress values must stay in 0..1).
 */
export function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Linear interpolation: walk from `start` to `end` by amount `t` (0..1).
 * lerp(0, 100, 0.5) === 50
 *
 * Called every animation frame with a small `t` (like 0.1), it produces the
 * classic "smooth follow" easing — the basis of the custom cursor and of
 * Lenis's smooth scrolling.
 */
export function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t
}

/**
 * Re-map a number from one range to another.
 * mapRange(5, 0, 10, 0, 100) === 50
 * Handy for turning "scroll progress" into "rotation degrees".
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

/** Pad single digits so indexes read as 01, 02, 03 ... */
export function pad(n: number, size = 2) {
  return String(n).padStart(size, '0')
}
