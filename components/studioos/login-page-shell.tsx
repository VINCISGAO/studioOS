"use client";

import Link from "next/link";
import {
  Clapperboard,
  Globe2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Users
} from "lucide-react";
import { LoginLanguageSwitcher } from "@/components/studioos/login-language-switcher";
import { LoginSocialButtons } from "@/components/studioos/login-social-buttons";
import { LoginWorkspace } from "@/components/studioos/login-workspace";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import type { Locale } from "@/lib/i18n";
import { getLoginVisual, type LoginRole } from "@/lib/studioos/login-theme";
import { studioOS, formatHeroHeadlineLine1 } from "@/lib/studioos/vocabulary";
import { marketingHeadlineClassName } from "@/lib/studioos/marketing-headline-font";
import { cn } from "@/lib/utils";

export type LoginFeature = {
  title: string;
  description: string;
  icon: "users" | "trending" | "shield" | "target" | "clapperboard";
};

export type LoginPageCopy = {
  welcome: string;
  brandLoginTitle: string;
  welcomeSubtitleBrand: string;
  creatorWelcome: string;
  creatorWelcomeSubtitle: string;
  brandTab: string;
  creatorTab: string;
  brandHeroLine1: string;
  brandHeroLine2: string;
  brandHeroHighlight: string;
  brandHeroSubtitle: string;
  brandFeatures: LoginFeature[];
  creatorHeroLine1: string;
  creatorHeroLine1Tail?: string;
  creatorHeroLine2: string;
  creatorHeroLine2Tail?: string;
  creatorHeroHighlightLine1: string;
  creatorHeroHighlightLine2: string;
  creatorHeroSubtitle: string;
  creatorFeatures: LoginFeature[];
  brandLogos: string[];
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  rememberMe: string;
  forgotPassword: string;
  login: string;
  socialDivider: string;
  noAccount: string;
  signUp: string;
  rights: string;
};

type LoginPageShellProps = {
  locale: Locale;
  role: LoginRole;
  nextPath: string;
  initialEmail: string;
  error?: string;
  errorCode?: string;
  demoMode: boolean;
  t: LoginPageCopy;
};

function roleTabHref(locale: Locale, role: LoginRole, nextPath: string) {
  const params = new URLSearchParams({ lang: locale, role });
  if (nextPath) params.set("next", nextPath);
  return `/login?${params.toString()}`;
}

const featureIcons = {
  users: Users,
  trending: TrendingUp,
  shield: ShieldCheck,
  target: Target,
  clapperboard: Clapperboard
};

function CreatorHeadlineGradient({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
      {children}
    </span>
  );
}

function CreatorHeadlineLine({
  lead,
  tail,
  highlight,
  stacked = false
}: {
  lead: string;
  tail?: string;
  highlight: string;
  stacked?: boolean;
}) {
  if (stacked && tail) {
    return (
      <>
        <span className="block">{lead}</span>
        <span className="mt-1 block">
          {tail}
          <CreatorHeadlineGradient>{highlight}</CreatorHeadlineGradient>
        </span>
      </>
    );
  }

  const prefix = `${lead}${tail ?? ""}`.replace(highlight, "");

  return (
    <>
      {prefix}
      <CreatorHeadlineGradient>{highlight}</CreatorHeadlineGradient>
    </>
  );
}

function LoginMarketingHeadline({
  role,
  locale,
  t,
  className
}: {
  role: LoginRole;
  locale: Locale;
  t: LoginPageCopy;
  className?: string;
}) {
  const isBrand = role === "brand";
  const brandHeadline = studioOS.heroHeadline[locale];

  return (
    <h1
      className={cn(
        "font-semibold",
        locale === "zh"
          ? "text-pretty leading-[1.12] tracking-[0.04em]"
          : cn(marketingHeadlineClassName("en"), "text-pretty leading-[1.12] tracking-[-0.02em]"),
        isBrand ? "text-white" : "text-zinc-950",
        className
      )}
    >
      {isBrand ? (
        <>
          <span className="block">{formatHeroHeadlineLine1(brandHeadline.line1)}</span>
          <span className="mt-3 block">
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
              {brandHeadline.highlight}
            </span>
            {brandHeadline.line2.replace(brandHeadline.highlight, "")}
          </span>
        </>
      ) : (
        <>
          <span className="block">
            <CreatorHeadlineLine
              lead={formatHeroHeadlineLine1(t.creatorHeroLine1)}
              tail={t.creatorHeroLine1Tail}
              highlight={t.creatorHeroHighlightLine1}
              stacked={locale === "en" && Boolean(t.creatorHeroLine1Tail)}
            />
          </span>
          <span className="mt-3 block">
            <CreatorHeadlineLine
              lead={t.creatorHeroLine2}
              tail={t.creatorHeroLine2Tail}
              highlight={t.creatorHeroHighlightLine2}
              stacked={locale === "en" && Boolean(t.creatorHeroLine2Tail)}
            />
          </span>
        </>
      )}
    </h1>
  );
}

