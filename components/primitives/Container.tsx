import { cn } from "@/lib/cn";

/**
 * The only layout primitive. 6 columns on mobile, 12 on desktop, capped at
 * 1720px. Every section on the reference site sits on this exact grid, which
 * is why wildly different blocks still line up with each other.
 */
export function Container({
  className,
  children,
  as: Tag = "div",
}: {
  className?: string;
  children: React.ReactNode;
  as?: "div" | "header" | "footer" | "nav";
}) {
  return (
    <Tag
      className={cn(
        "mx-auto grid w-full max-w-[1720px] grid-cols-6 gap-x-4 px-8 lg:grid-cols-12 lg:px-12",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
