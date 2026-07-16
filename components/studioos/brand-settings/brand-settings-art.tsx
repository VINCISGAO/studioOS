/** Decorative SVG assets for brand account security settings. */

export function BrandSettingsShieldIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden>
      <defs>
        <linearGradient id="bs-shield" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="bs-shield-glow" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#EDE9FE" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#DDD6FE" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="148" rx="68" ry="10" fill="#E4E4E7" opacity="0.45" />
      <rect x="28" y="18" width="20" height="20" rx="5" fill="#DDD6FE" transform="rotate(-12 38 28)" />
      <rect x="152" y="32" width="16" height="16" rx="4" fill="#C4B5FD" opacity="0.8" transform="rotate(14 160 40)" />
      <rect x="12" y="72" width="14" height="14" rx="3" fill="#EDE9FE" transform="rotate(-8 19 79)" />
      <rect x="168" y="88" width="12" height="12" rx="3" fill="#A78BFA" opacity="0.65" />
      <path
        d="M100 28 L148 48 V88 C148 112 128 128 100 136 C72 128 52 112 52 88 V48 Z"
        fill="url(#bs-shield-glow)"
      />
      <path
        d="M100 36 L140 52 V86 C140 106 124 120 100 126 C76 120 60 106 60 86 V52 Z"
        fill="url(#bs-shield)"
        stroke="#7C3AED"
        strokeWidth="2"
      />
      <rect x="88" y="68" width="24" height="20" rx="5" fill="white" opacity="0.95" />
      <path
        d="M100 74 V86 M94 80 H106"
        stroke="#7C3AED"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="100" cy="80" r="10" fill="none" stroke="white" strokeWidth="2" opacity="0.5" />
    </svg>
  );
}

export function BrandSettingsTwoFactorIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="bs-2fa-phone" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#7DD3FC" />
        </linearGradient>
      </defs>
      <rect x="34" y="8" width="52" height="84" rx="10" fill="url(#bs-2fa-phone)" stroke="#38BDF8" strokeWidth="1.5" />
      <rect x="40" y="18" width="40" height="58" rx="4" fill="white" opacity="0.9" />
      <circle cx="60" cy="47" r="12" fill="#0EA5E9" opacity="0.85" />
      <path d="M56 47 L58.5 50 L64 43" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="52" y="80" width="16" height="3" rx="1.5" fill="white" opacity="0.7" />
      <rect x="88" y="24" width="14" height="14" rx="4" fill="#E0F2FE" transform="rotate(10 95 31)" />
      <rect x="12" y="40" width="12" height="12" rx="3" fill="#BAE6FD" opacity="0.7" />
    </svg>
  );
}
