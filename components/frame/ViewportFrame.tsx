import Link from "next/link";

/**
 * The visor.
 *
 * A fixed, rounded hairline rectangle that the whole site scrolls behind. It's
 * the strongest identity move on the reference site: content never touches the
 * browser edge, so the page reads as a heads-up display rather than a document.
 *
 * Implementation is one element. `box-shadow: 0 0 0 100vmax` paints the page
 * colour everywhere *outside* a rounded rect, which mattes the viewport corners;
 * the element's own 1px border draws the hairline. The reference site achieves
 * the same thing with a 64px border on an oversized negatively-offset div —
 * this is the same picture with a quarter of the arithmetic.
 *
 * `pointer-events-none` on the layer keeps it from eating clicks; the logo opts
 * back in.
 */
export function ViewportFrame({ children }: { children?: React.ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      <div
        aria-hidden="true"
        className="border-chalk/40 absolute rounded-[var(--frame-radius)] border"
        style={{
          top: "var(--frame-inset)",
          left: "var(--frame-inset)",
          right: "var(--frame-inset)",
          bottom: "var(--frame-bottom)",
          boxShadow: "0 0 0 100vmax var(--color-turf)",
        }}
      />
      {children}
    </div>
  );
}

/**
 * Wordmark, straddling the top frame line so the rule appears to pass behind
 * it. Sitting *on* the line rather than inside it is what makes the frame feel
 * like hardware.
 */
export function FrameMark({ label = "YOUR FANTASY" }: { label?: string }) {
  return (
    <Link
      href="/"
      className="pointer-events-auto absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ top: "var(--frame-inset)" }}
    >
      <span className="bg-turf type-hud text-chalk flex items-center gap-x-2 rounded-full px-5 py-3">
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
          <path d="M1 1L7 6L1 11" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 4H15M9 8H15" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        {label}
      </span>
    </Link>
  );
}
