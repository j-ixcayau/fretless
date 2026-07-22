import { cn } from "../../lib/utils";

const SHARP_KEYS = ["G", "D", "A", "E", "B", "F#", "C#"];

/**
 * Musical-key pill. Sharp-side keys read blue, flat/other keys read green,
 * per the redesign token table.
 */
export default function KeyBadge({ musicKey, className }) {
  const key = musicKey;
  const root = key?.match(/^[A-G][#b]?/)?.[0];
  const isSharp = root ? SHARP_KEYS.includes(root) : false;

  return (
    <span
      className={cn(
        "px-[9px] py-[3px] rounded-lg text-[11px] font-bold leading-none",
        isSharp
          ? "bg-[var(--key-sharp-bg)] text-[var(--key-sharp-fg)]"
          : "bg-[var(--key-flat-bg)] text-[var(--key-flat-fg)]",
        className,
      )}
    >
      {key || "?"}
    </span>
  );
}
