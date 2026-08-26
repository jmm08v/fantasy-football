import { cn } from "@/lib/cn";

/**
 * Stand-in for real photography.
 *
 * Every image on the reference site is a rounded rect with a 1px white/40
 * hairline sitting on top of it — that overlay is what keeps photos feeling
 * mounted into the interface instead of pasted onto it. Keep the hairline when
 * you swap in a real <Image>; it does more for the look than the photo does.
 */
export function MediaSlot({
  label,
  className,
  aspect = "aspect-[2/3]",
  radius = "rounded-[24px] lg:rounded-[80px]",
}: {
  label?: string;
  className?: string;
  aspect?: string;
  radius?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", radius, className)}>
      <div
        className={cn(
          "from-turf-raised to-turf w-full bg-gradient-to-br via-[#232830]",
          aspect,
        )}
      />
      {label && (
        <span className="type-hud absolute bottom-6 left-6 opacity-30">{label}</span>
      )}
      <div className="hairline" />
    </div>
  );
}
