import { ScrambleText } from "./ScrambleText";
import { cn } from "@/lib/cn";

/**
 * The HUD voice: tiny, monospaced, uppercase.
 *
 * `scramble` is opt-in, not default. The decode effect is atmosphere, and it
 * belongs on short strings a reader skims — eyebrows, telemetry keys, a
 * tagline. Put it on real data (records, points, dates) and every table cell
 * spends its first half-second showing chevrons, which reads as a loading
 * failure rather than a flourish.
 */
export function MonoLabel({
  children,
  className,
  size = "sm",
  scramble = false,
  delay = 0,
}: {
  children: string;
  className?: string;
  size?: "sm" | "lg";
  scramble?: boolean;
  delay?: number;
}) {
  const base = cn(size === "lg" ? "type-hud-lg" : "type-hud", className);
  if (!scramble) return <span className={base}>{children}</span>;
  return <ScrambleText text={children} className={base} delay={delay} />;
}
