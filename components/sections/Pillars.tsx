import { Container } from "@/components/primitives/Container";
import { SplitLines } from "@/components/primitives/SplitLines";

/** Three short rules, each revealed as its own masked line. */
export function Pillars({ items }: { items: string[] }) {
  return (
    <section className="bg-turf overflow-hidden">
      <Container className="gap-y-10 py-16 lg:py-24">
        {items.map((item, i) => (
          <div key={item} className="col-span-6 lg:col-span-4">
            <div className="border-chalk/20 mb-6 border-t pt-6">
              <span className="type-hud text-volt">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <SplitLines className="type-card" delay={i * 0.08}>
              {item}
            </SplitLines>
          </div>
        ))}
      </Container>
    </section>
  );
}
