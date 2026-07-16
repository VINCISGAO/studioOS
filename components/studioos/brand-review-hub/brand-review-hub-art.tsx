/** Decorative SVG for brand review hub empty state. */

export function BrandReviewClapperIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden>
      <defs>
        <linearGradient id="brh-clap-top" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EDE9FE" />
          <stop offset="100%" stopColor="#C4B5FD" />
        </linearGradient>
        <linearGradient id="brh-clap-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="108" rx="52" ry="8" fill="#E4E4E7" opacity="0.55" />
      <rect x="44" y="36" width="72" height="52" rx="8" fill="url(#brh-clap-body)" />
      <rect x="36" y="24" width="88" height="18" rx="4" fill="url(#brh-clap-top)" stroke="#A78BFA" strokeWidth="1.5" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={42 + i * 13} y="27" width="8" height="12" rx="1" fill="white" opacity="0.85" />
      ))}
      <rect x="56" y="52" width="48" height="28" rx="4" fill="#FAFAFA" opacity="0.9" />
      <circle cx="80" cy="66" r="10" fill="#A78BFA" opacity="0.35" />
      <polygon points="76,62 76,70 84,66" fill="white" opacity="0.9" />
      <rect x="118" y="18" width="18" height="18" rx="5" fill="#DDD6FE" transform="rotate(12 127 27)" />
      <rect x="18" y="44" width="14" height="14" rx="4" fill="#C4B5FD" opacity="0.8" transform="rotate(-12 25 51)" />
      <rect x="128" y="52" width="12" height="12" rx="3" fill="#EDE9FE" transform="rotate(8 134 58)" />
    </svg>
  );
}
