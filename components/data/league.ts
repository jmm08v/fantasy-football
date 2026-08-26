/**
 * All copy and numbers in one place. Swap this file and the site re-skins to
 * your league without touching a component.
 */

export const LEAGUE = {
  name: "Your Fantasy",
  season: "2026",
  headline: ["EIGHT", "TEAMS", "ONE", "TROPHY"],
  tagline:
    "An 8-team half-PPR keeper league. Three keepers a year, superflex under center, and a championship that ends in Week 17.",
};

export const HUD_LEFT = [
  { key: "WEEK", value: "12 OF 17" },
  { key: "HIGH SCORE", value: "164.82" },
  { key: "FAAB LEFT", value: "$41 AVG" },
];

export const HUD_RIGHT = [
  { key: "WAIVERS", value: "WED 03:00" },
  { key: "FORMAT", value: "8-TEAM 0.5 PPR KEEPER" },
];

/** Headline numbers for the sticky stat rack. All of these are real rules. */
export const STATS = [
  { value: "8", label: "Teams. Head-to-head, no divisions, and a schedule where every week counts." },
  { value: "3", label: "Keepers per team going into the following season. First-rounders are not eligible." },
  { value: "$100", label: "FAAB budget for the season. Zero-dollar bids are allowed, and FAAB is tradeable." },
  { value: "17", label: "The week the championship ends. No Week 18 — the season finishes before the starters sit." },
];

export const PILLARS = [
  "Half-PPR, head-to-head, no divisions.",
  "Four teams make the playoffs, one week per round.",
  "Trade deadline is Week 11. Ties break on total points scored.",
];

export const FORMAT = [
  "8-team keeper league",
  "Half-PPR",
  "Head-to-head, no divisions",
  "4-team playoffs",
  "1 week per playoff round",
  "Championship ends Week 17, no Week 18",
  "Trade deadline: Week 11",
  "Standings tiebreaker: total points scored",
];

export const FAAB = [
  "$100 budget for the season",
  "$0 bids allowed",
  "FAAB can be traded",
  "Waivers process Wednesday",
  "Dropped players stay on waivers for 2 days",
  "No bonus FAAB for now — keep it simple Year 1",
];

/**
 * Starters total 12, plus 6 bench and 2 IR — 20 roster spots.
 * `note` renders as a sub-label under the position chip.
 */
export const ROSTER = {
  starters: [
    { count: 1, pos: "QB" },
    { count: 2, pos: "RB" },
    { count: 3, pos: "WR" },
    { count: 1, pos: "TE" },
    { count: 2, pos: "FLEX" },
    { count: 1, pos: "SUPERFLEX", note: "QB eligible" },
    { count: 1, pos: "K" },
    { count: 1, pos: "D/ST" },
  ],
  reserve: [
    { count: 6, pos: "Bench" },
    { count: 2, pos: "IR" },
  ],
};

export const KEEPERS = {
  items: [
    "Each team can keep up to 3 players going into the following season",
    "First-round draft picks cannot be kept",
    "Keeping a player costs you a draft pick one round earlier than where you drafted him the previous year",
    "Undrafted and waiver players can be kept for a predetermined late-round pick",
    "Everyone else goes back into the draft pool",
  ],
  example:
    "Draft someone in Round 8 who blows up, and you keep him next year for your Round 7 pick.",
  rationale:
    "This gives us a reason to care about rookies, sleepers, trades and waiver pickups beyond just this season, without allowing one great draft to lock up a dominant roster forever.",
};

/** The "why" behind the settings, as an accordion. */
export const RULES = [
  {
    q: "Why keeper instead of dynasty?",
    a: "Keeper gives us year-over-year continuity without locking everyone into their entire roster forever. You can build around a few guys you really like, but most players return to the draft every year. It should also make trades and finding breakout players more meaningful.",
  },
  {
    q: "Why superflex, QB eligible?",
    a: "With only 8 teams, everyone can easily get a good starting QB. Making superflex QB-eligible gives quarterbacks more value and makes drafting, trading and roster decisions more strategic.",
  },
  {
    q: "Why 6 bench spots instead of 4?",
    a: "Deep enough to handle injuries and byes and to hold rookies or players with future upside, especially now that those players could become keepers — but not so deep that waivers become completely empty.",
  },
];

/**
 * The field. Preseason, so every record is zeroed.
 *
 * `manager` is optional — while these entries are people rather than team
 * names, the standings table drops the Manager column entirely rather than
 * printing the same string twice. Add `manager` back to any row once real
 * team names exist and the column returns on its own.
 */
export const TEAMS: {
  name: string;
  manager?: string;
  record: string;
  pf: string;
  streak: string;
}[] = [
  { name: "Danny B", record: "0-0", pf: "0.0", streak: "—" },
  { name: "Vishan W", record: "0-0", pf: "0.0", streak: "—" },
  { name: "Robb S", record: "0-0", pf: "0.0", streak: "—" },
  { name: "John M", record: "0-0", pf: "0.0", streak: "—" },
  { name: "Allen H", record: "0-0", pf: "0.0", streak: "—" },
  { name: "Reggi B", record: "0-0", pf: "0.0", streak: "—" },
  { name: "TBD", record: "0-0", pf: "0.0", streak: "—" },
];

export const RECAPS = [
  { date: "Nov 24, 2026", title: "Gridiron Heights Clinches A Bye With Four Straight", tag: "WEEK 12 RECAP", href: "#" },
  { date: "Nov 17, 2026", title: "The Week 11 Deadline Deal Nobody Saw Coming", tag: "TRANSACTIONS", href: "#" },
  { date: "Nov 10, 2026", title: "Keeper Watch: Who Is Worth A Round 7 Pick?", tag: "KEEPER WATCH", href: "#" },
];
