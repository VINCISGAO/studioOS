"use client";

import { demoUserForSocialProvider, isTestSocialProvider, type DemoSocialProvider } from "@/lib/demo-auth";
import type { Locale } from "@/lib/i18n";
import { getLoginVisual, type LoginRole, type LoginVisual } from "@/lib/studioos/login-theme";
import { cn } from "@/lib/utils";

const demoProviders = [
  { id: "google" as const, label: "Google", icon: "/images/auth-providers/google.svg" },
  { id: "apple" as const, label: "Apple", icon: "/images/auth-providers/apple.svg" },
  { id: "alipay" as const, label: "支付宝", icon: "/images/auth-providers/alipay.svg" },
  { id: "wechat" as const, label: "微信", icon: "/images/auth-providers/wechat.svg" },
  { id: "qq" as const, label: "QQ", icon: "/images/auth-providers/qq.svg" }
];

function isProviderOAuthEnabled(
  id: DemoSocialProvider,
  googleOAuthEnabled: boolean,
  alipayOAuthEnabled: boolean
) {
  if (id === "google") return googleOAuthEnabled;
  if (id === "alipay") return alipayOAuthEnabled;
  return false;
}

function testAccountLabel(locale: Locale, accountLabel: string) {
  return locale === "zh" ? `${accountLabel}（测试号）` : `${accountLabel} (test account)`;
}

function oauthHref(provider: DemoSocialProvider, locale: Locale, role: LoginRole, nextPath: string) {
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
  alipayOAuthEnabled = false,
  visualOverride
}: {
  locale: Locale;
  role: LoginRole;
  nextPath: string;
  demoMode: boolean;
  googleOAuthEnabled: boolean;
  alipayOAuthEnabled?: boolean;
  visualOverride?: LoginVisual;
}) {
  const visual = visualOverride ?? getLoginVisual(role);
  const tabRole = role === "creator" ? "creator" : "brand";

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      {demoProviders.map(({ id, label, icon }) => {
        const oauthEnabled = isProviderOAuthEnabled(id, googleOAuthEnabled, alipayOAuthEnabled);
        const testAccount = demoUserForSocialProvider(id, tabRole);
        const useTestAccount =
          Boolean(testAccount) && (demoMode || isTestSocialProvider(id));
        const comingSoonLabel = locale === "zh" ? `${label}（即将开放）` : `${label} (coming soon)`;
        const testLabel = testAccount ? testAccountLabel(locale, testAccount.label) : comingSoonLabel;
        const buttonClassName = cn(
          visual.socialBtn,
          "h-12 w-12 rounded-full bg-white p-2.5 shadow-sm",
          oauthEnabled || useTestAccount ? "hover:bg-white" : "cursor-not-allowed opacity-40"
        );
        const buttonContent = (
          <img
            src={icon}
            alt=""
            className={cn("h-full w-full object-contain", id === "qq" ? "scale-[1.4]" : "")}
            aria-hidden
          />
        );

        if (!oauthEnabled && !useTestAccount) {
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

        if (useTestAccount) {
          return (
            <form key={id} action="/api/auth/demo-social" method="POST" className="min-w-0">
              <SocialHiddenFields locale={locale} role={role} nextPath={nextPath} provider={id} />
              <button type="submit" aria-label={testLabel} title={testLabel} className={buttonClassName}>
                {buttonContent}
              </button>
            </form>
          );
        }

        const href = oauthHref(id, locale, role, nextPath);
        return (
          <div key={id} className="min-w-0">
            <a href={href} aria-label={label} title={label} className={buttonClassName}>
              {buttonContent}
            </a>
          </div>
        );
      })}
    </div>
  );
}
