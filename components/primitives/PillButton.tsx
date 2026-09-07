"use client";

import Link from "next/link";
import { CSS_EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";

/**
 * Pill button.
 *
 * A 700ms scale on hover sounds absurdly slow for a button and is exactly why
 * it works: the movement is small (10%) and long, so it reads as a physical
 * lean rather than a UI blip. Short + large is twitchy; long + small is calm.
 *
 * The `invite` variant is the one thing on the page asking to be clicked, so
 * it is the only button that moves on its own: volt type inside a volt
 * hairline, with a specular sweep crossing it every few seconds. Colour alone
 * would compete with the accent already used for stats and hovers — the
 * motion is what separates it. Kept to a single element and a `transform`
 * keyframe, which the compositor handles without repainting the button.
 */
export function PillButton({
  children,
  href,
  onClick,
  variant = "solid",
  className,
  icon,
  iconPosition = "trailing",
  shineDelay,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "solid" | "outline" | "invite" | "venmo";
  className?: string;
  icon?: React.ReactNode;
  /**
   * Trailing suits an arrow, which points onward from the label. A brand mark
   * leads instead: it identifies where the button goes, so it should be read
   * before the words rather than after them.
   */
  iconPosition?: "leading" | "trailing";
  /**
   * Offsets the sweep on an `invite` button. Two of them side by side glinting
   * in unison reads as a blinking pair; staggered, it reads as light moving
   * across a surface.
   */
  shineDelay?: string;
}) {
  const classes = cn(
    "type-hud relative inline-flex items-center gap-x-2 rounded-full px-5 py-[14px] will-change-transform",
    "transition-transform duration-700 hover:scale-[1.10]",
    variant === "solid" && "bg-chalk text-turf",
    variant === "outline" && "border-chalk/40 text-chalk hover:border-chalk border",
    // `overflow-hidden` is what clips the sweep to the pill's radius.
    variant === "invite" &&
      "border-volt/50 text-volt bg-volt/5 hover:border-volt hover:bg-volt/10 overflow-hidden border transition-colors",
    // Venmo's brand blue, hard-coded rather than tokenised: it belongs to
    // someone else's identity, not to this design system, and putting it in
    // @theme would invite reuse as if it were one of our own colours.
    // The border is the same colour as the fill purely so this sits at the
    // same height as the bordered variants when they are stacked together.
    variant === "venmo" && "border border-[#008CFF] bg-[#008CFF] text-white",
    className,
  );
  const style = { transitionTimingFunction: CSS_EASE.quart };

  const content = (
    <>
      {variant === "invite" && (
        <span
          aria-hidden="true"
          style={shineDelay ? { animationDelay: shineDelay } : undefined}
          className="animate-shine via-volt/35 pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent to-transparent"
        />
      )}
      {/* Lifted above the sweep so the label never dims as it passes. */}
      <span className="relative inline-flex items-center gap-x-2">
        {iconPosition === "leading" && icon}
        {children}
        {iconPosition === "trailing" && icon}
      </span>
    </>
  );

  if (href) {
    // next/link is for in-app routes; an off-site URL wants a plain anchor
    // with the noopener guard that target="_blank" otherwise leaves open.
    if (/^https?:\/\//.test(href)) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
          style={style}
        >
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} style={style}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes} style={style}>
      {content}
    </button>
  );
}
