import { Container } from "@/components/primitives/Container";
import { SplitChars } from "@/components/primitives/SplitChars";
import { MonoLabel } from "@/components/primitives/MonoLabel";
import { PillButton } from "@/components/primitives/PillButton";

export function SiteFooter({ name, season }: { name: string; season: string }) {
  return (
    <footer className="bg-turf pb-32">
      <Container className="gap-y-12 pt-20 lg:pt-32">
        <SplitChars as="h2" className="type-display-lg col-span-6 lg:col-span-8">
          {"JOIN THE WAITLIST"}
        </SplitChars>

        <div className="col-span-6 flex items-end lg:col-span-4 lg:justify-end">
          <PillButton href="#" variant="outline">
            Request an invite
          </PillButton>
        </div>

        <div className="border-chalk/20 col-span-6 flex flex-col gap-y-4 border-t pt-8 lg:col-span-12 lg:flex-row lg:justify-between">
          <MonoLabel className="opacity-40">{`${name} — EST. 2014`}</MonoLabel>
          <MonoLabel className="opacity-40">{`SEASON ${season}`}</MonoLabel>
        </div>
      </Container>
    </footer>
  );
}
