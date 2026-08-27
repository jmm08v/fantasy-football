import { Hero } from "@/components/sections/Hero";
import { asset } from "@/lib/asset";
import { TeamMarquee } from "@/components/sections/TeamMarquee";
import { Manifesto } from "@/components/sections/Manifesto";
import { LeagueStats } from "@/components/sections/LeagueStats";
import { Pillars } from "@/components/sections/Pillars";
import { Standings } from "@/components/sections/Standings";
import { Rulebook } from "@/components/sections/Rulebook";
import { Rules } from "@/components/sections/Rules";
import { SiteFooter } from "@/components/sections/SiteFooter";
import {
  FAAB,
  FORMAT,
  HEADSHOTS,
  KEEPERS,
  LEAGUE,
  PILLARS,
  ROSTER,
  RULES,
  STATS,
  TEAMS,
} from "@/components/data/league";

export default function Home() {
  return (
    <main>
      <Hero
        words={LEAGUE.headline}
        tagline={LEAGUE.tagline}
        mediaSrc={asset("/media/hero.mp4")}
        mediaPoster={asset("/media/hero-poster.jpg")}
      />
      <TeamMarquee
        label="THE FIELD"
        items={TEAMS.map((t) => t.name)}
        headshots={HEADSHOTS}
      />
      <Manifesto eyebrow="WHY KEEPER" body={KEEPERS.rationale} />
      <LeagueStats stats={STATS} />
      <Pillars items={PILLARS} />
      <Rulebook format={FORMAT} faab={FAAB} roster={ROSTER} keepers={KEEPERS} />
      <Rules title="Why These Settings" items={RULES} />
      <Standings title="Standings" teams={TEAMS} />
      {/* Hidden until there are real recaps to publish.
          <Recaps title="Latest" items={RECAPS} /> */}
      <SiteFooter name={LEAGUE.name} season={LEAGUE.season} />
    </main>
  );
}
