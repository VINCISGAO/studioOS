"use client";

import { oauthSignInAction } from "@/app/actions";
import type { Locale } from "@/lib/i18n";
import { getLoginVisual, type LoginRole, type LoginVisual } from "@/lib/studioos/login-theme";
import { cn } from "@/lib/utils";

const demoProviders = [
  { id: "google" as const, label: "Google", icon: "/images/auth-providers/google.svg", enabled: true },
  { id: "apple" as const, label: "Apple", icon: "/images/auth-providers/apple.svg", enabled: false },
  { id: "alipay" as const, label: "支付宝", icon: "/images/auth-providers/alipay.svg", enabled: false },
  { id: "wechat" as const, label: "微信", icon: "/images/auth-providers/wechat.svg", enabled: false },
  { id: "qq" as const, label: "QQ", icon: "/images/auth-providers/qq.svg", enabled: false }
];

function SocialHiddenFields({
  locale,
  role,
  nextPath,
  provider
}: {
  locale: Locale;
  role: LoginRole;
  nextPath: string;
  provider: string;
}) {
  return (
    <>
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="provider" value={provider} />
      <input type="hidden" name="expected_role" value={role} />
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
    </>
  );
}

export function LoginSocialButtons({
  locale,
  role,
  nextPath,
  demoMode,
  googleOAuthEnabled,
  visualOverride
}: {
  locale: Locale;
  role: LoginRole;
  nextPath: string;
  demoMode: boolean;
  googleOAuthEnabled: boolean;
  visualOverride?: LoginVisual;
}) {
  const visual = visualOverride ?? getLoginVisual(role);
  void demoMode;
  void googleOAuthEnabled;

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      {demoProviders.map(({ id, label, icon, enabled }) => {
        const comingSoonLabel = locale === "zh" ? `${label}（即将开放）` : `${label} (coming soon)`;
        const buttonClassName = cn(
          visual.socialBtn,
          "h-12 w-12 rounded-full bg-white p-2.5 shadow-sm",
          enabled ? "hover:bg-white" : "cursor-not-allowed opacity-40"
        );
        const buttonContent = (
          <img
            src={icon}
            alt=""
            className={cn("h-full w-full object-contain", id === "qq" ? "scale-[1.4]" : "")}
            aria-hidden
          />
        );

        if (!enabled) {
          return (
            <div key={id} className="min-w-0">
              <button
                type="button"
                disabled
                aria-label={comingSoonLabel}
                title={comingSoonLabel}
                className={buttonClassName}
              >
                {buttonContent}
              </button>
            </div>
          );
        }

        return (
          <form key={id} action={oauthSignInAction} className="min-w-0">
            <SocialHiddenFields locale={locale} role={role} nextPath={nextPath} provider={id} />
            <button type="submit" aria-label={label} title={label} className={buttonClassName}>
              {buttonContent}
            </button>
          </form>
        );
      })}
    </div>
  );
}
