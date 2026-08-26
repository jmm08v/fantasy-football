import { Container } from "@/components/primitives/Container";
import { SplitChars } from "@/components/primitives/SplitChars";
import { MonoLabel } from "@/components/primitives/MonoLabel";
import { Reveal } from "@/components/primitives/Reveal";
import { CSS_EASE } from "@/lib/motion";

type Slot = { count: number; pos: string; note?: string };

/**
 * The settings, laid out as a spec sheet.
 *
 * Rules are the reason a league site exists, so they get the same treatment as
 * the hero rather than being buried in a wiki. The mono/numbered presentation
 * is doing real work here: numbered rows read as a document you can point at
 * in an argument ("rule 03"), which is exactly what you want mid-season.
 */
export function Rulebook({
  format,
  faab,
  roster,
  keepers,
}: {
  format: string[];
  faab: string[];
  roster: { starters: Slot[]; reserve: Slot[] };
  keepers: { items: string[]; example: string };
}) {
  const starterCount = roster.starters.reduce((n, s) => n + s.count, 0);
  const reserveCount = roster.reserve.reduce((n, s) => n + s.count, 0);

  return (
    <section className="bg-turf overflow-hidden">
      <Container className="gap-y-16 py-20 lg:gap-y-24 lg:py-32">
        <SplitChars as="h2" className="type-display-lg col-span-6 lg:col-span-12">
          Rulebook
        </SplitChars>

        {/* Roster — a depth chart rather than a bullet list. */}
        <div className="col-span-6 lg:col-span-12">
          <SpecHeading index="01" title="Roster" />
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {roster.starters.map((slot, i) => (
              <Reveal key={slot.pos} index={i}>
                <div
                  className="border-chalk/20 hover:border-chalk/60 relative flex h-full flex-col justify-between gap-y-6 rounded-[24px] border p-6 transition duration-700 lg:rounded-[32px] lg:p-8"
                  style={{ transitionTimingFunction: CSS_EASE.quart }}
                >
                  <div className="text-volt text-[44px] leading-[40px] tracking-[-1.5px] lg:text-[64px] lg:leading-[58px] lg:tracking-[-2.5px]">
                    {slot.count}
                  </div>
                  <div className="flex flex-col gap-y-1">
                    <MonoLabel size="lg">{slot.pos}</MonoLabel>
                    {slot.note && (
                      <MonoLabel className="opacity-40">{slot.note}</MonoLabel>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="border-chalk/20 mt-2 flex flex-wrap items-center justify-between gap-4 rounded-[24px] border px-6 py-5 lg:rounded-[32px] lg:px-8">
            <div className="flex gap-x-8">
              {roster.reserve.map((slot) => (
                <div key={slot.pos} className="flex items-baseline gap-x-2">
                  <span className="text-volt type-hud-lg">{slot.count}</span>
                  <MonoLabel size="lg">{slot.pos}</MonoLabel>
                </div>
              ))}
            </div>
            <MonoLabel className="opacity-40">
              {`${starterCount} STARTERS + ${reserveCount} RESERVE = ${starterCount + reserveCount} SPOTS`}
            </MonoLabel>
          </div>
        </div>

        <div className="col-span-6 lg:col-span-6">
          <SpecHeading index="02" title="Format" />
          <SpecList items={format} />
        </div>

        <div className="col-span-6 lg:col-span-6">
          <SpecHeading index="03" title="FAAB" />
          <SpecList items={faab} />
        </div>

        <div className="col-span-6 lg:col-span-12">
          <SpecHeading index="04" title="Keeper Rules" />
          <div className="grid gap-x-4 gap-y-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <SpecList items={keepers.items} />
            </div>

            <div className="flex flex-col gap-y-4 lg:col-span-5">
              {/* The one place accent fill is used on a block — the worked example
                  is the rule people actually need to see. */}
              <Reveal>
                <div className="bg-volt text-turf rounded-[24px] p-6 lg:rounded-[32px] lg:p-8">
                  <MonoLabel className="mb-4 block opacity-60">EXAMPLE</MonoLabel>
                  <p className="type-card">{keepers.example}</p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function SpecHeading({ index, title }: { index: string; title: string }) {
  return (
    <div className="border-chalk/40 mb-6 flex items-baseline gap-x-4 border-b pb-4 lg:mb-8">
      <MonoLabel className="text-volt">{index}</MonoLabel>
      <MonoLabel size="lg">{title}</MonoLabel>
    </div>
  );
}

function SpecList({ items }: { items: string[] }) {
  return (
    <ol className="flex flex-col">
      {items.map((item, i) => (
        <Reveal key={item} index={i}>
          <li className="border-chalk/20 flex items-baseline gap-x-4 border-b py-4 lg:gap-x-6">
            <MonoLabel className="w-6 shrink-0 opacity-40">
              {String(i + 1).padStart(2, "0")}
            </MonoLabel>
            <span className="type-body">{item}</span>
          </li>
        </Reveal>
      ))}
    </ol>
  );
}
