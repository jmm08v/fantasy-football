/**
 * Talking to the shared board.
 *
 * Neon's Data API is PostgREST, and every request needs a JWT — even an
 * unauthenticated one. Managed Better Auth hands out short-lived anonymous
 * tokens for exactly this, so the flow is: fetch a token, cache it until it
 * expires, send it as a bearer on every call.
 *
 * These URLs are public on purpose. They are in the bundle because a static
 * site has no server to hide them behind, and that is safe here because the
 * rules live in Postgres rather than in this file:
 *
 *   - a CHECK constraint refuses any player not in the league
 *   - a CHECK constraint refuses times outside 3.5–60 seconds
 *   - an INSERT policy refuses a row that arrives already finished, which is
 *     what makes "declare before you run" hold
 *   - a trigger refuses a third attempt
 *   - an UPDATE policy only touches rows with no time yet, so a posted run
 *     can never be rewritten, and the column grant means only `seconds` and
 *     `finished_at` can be written at all
 *
 * All of that was verified against this endpoint with a raw client, not
 * assumed. What is still not enforced is *identity*: nothing stops someone
 * posting as another player. The PIN in front of an official run is the only
 * thing asking, and it is a claim rather than proof.
 */

const API =
  "https://ep-silent-grass-au454jx0.apirest.c-10.us-east-1.aws.neon.tech/neondb/rest/v1";
const AUTH =
  "https://ep-silent-grass-au454jx0.neonauth.c-10.us-east-1.aws.neon.tech/neondb/auth";

export type Row = {
  id: number;
  player: string;
  seconds: number | null;
  started_at: string;
  finished_at: string | null;
};

let token: string | null = null;
let tokenExpiry = 0;

/** Anonymous tokens last an hour; renew a minute early rather than on a 401. */
async function bearer(): Promise<string> {
  if (token && Date.now() < tokenExpiry) return token;

  const res = await fetch(`${AUTH}/token/anonymous`);
  if (!res.ok) throw new Error(`auth ${res.status}`);
  const { token: fresh } = (await res.json()) as { token: string };

  // The expiry is in the JWT's own payload. Reading it beats hard-coding a
  // lifetime that Neon is free to change.
  let expSeconds = 0;
  try {
    expSeconds = JSON.parse(atob(fresh.split(".")[1])).exp ?? 0;
  } catch {
    // Unreadable payload: fall back to a short window so a stale token is
    // replaced quickly rather than being trusted forever.
    expSeconds = Math.floor(Date.now() / 1000) + 300;
  }

  token = fresh;
  tokenExpiry = expSeconds * 1000 - 60_000;
  return fresh;
}

async function call(path: string, init?: RequestInit): Promise<Response> {
  const jwt = await bearer();
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
  });
}

export async function fetchRows(): Promise<Row[]> {
  const res = await call("/attempts?select=*&order=id.asc");
  if (!res.ok) throw new Error(`read ${res.status}`);
  return (await res.json()) as Row[];
}

/**
 * Claims an attempt. Returns the new row's id, or null when the server
 * refuses — which is the cap being enforced, not a network failure.
 */
export async function startRow(player: string): Promise<number | null> {
  const res = await call("/attempts", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ player }),
  });
  if (!res.ok) return null;
  const [row] = (await res.json()) as Row[];
  return row?.id ?? null;
}

/** Fills in the time on a claimed attempt. */
export async function finishRow(id: number, seconds: number): Promise<boolean> {
  const res = await call(`/attempts?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ seconds, finished_at: new Date().toISOString() }),
  });
  if (!res.ok) return false;
  const rows = (await res.json()) as Row[];
  // An empty array means the policy matched nothing — the run was already
  // finished, so this is a refusal rather than a success.
  return rows.length > 0;
}
