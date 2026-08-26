import { Marquee } from "@/components/primitives/Marquee";
import { MonoLabel } from "@/components/primitives/MonoLabel";

/**
 * Ticker of team names. Cheap, always-on movement that keeps the page from
 * feeling static between scroll reveals — the reference site uses the same
 * device for sponsor logos.
 */
export function TeamMarquee({ label, items }: { label: string; items: string[] }) {
  // The loop only reads as seamless while one strip is at least as wide as the
  // viewport — otherwise the -100% translate exposes a gap before the second
  // copy arrives. A short roster gets repeated until the strip is long enough.
  const strip =
    items.length >= 10
      ? items
      : Array.from({ length: Math.ceil(10 / items.length) }, () => items).flat();

  return (
    <section className="bg-turf overflow-hidden py-10 lg:py-16">
      <div className="mb-6 text-center lg:mb-10">
        <MonoLabel scramble size="lg" className="opacity-40">
          {label}
        </MonoLabel>
      </div>
      <Marquee duration={40}>
        {strip.map((name, i) => (
          <span key={`${name}-${i}`} className="flex shrink-0 items-center gap-x-3 px-3">
            <span className="type-display-lg !text-[28px] !leading-[28px] !tracking-[-1px] whitespace-nowrap opacity-60 lg:!text-[40px] lg:!leading-[40px]">
              {name}
            </span>
            <span className="text-volt type-hud-lg">{">="}</span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
