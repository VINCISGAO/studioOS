"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Clapperboard, Globe2, Sparkles, UserRound } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { studioOS } from "@/lib/studioos/vocabulary";
import type { LoginRole } from "@/lib/studioos/login-theme";
import { cn } from "@/lib/utils";

type LandingAuthPanelProps = {
  locale: Locale;
  isLoggedIn: boolean;
  portalHref: string;
  portalLabel: string;
};

function loginHref(locale: Locale, role: LoginRole, email?: string) {
  const params = new URLSearchParams({ lang: locale, role });
  if (email?.trim()) params.set("email", email.trim());
  return `/login?${params.toString()}`;
}

export function LandingAuthPanel({
  locale,
  isLoggedIn,
  portalHref,
  portalLabel
}: LandingAuthPanelProps) {
  const t = landingText("split", locale);
  const [role, setRole] = useState<LoginRole>("brand");
  const [email, setEmail] = useState("");

  function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.location.href = loginHref(locale, role, email);
  }

  return (
    <div className="relative flex min-h-[56vh] flex-col bg-white text-zinc-950 lg:min-h-[100dvh]">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10 lg:px-12">
        <MarketingHomeLink locale={locale} className="inline-flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">{studioOS.productName}</span>
        </MarketingHomeLink>

        <div className="flex items-center gap-2">
          <Globe2 className="hidden h-4 w-4 text-zinc-400 sm:block" />
          <LanguageSwitcher locale={locale} tone="light" />
        </div>
      </header>

      <div className="flex flex-1 flex-col justify-center px-6 pb-10 sm:px-10 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="landing-split-enter">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-400">
              {t.panelEyebrow}
            </p>
            <h2 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.04em] text-zinc-950 sm:text-[2rem]">
              {isLoggedIn ? t.welcomeBack : t.panelTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {isLoggedIn ? t.loggedInSubtitle : t.panelSubtitle}
            </p>
          </div>

          {isLoggedIn ? (
            <div className="landing-split-enter landing-split-enter-delay-1 mt-8 space-y-3">
              <Link
                href={portalHref}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                {portalLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={withLocale("/pricing", locale)}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                {t.explorePricing}
              </Link>
            </div>
          ) : (
            <div className="landing-split-enter landing-split-enter-delay-1 mt-8">
              <div
                className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100/90 p-1"
                role="tablist"
                aria-label={locale === "zh" ? "选择身份" : "Choose role"}
              >
                <RoleTab active={role === "brand"} onClick={() => setRole("brand")} icon={UserRound}>
                  {t.brandTab}
                </RoleTab>
                <RoleTab active={role === "creator"} onClick={() => setRole("creator")} icon={Clapperboard}>
                  {t.creatorTab}
                </RoleTab>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleContinue}>
                <label className="block">
                  <span className="text-xs font-medium text-zinc-700 sm:text-sm">{t.emailLabel}</span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-500/15"
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 text-sm font-medium text-white transition hover:bg-zinc-800"
                >
                  {t.continue}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-200" />
                <p className="relative mx-auto w-fit bg-white px-3 text-xs text-zinc-400">{t.orDivider}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href={loginHref(locale, "brand")}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  {t.signInBrand}
                </Link>
                <Link
                  href={loginHref(locale, "creator")}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  {t.signInCreator}
                </Link>
              </div>

              <p className="mt-6 text-center text-sm text-zinc-500">
                {t.noAccount}{" "}
                <Link href={loginHref(locale, role)} className="font-medium text-violet-600 hover:text-violet-700">
                  {t.createAccount}
                </Link>
              </p>
            </div>
          )}

          <p className="landing-split-enter landing-split-enter-delay-2 mt-10 text-center text-xs leading-5 text-zinc-400">
            {t.legalNotice}
          </p>
        </div>
      </div>
    </div>
  );
}

function RoleTab({
  active,
  onClick,
  icon: Icon,
  children
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-[0.65rem] py-2.5 text-[13px] font-medium transition-all duration-200",
        active ? "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200/80" : "text-zinc-500 hover:text-zinc-700"
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-80" />
      {children}
    </button>
  );
}