function LoginTrustLogos({ logos, isBrand }: { logos: string[]; isBrand: boolean }) {
  return (
    <div className="mt-12 hidden flex-wrap items-center gap-x-8 gap-y-3 opacity-70 lg:flex">
      {logos.map((logo) => (
        <span
          key={logo}
          className={cn(
            "text-sm font-semibold tracking-[0.18em]",
            isBrand ? "text-white/80" : "text-zinc-500"
          )}
        >
          {logo}
        </span>
      ))}
    </div>
  );
}

function LoginMobileIntro({
  role,
  locale,
  t,
  visual
}: {
  role: LoginRole;
  locale: Locale;
  t: LoginPageCopy;
  visual: ReturnType<typeof getLoginVisual>;
}) {
  const isBrand = role === "brand";
  const heroSubtitle = isBrand ? t.brandHeroSubtitle : t.creatorHeroSubtitle;

  return (
    <div className="mb-6 space-y-3 sm:mb-8 lg:hidden">
      <LoginMarketingHeadline role={role} locale={locale} t={t} className="text-[2.125rem] sm:text-[2.5rem]" />
      <div
        className={cn(
          "h-0.5 w-9 rounded-full",
          isBrand
            ? "bg-gradient-to-r from-violet-400 via-indigo-300 to-violet-400"
            : "bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-500"
        )}
        aria-hidden
      />
      <p className={cn("max-w-md text-[13px] leading-6 sm:text-sm sm:leading-7", isBrand ? visual.panelMuted : "text-zinc-600")}>
        {heroSubtitle}
      </p>
    </div>
  );
}

