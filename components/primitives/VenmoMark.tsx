import Image from "next/image";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/cn";

/**
 * Venmo's app icon, supplied by the league and resized for the web — never
 * recoloured, cropped or redrawn, which is the part their brand rules care
 * about. The source lives at the repo root; public/media/venmo.png is a
 * straight 128px resample of it, large enough for a 3x screen at this size.
 *
 * Its container is the same #008CFF as the button it sits on, and its corners
 * are transparent, so on the dues button the rounded square merges into the
 * pill and what reads is the white V. That is the intended look, but it does
 * mean the mark's container is invisible there — on any other background the
 * full icon shows, unaltered.
 */
export function VenmoMark({ className }: { className?: string }) {
  return (
    <Image
      src={asset("/media/venmo.png")}
      alt=""
      width={128}
      height={128}
      // Eager, not next/image's lazy default: four kilobytes inside a call to
      // action is not worth deferring, and deferring it means the logo pops in
      // after the button has already drawn.
      loading="eager"
      // 12px matches the arrow icons on the buttons stacked above, which is
      // what keeps all three pills the same height — the icon is the tallest
      // thing in the row, so it sets the height.
      className={cn("h-3 w-3", className)}
    />
  );
}
