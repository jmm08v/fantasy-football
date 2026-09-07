import { Container } from "@/components/primitives/Container";
import { SplitChars } from "@/components/primitives/SplitChars";
import { MonoLabel } from "@/components/primitives/MonoLabel";
import { PillButton } from "@/components/primitives/PillButton";

export function SiteFooter({
  name,
  season,
  inviteUrl,
}: {
  name: string;
  season: string;
  inviteUrl?: string;
}) {
  return (
    <footer className="bg-turf pb-32">
      <Container className="gap-y-12 pt-20 lg:pt-32">
        <SplitChars as="h2" className="type-display-lg col-span-6 lg:col-span-8">
          {"HERE IS YOUR INVITE"}
        </SplitChars>

        {/* "HERE IS YOUR INVITE" sat above a button that only fetched the app.
            The invite itself leads; installing Sleeper is the fallback. */}
        <div className="col-span-6 flex flex-wrap items-end gap-2 lg:col-span-4 lg:justify-end">
          {inviteUrl && (
            <PillButton
              href={inviteUrl}
              icon={
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M1 6h10M6.5 1.5L11 6l-4.5 4.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              }
            >
              Join League
            </PillButton>
          )}
          <PillButton
            variant="outline"
            href="https://sleeper.com/download"
            icon={
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 1v8M2.5 5.5L6 9l3.5-3.5M1 11h10" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            }
          >
            Download Sleeper
          </PillButton>
        </div>

        <div className="border-chalk/20 col-span-6 flex flex-col gap-y-4 border-t pt-8 lg:col-span-12 lg:flex-row lg:justify-between">
          <MonoLabel className="opacity-40">{`${name} — EST. ${season}`}</MonoLabel>
          <MonoLabel className="opacity-40">{`SEASON ${season}`}</MonoLabel>
        </div>
      </Container>
    </footer>
  );
}
