import { cn } from "@/lib/cn";

/**
 * Infinite marquee, pure CSS.
 *
 * The strip is rendered twice and translated a full -100%: when copy A leaves,
 * copy B is exactly where A started, so the loop point is invisible. No JS, no
 * rAF, no measurement — it survives being offscreen and costs nothing.
 * Duration scales with content: more items need a longer cycle to hold speed.
 */
export function Marquee({
  children,
  className,
  duration = 30,
  reverse = false,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  reverse?: boolean;
}) {
  const strip = (
    <div
      className={cn(
        "animate-marquee flex shrink-0 items-center gap-x-3 px-[6px]",
        reverse && "[animation-direction:reverse]",
      )}
      style={{ animationDuration: `${duration}s` }}
    >
      {children}
    </div>
  );

  return (
    <div className={cn("relative flex overflow-hidden", className)}>
      {strip}
      <div aria-hidden="true" className="contents">
        {strip}
      </div>
    </div>
  );
}
