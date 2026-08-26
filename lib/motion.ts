/**
 * Motion vocabulary.
 *
 * Every animation in the app pulls its curve and duration from here, so
 * retiming the whole site is a one-file edit. The GSAP string eases and the
 * CSS cubic-beziers in globals.css are deliberately matched pairs.
 */

/** GSAP eases. `expo.out` is the signature: fast out of the gate, long settle. */
export const EASE = {
  reveal: "expo.out",
  drift: "sine.out",
  snap: "power3.out",
  overshoot: "back.inOut(3)",
} as const;

/** Seconds — GSAP's unit. */
export const DUR = {
  chars: 1.2,
  lines: 0.6,
  media: 1.2,
  drift: 1.5,
} as const;

/** Stagger steps. Chars are dense so they need a much smaller step than lines. */
export const STAGGER = {
  chars: 0.02,
  lines: 0.1,
  cards: 0.08,
} as const;

/** Matched CSS curves, for Tailwind arbitrary values and inline styles. */
export const CSS_EASE = {
  quart: "cubic-bezier(0.165, 0.84, 0.44, 1)",
  expo: "cubic-bezier(0.25, 0.74, 0.22, 0.99)",
  soft: "cubic-bezier(0.25, 1, 0.5, 1)",
} as const;

/** Viewport trigger shared by every Motion `whileInView` reveal. */
export const VIEWPORT = { once: true, amount: 0.25 } as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