export function LoginPageShell({
  locale,
  role,
  nextPath,
  initialEmail,
  error,
  errorCode,
  demoMode,
  t
}: LoginPageShellProps) {
  const isBrand = role === "brand";
  const visual = getLoginVisual(role);
  const desktopCardTitle = isBrand ? t.brandLoginTitle : t.creatorWelcome;
  const cardSubtitle = isBrand ? t.welcomeSubtitleBrand : t.creatorWelcomeSubtitle;

  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${visual.bg})` }} aria-hidden />
      <div className="absolute inset-0" style={{ background: visual.overlay }} aria-hidden />

      <div className={cn("relative z-10 flex min-h-[100dvh] flex-col", visual.panelText)}>
        <header className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-5 py-5 sm:px-8 sm:py-6 lg:px-10 xl:px-12">
          <MarketingHomeLink locale={locale} className="inline-flex items-center gap-2.5">
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl",
                isBrand ? "bg-white text-zinc-950" : "bg-zinc-950 text-white"
              )}
            >
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">{studioOS.productName}</span>
          </MarketingHomeLink>

          <div className="flex items-center gap-2">
            <Globe2 className={cn("hidden h-4 w-4 sm:block", isBrand ? "text-zinc-400" : "text-zinc-500")} />
            <LoginLanguageSwitcher locale={locale} compact={isBrand} />
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col gap-6 px-5 pb-8 sm:px-8 max-lg:justify-start lg:gap-12 lg:px-10 lg:pb-12 xl:gap-16 xl:px-12 lg:flex-row lg:items-center lg:justify-between">
          <section className="hidden max-w-xl lg:block lg:flex-1 lg:pl-6 lg:py-6 xl:pl-14">
            {isBrand ? (
              <>
                <LoginMarketingHeadline role={role} locale={locale} t={t} className="text-[2rem] sm:text-[2.75rem] lg:text-[3.25rem]" />
                <p className={cn("mt-4 max-w-lg text-[15px] leading-7 sm:text-base", visual.panelMuted)}>{t.brandHeroSubtitle}</p>
                <ul className="mt-8 hidden space-y-5 lg:block lg:mt-10">
                  {t.brandFeatures.map((feature, index) => {
                    const Icon = featureIcons[feature.icon];
                    return (
                      <li key={feature.title} className="flex gap-4">
                        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1", visual.featureIcon[index])}>
                          <Icon className="h-5 w-5" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0 pt-0.5">
                          <p className="text-[15px] font-medium leading-6">{feature.title}</p>
                          <p className={cn("mt-1 text-sm leading-6", visual.panelMuted)}>{feature.description}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <LoginTrustLogos logos={t.brandLogos} isBrand={isBrand} />
              </>
            ) : (
              <>
                <LoginMarketingHeadline role={role} locale={locale} t={t} className="text-[2rem] sm:text-[2.75rem] lg:text-[3.25rem]" />
                <p className={cn("mt-4 max-w-lg text-[15px] leading-7 sm:text-base", visual.panelMuted)}>{t.creatorHeroSubtitle}</p>
                <ul className="mt-8 space-y-5 sm:mt-10">
                  {t.creatorFeatures.map((feature, index) => {
                    const Icon = featureIcons[feature.icon];
                    return (
                      <li key={feature.title} className="flex gap-4">
                        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1", visual.featureIcon[index])}>
                          <Icon className="h-5 w-5" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0 pt-0.5">
                          <p className="text-[15px] font-medium leading-6">{feature.title}</p>
                          <p className={cn("mt-1 text-sm leading-6", visual.panelMuted)}>{feature.description}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <LoginTrustLogos logos={t.brandLogos} isBrand={isBrand} />
              </>
            )}

            <p className={cn("mt-10 hidden text-xs lg:block", visual.panelMuted)}>
              © {new Date().getFullYear()} {studioOS.productName}. {t.rights}
            </p>
          </section>

          <section className="w-full lg:w-[min(100%,500px)] lg:shrink-0 lg:-translate-x-3 xl:w-[520px] xl:-translate-x-6 max-lg:mx-auto max-lg:mt-10 max-lg:max-w-[520px] sm:max-lg:mt-12">
            <LoginMobileIntro role={role} locale={locale} t={t} visual={visual} />

            <div className={cn("rounded-[1.35rem] p-5 sm:p-8 lg:p-9", visual.card)}>
              <h2 className={cn("text-xl font-semibold tracking-[-0.03em] sm:text-[1.65rem]", visual.cardTitle)}>
                {desktopCardTitle}
              </h2>
              <p className={cn("mt-1 text-[13px] leading-5 sm:text-sm", visual.cardMuted)}>{cardSubtitle}</p>

              <nav className={cn("mt-5 grid grid-cols-2 gap-1 rounded-xl sm:mt-6", visual.tabWrap)} aria-label={locale === "zh" ? "登录身份" : "Sign-in role"}>
                <RoleTab href={roleTabHref(locale, "brand", nextPath)} active={isBrand} visual={visual} icon={UserRound}>
                  {t.brandTab}
                </RoleTab>
                <RoleTab href={roleTabHref(locale, "creator", nextPath)} active={!isBrand} visual={visual} icon={Clapperboard}>
                  {t.creatorTab}
                </RoleTab>
              </nav>

              <div className="mt-5 sm:mt-6">
                <LoginWorkspace
                  locale={locale}
                  role={role}
                  nextPath={nextPath}
                  initialEmail={initialEmail}
                  error={error}
                  errorCode={errorCode}
                  t={t}
                />
              </div>

              {demoMode ? (
                <>
                  <div className="relative mt-6 py-1">
                    <div className={cn("absolute inset-x-0 top-1/2 h-px", isBrand ? "bg-white/10" : "bg-zinc-200")} />
                    <p className={cn("relative mx-auto w-fit px-3 text-[11px] sm:text-xs", visual.divider, isBrand ? "bg-black/45" : "bg-white/75")}>
                      {t.socialDivider}
                    </p>
                  </div>
                  <LoginSocialButtons locale={locale} role={role} nextPath={nextPath} />
                </>
              ) : null}

              <p className={cn("mt-6 text-center text-sm", visual.cardMuted)}>
                {t.noAccount}{" "}
                <button type="button" className={cn("font-medium", visual.link)}>
                  {t.signUp}
                </button>
              </p>
            </div>

            <p className={cn("mt-4 text-balance text-center text-sm leading-6 lg:hidden", isBrand ? visual.panelMuted : "text-zinc-600")}>
              {cardSubtitle}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

function RoleTab({
  href,
  active,
  visual,
  icon: Icon,
  children
}: {
  href: string;
  active: boolean;
  visual: ReturnType<typeof getLoginVisual>;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-[0.65rem] py-2 text-[12px] font-medium transition-all duration-200 sm:gap-2 sm:py-2.5 sm:text-[13px]",
        active ? visual.tabActive : visual.tabInactive
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-80" />
      {children}
    </Link>
  );
}
