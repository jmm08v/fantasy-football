import { Container } from "@/components/primitives/Container";
import { SplitChars } from "@/components/primitives/SplitChars";
import { MonoLabel } from "@/components/primitives/MonoLabel";
import { Reveal } from "@/components/primitives/Reveal";
import { CSS_EASE } from "@/lib/motion";

/**
 * Standings table, built as rows rather than a <table> so each one can carry
 * its own hover and reveal. The row fills with the accent colour on hover — the
 * same move the reference site uses on its FAQ, and the only place either
 * design allows a large block of colour.
 */
export function Standings({
  title,
  teams,
}: {
  title: string;
  teams: {
    name: string;
    manager?: string;
    record: string;
    pf: string;
    streak: string;
  }[];
}) {
  // Drop the Manager column entirely when nobody has one, rather than leaving
  // a column of blanks. Spans are redistributed so the row still totals 12.
  const showManager = teams.some((t) => t.manager);
  const nameSpan = showManager ? "lg:col-span-3" : "lg:col-span-5";

  return (
    <section className="bg-turf overflow-hidden">
      <Container className="py-20 lg:py-32">
        <SplitChars as="h2" className="type-display-lg col-span-6 pb-12 lg:col-span-12 lg:pb-20">
          {title}
        </SplitChars>

        <div className="col-span-6 flex flex-col gap-y-2 lg:col-span-12">
          <div className="border-chalk/20 hidden grid-cols-12 gap-x-4 border-b px-10 pb-4 lg:grid">
            {(showManager
              ? ["#", "TEAM", "MANAGER", "RECORD", "POINTS FOR", "STREAK"]
              : ["#", "TEAM", "RECORD", "POINTS FOR", "STREAK"]
            ).map((h) => (
              <MonoLabel
                key={h}
                className={`opacity-40 ${
                  h === "TEAM"
                    ? nameSpan
                    : h === "#"
                      ? "lg:col-span-1"
                      : "lg:col-span-2"
                }`}
              >
                {h}
              </MonoLabel>
            ))}
          </div>

          {teams.map((team, i) => (
            <Reveal key={team.name} index={i}>
              <div
                className="group border-chalk/20 hover:bg-volt hover:text-turf grid grid-cols-6 items-center gap-x-4 gap-y-2 rounded-[40px] border px-6 py-5 transition duration-300 lg:grid-cols-12 lg:px-10 lg:py-6"
                style={{ transitionTimingFunction: CSS_EASE.quart }}
              >
                <MonoLabel className="text-volt col-span-1 group-hover:text-turf">
                  {String(i + 1).padStart(2, "0")}
                </MonoLabel>
                <div className={`type-card col-span-5 ${nameSpan}`}>{team.name}</div>
                {showManager && (
                  <MonoLabel className="col-span-3 opacity-70 lg:col-span-2">{team.manager ?? ""}</MonoLabel>
                )}
                <MonoLabel className="col-span-2 lg:col-span-2">{team.record}</MonoLabel>
                <MonoLabel className="col-span-2 lg:col-span-2">{team.pf}</MonoLabel>
                <MonoLabel className="col-span-2 lg:col-span-2">{team.streak}</MonoLabel>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
