"use client";

import { demoSocialSignInAction } from "@/app/actions";
import type { Locale } from "@/lib/i18n";
import { getLoginVisual, type LoginRole } from "@/lib/studioos/login-theme";
import { cn } from "@/lib/utils";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4 shrink-0", className)} aria-hidden>
      <path
        fill="currentColor"
        d="M16.823 12.653c-.033-3.259 2.662-4.816 2.784-4.892-1.513-2.212-3.867-2.515-4.711-2.555-2.007-.204-3.918 1.183-4.936 1.183-1.025 0-2.598-1.158-4.271-1.127-2.199.033-4.229 1.282-5.359 3.256-2.285 3.963-1.873 9.825 1.635 13.314 1.216 1.172 2.667 2.485 4.571 2.439 1.839-.047 2.387-.952 4.483-.952 2.091 0 2.599.952 4.372.919 1.807-.028 2.948-1.185 4.155-2.362 1.31-1.212 1.849-2.384 1.879-2.444-.041-.019-3.608-1.385-3.645-5.508zm-3.196-9.199c.982-1.191 1.647-2.851 1.466-4.509-1.419.058-3.134.937-4.154 2.128-.911 1.055-1.707 2.744-1.492 4.361 1.565.122 3.168-.797 4.18-1.98z"
      />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
      <path
        fill="#5865F2"
        d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"
      />
    </svg>
  );
}

const providers = [
  { id: "google" as const, label: "Google", Icon: GoogleIcon },
  { id: "apple" as const, label: "Apple", Icon: AppleIcon },
  { id: "discord" as const, label: "Discord", Icon: DiscordIcon }
];

export function LoginSocialButtons({
  locale,
  role,
  nextPath
}: {
  locale: Locale;
  role: LoginRole;
  nextPath: string;
}) {
  const visual = getLoginVisual(role);

  return (
    <div className="mt-6 grid grid-cols-3 gap-3">
      {providers.map(({ id, label, Icon }) => (
        <form key={id} action={demoSocialSignInAction} className="min-w-0">
          <input type="hidden" name="lang" value={locale} />
          <input type="hidden" name="provider" value={id} />
          <input type="hidden" name="expected_role" value={role} />
          {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
          <button
            type="submit"
            aria-label={label}
            className={cn(visual.socialBtn, "w-full min-w-0 px-2 sm:px-3")}
          >
            <Icon />
            <span className="truncate text-xs sm:text-sm">{label}</span>
          </button>
        </form>
      ))}
    </div>
  );
}
