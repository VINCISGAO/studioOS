"use client";

import type { Locale } from "@/lib/i18n";
import { getLoginVisual, type LoginRole, type LoginVisual } from "@/lib/studioos/login-theme";
import { cn } from "@/lib/utils";

type SocialProviderId = "google" | "apple" | "alipay" | "wechat" | "qq";

const socialProviders: Array<{ id: SocialProviderId; label: string; icon: string }> = [
  { id: "google", label: "Google", icon: "/images/auth-providers/google.svg" },
  { id: "apple", label: "Apple", icon: "/images/auth-providers/apple.svg" },
  { id: "alipay", label: "支付宝", icon: "/images/auth-providers/alipay.svg" },
  { id: "wechat", label: "微信", icon: "/images/auth-providers/wechat.svg" },
  { id: "qq", label: "QQ", icon: "/images/auth-providers/qq.svg" }
];

const COMING_SOON_PROVIDERS = new Set<SocialProviderId>(["apple", "alipay", "wechat", "qq"]);

/** Google links to OAuth start — backend returns a clear error if not configured. */
const LIVE_OAUTH_PROVIDERS = new Set<SocialProviderId>(["google"]);

function oauthHref(provider: SocialProviderId, locale: Locale, role: LoginRole, nextPath: string) {
  const params = new URLSearchParams({
    lang: locale,
    role,
    expected_role: role
  });
  if (nextPath) {
    params.set("next", nextPath);
  }
  return `/api/auth/oauth/${provider}?${params.toString()}`;
}

export function LoginSocialButtons({
  locale,
  role,
  nextPath,
  visualOverride
}: {
  locale: Locale;
  role: LoginRole;
  nextPath: string;
  visualOverride?: LoginVisual;
}) {
  const visual = visualOverride ?? getLoginVisual(role);

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      {socialProviders.map(({ id, label, icon }) => {
        const comingSoon = COMING_SOON_PROVIDERS.has(id);
        const liveOAuth = LIVE_OAUTH_PROVIDERS.has(id);
        const disabled = comingSoon;
        const comingSoonLabel = locale === "zh" ? `${label}（即将开放）` : `${label} (coming soon)`;
        const buttonClassName = cn(
          visual.socialBtn,
          "h-12 w-12 rounded-full bg-white p-2.5 shadow-sm transition",
          disabled
            ? "cursor-not-allowed opacity-40"
            : liveOAuth
              ? "cursor-pointer hover:bg-white hover:shadow-md active:scale-95"
              : "hover:bg-white"
        );
        const buttonContent = (
          <img
            src={icon}
            alt=""
            className={cn("h-full w-full object-contain", id === "qq" ? "scale-[1.4]" : "")}
            aria-hidden
          />
        );

        if (disabled) {
          return (
            <div key={id} className="min-w-0">
              <button
                type="button"
                disabled
                aria-label={comingSoon ? comingSoonLabel : comingSoonLabel}
                title={comingSoon ? comingSoonLabel : comingSoonLabel}
                className={buttonClassName}
              >
                {buttonContent}
              </button>
            </div>
          );
        }

        return (
          <div key={id} className="min-w-0">
            <a
              href={oauthHref(id, locale, role, nextPath)}
              aria-label={label}
              title={label}
              className={buttonClassName}
            >
              {buttonContent}
            </a>
          </div>
        );
      })}
    </div>
  );
}
