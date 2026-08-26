import { Marquee } from "@/components/primitives/Marquee";
import { MonoLabel } from "@/components/primitives/MonoLabel";

/**
 * Ticker of team names. Cheap, always-on movement that keeps the page from
 * feeling static between scroll reveals — the reference site uses the same
 * device for sponsor logos.
 */
export function TeamMarquee({ label, items }: { label: string; items: string[] }) {
  return (
    <section className="bg-turf overflow-hidden py-10 lg:py-16">
      <div className="mb-6 text-center lg:mb-10">
        <MonoLabel scramble size="lg" className="opacity-40">
          {label}
        </MonoLabel>
      </div>
      <Marquee duration={40}>
        {items.map((name) => (
          <span key={name} className="flex shrink-0 items-center gap-x-3 px-3">
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
