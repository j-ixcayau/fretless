import { useId } from "react";

/**
 * Chordly brand mark — three chord-chart columns with fret dots on the
 * indigo→green gradient. Used in the app header, auth screen, and as the
 * source for the favicon / PWA icons.
 */
export default function Logo({ size = 32, className }) {
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 84 84"
      className={className}
      role="img"
      aria-label="Chordly"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="84" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5b4fe0" />
          <stop offset="1" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <rect width="84" height="84" rx="18" fill={`url(#${id})`} />
      <rect x="10" y="10" width="18" height="64" rx="3" fill="#0d0c1f" opacity="0.92" />
      <rect x="33" y="30" width="18" height="44" rx="3" fill="#0d0c1f" opacity="0.78" />
      <rect x="56" y="18" width="18" height="56" rx="3" fill="#0d0c1f" opacity="0.65" />
      <circle cx="19" cy="24" r="4.5" fill="#34d399" />
      <circle cx="42" cy="42" r="4.5" fill="#34d399" />
      <circle cx="65" cy="32" r="4.5" fill="#34d399" />
    </svg>
  );
}
