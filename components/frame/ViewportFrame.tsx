import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";

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
 * The mark, straddling the top frame line so the rule appears to pass behind
 * it. Sitting *on* the line rather than inside it is what makes the frame feel
 * like hardware.
 *
 * The turf-coloured disc is what does the masking, so the logo is served with
 * a transparent ground rather than the black plate it ships with — the page is
 * #14161a, and a baked-in #000000 would read as a darker square sitting on it.
 *
 * `label` is no longer drawn, but it stays as the link's accessible name:
 * replacing a wordmark with an image should not cost a screen reader the one
 * piece of text that says whose site this is.
 */
export function FrameMark({ label = "Your Fantasy" }: { label?: string }) {
  return (
    <Link
      href="/"
      aria-label={label}
      className="pointer-events-auto absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ top: "var(--frame-inset)" }}
    >
      {/*
        The badge is centred on the top rule, so half its height hangs above
        that line — and the frame clips its overflow. That caps it at twice
        `--frame-inset`: 32px on mobile, where the inset is 16. Desktop has
        40px of inset and room for a mark that can actually be read, which
        matters more here than it did for a wordmark, because this one stacks
        two rows of glyphs into a square.
      */}
      <span className="bg-turf flex items-center rounded-full px-3 py-1.5 lg:px-4 lg:py-2.5">
        <Image
          src={asset("/media/logo.svg")}
          alt=""
          width={185}
          height={192}
          // Height drives the size and width follows, which is also the shape
          // next/image wants: overriding exactly one dimension in CSS is what
          // makes it warn about a distorted aspect ratio.
          className="h-5 w-auto lg:h-8"
          priority
        />
      </span>
    </Link>
  );
}
