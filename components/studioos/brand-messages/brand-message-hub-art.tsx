/** Decorative SVG for brand message center empty detail panel. */

export function BrandMessageBubbleIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden>
      <defs>
        <linearGradient id="bm-bubble" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EDE9FE" />
          <stop offset="100%" stopColor="#C4B5FD" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="108" rx="48" ry="8" fill="#E4E4E7" opacity="0.5" />
      <path
        d="M48 36h64a12 12 0 0 1 12 12v36a12 12 0 0 1-12 12H72l-12 14v-14H48a12 12 0 0 1-12-12V48a12 12 0 0 1 12-12z"
        fill="url(#bm-bubble)"
        stroke="#A78BFA"
        strokeWidth="1.5"
      />
      <circle cx="64" cy="60" r="4" fill="#7C3AED" opacity="0.5" />
      <circle cx="80" cy="60" r="4" fill="#7C3AED" opacity="0.5" />
      <circle cx="96" cy="60" r="4" fill="#7C3AED" opacity="0.5" />
      <rect x="118" y="28" width="14" height="14" rx="4" fill="#DDD6FE" transform="rotate(10 125 35)" />
      <rect x="24" y="48" width="12" height="12" rx="3" fill="#EDE9FE" transform="rotate(-12 30 54)" />
      <rect x="130" y="56" width="10" height="10" rx="2" fill="#C4B5FD" opacity="0.7" />
    </svg>
  );
}
