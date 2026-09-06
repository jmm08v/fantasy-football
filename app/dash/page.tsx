import type { Metadata } from "next";
import { FortyDash } from "@/components/game/FortyDash";
import { HEADSHOTS, LEAGUE, TEAMS } from "@/components/data/league";

export const metadata: Metadata = {
  title: `40-Yard Dash — ${LEAGUE.name}`,
  description:
    "Two pads, forty yards. Practice as much as you like; two runs count.",
};

/**
 * The field, paired with their portraits.
 *
 * TEAMS and HEADSHOTS are index-aligned — the same coupling app/page.tsx
 * relies on when it feeds the marquee — so a name added to one has to be added
 * to the other.
 */
const PLAYERS = TEAMS.map((team, i) => ({
  name: team.name,
  headshot: HEADSHOTS[i],
}));

export default function DashPage() {
  return (
    <main>
      <FortyDash players={PLAYERS} />
    </main>
  );
}
