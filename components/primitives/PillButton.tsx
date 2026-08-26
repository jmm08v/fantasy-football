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
 */
export function PillButton({
  children,
  href,
  onClick,
  variant = "solid",
  className,
  icon,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "solid" | "outline";
  className?: string;
  icon?: React.ReactNode;
}) {
  const classes = cn(
    "type-hud inline-flex items-center gap-x-2 rounded-full px-5 py-[14px] will-change-transform",
    "transition-transform duration-700 hover:scale-[1.10]",
    variant === "solid"
      ? "bg-chalk text-turf"
      : "border border-chalk/40 text-chalk hover:border-chalk",
    className,
  );
  const style = { transitionTimingFunction: CSS_EASE.quart };

  if (href) {
    return (
      <Link href={href} className={classes} style={style}>
        {children}
        {icon}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes} style={style}>
      {children}
      {icon}
    </button>
  );
}
