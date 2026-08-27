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
  backdrop = false,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  reverse?: boolean;
  /**
   * Paint the page colour behind the strip. Required when the content uses
   * `mix-blend-mode`, and the reason is easy to miss:
   *
   * the strip is animated with `transform`, and a transform creates a stacking
   * context. A stacking context is a blending group, so children blend against
   * *its* backdrop rather than the page's. With no background on the strip that
   * backdrop is transparent, and a black-on-black image screens against nothing
   * — leaving a visible rectangle exactly where the blend was supposed to make
   * one disappear. Giving the strip the page colour restores the intended
   * backdrop. Leave it off for text.
   */
  backdrop?: boolean;
}) {
  const strip = (
    <div
      className={cn(
        "animate-marquee flex shrink-0 items-center gap-x-3 px-[6px]",
        backdrop && "bg-turf",
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
