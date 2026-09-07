/**
 * PLACEHOLDER — not Venmo's official mark.
 *
 * This is a hand-drawn approximation of the wedge in their app icon, here so
 * the dues button reads as a payment link rather than shipping with a generic
 * arrow. Replace it with the real asset from Venmo's brand resources, which
 * also carry usage rules worth reading before this goes in front of anyone:
 * payment brands are particular about their marks, and a link that says "pay"
 * next to a wrong-looking logo is the kind of thing people are right to
 * hesitate over.
 *
 * Swapping it is a change to this file alone.
 */
export function VenmoMark({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M12.4 1.9c.53.87.77 1.77.77 2.9 0 3.63-3.1 8.34-5.61 11.2H2.9L1 2.6l4.14-.39.98 7.9c.92-1.5 2.06-3.85 2.06-5.45 0-.88-.15-1.48-.39-1.97L12.4 1.9Z"
        fill="currentColor"
      />
    </svg>
  );
}
