import Link from "next/link";
import { Container } from "@/components/primitives/Container";
import { SplitChars } from "@/components/primitives/SplitChars";
import { MonoLabel } from "@/components/primitives/MonoLabel";
import { MediaSlot } from "@/components/primitives/MediaSlot";
import { Reveal } from "@/components/primitives/Reveal";
import { CSS_EASE } from "@/lib/motion";

/**
 * Card hover — three properties moving together on one 700ms curve:
 *
 *   image   scale 1 -> 1.05        (pushes into the frame)
 *   body    translateY 0 -> -20px  (slides up, uncovering more image)
 *   border  chalk/20 -> chalk/60   (the card "wakes up")
 *
 * The body panel is opaque and sits above the image, so lifting it acts as a
 * moving mask. Because all three share a curve and duration they read as one
 * mechanism instead of three effects. That coordination is the whole trick, and
 * it's worth copying verbatim before you start tuning.
 */
export function Recaps({
  title,
  items,
}: {
  title: string;
  items: { date: string; title: string; tag: string; href: string }[];
}) {
  return (
    <section className="bg-turf">
      <Container className="gap-y-4 py-20 lg:py-32">
        <SplitChars as="h2" className="type-display-lg col-span-6 pb-12 lg:col-span-12 lg:pb-20">
          {title}
        </SplitChars>

        {items.map((item, i) => (
          <Reveal key={item.title} index={i} className="col-span-6 lg:col-span-4">
            <Link
              href={item.href}
              className="group border-chalk/20 hover:border-chalk/60 relative block overflow-hidden rounded-[24px] border transition duration-700 lg:rounded-[40px]"
              style={{ transitionTimingFunction: CSS_EASE.quart }}
            >
              <div className="relative overflow-hidden">
                <MediaSlot
                  aspect="aspect-[326/244]"
                  radius="rounded-none"
                  className="transition duration-700 group-hover:scale-105"
                />
              </div>

              <div
                className="bg-turf relative transition duration-700 group-hover:translate-y-[-20px]"
                style={{ transitionTimingFunction: CSS_EASE.quart }}
              >
                <div className="flex flex-col gap-y-4 px-6 pt-6 pb-12 lg:p-8">
                  <div className="flex items-center justify-between gap-x-4">
                    <MonoLabel className="text-volt">{item.tag}</MonoLabel>
                    <MonoLabel className="opacity-50">{item.date}</MonoLabel>
                  </div>
                  <h3 className="type-card">{item.title}</h3>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </Container>
    </section>
  );
}
