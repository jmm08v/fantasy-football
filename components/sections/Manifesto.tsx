import { Container } from "@/components/primitives/Container";
import { MonoLabel } from "@/components/primitives/MonoLabel";
import { SplitLines } from "@/components/primitives/SplitLines";

/**
 * Statement block. A mono eyebrow, then one paragraph set larger than body copy
 * and revealed line by line. Restraint here is what earns the hero its volume.
 */
export function Manifesto({ eyebrow, body }: { eyebrow: string; body: string }) {
  return (
    <section className="bg-turf overflow-hidden">
      <Container className="py-20 lg:py-32">
        <div className="col-span-6 mb-8 lg:col-span-12 lg:mb-16">
          <MonoLabel scramble size="lg" className="opacity-50">
            {eyebrow}
          </MonoLabel>
        </div>
        <SplitLines className="type-card col-span-6 lg:col-start-3 lg:col-end-11">
          {body}
        </SplitLines>
      </Container>
    </section>
  );
}
