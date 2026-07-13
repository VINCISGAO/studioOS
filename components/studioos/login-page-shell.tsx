"use client";

import Link from "next/link";
import {
  Clapperboard,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRound,
  Users
} from "lucide-react";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { AcknowledgeAlertProvider } from "@/components/studioos/acknowledge-alert-provider";
import { GoogleOneTap } from "@/components/studioos/google-one-tap";
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
  googleOAuthEnabled?: boolean;
  googleOneTapClientId?: string;
  t: LoginPageCopy;
};

function roleTabHref(role: LoginRole, nextPath: string) {
  const params = new URLSearchParams({ role });
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
    <span className="inline bg-gradient-to-r from-[#111111] from-0% via-[#6d5cff] via-38% to-[#6d5cff] bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(109,92,255,0.12)]">
      {children}
    </span>
  );
}

function BrandHeadlineGradient({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline bg-gradient-to-r from-white via-[#dfe7ff] to-[#b8c2ff] bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(184,194,255,0.14)]">
      {children}
    </span>
  );
}

function CreatorHeadlineLine({
  lead,
  tail,
  highlight,
  stacked = false,
  compactSpacing = false
}: {
  lead: string;
  tail?: string;
  highlight: string;
  stacked?: boolean;
  compactSpacing?: boolean;
}) {
  if (stacked && tail) {
    return (
      <>
        <span className="block">{lead}</span>
        <span className={cn("block", compactSpacing ? "mt-0.5" : "mt-1")}>
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
  className,
  mobileIntro = false
}: {
  role: LoginRole;
  locale: Locale;
  t: LoginPageCopy;
  className?: string;
  mobileIntro?: boolean;
}) {
  const isBrand = role === "brand";
  const lineLeading = mobileIntro ? "leading-[0.9]" : "leading-[1.12]";
  const betweenLines = mobileIntro ? "mt-[0.36rem]" : "mt-[0.45rem]";

  return (
    <h1
      className={cn(
        "font-semibold",
        locale === "zh"
          ? cn("text-pretty tracking-[0.04em]", lineLeading)
          : cn(marketingHeadlineClassName("en"), "text-pretty tracking-[-0.02em]", lineLeading),
        isBrand ? "text-white" : "text-zinc-950",
        mobileIntro && "text-center",
        className
      )}
    >
      {isBrand ? (
        <>
          <span className="block">
            <BrandHeadlineGradient>{formatHeroHeadlineLine1(t.brandHeroLine1)}</BrandHeadlineGradient>
          </span>
          <span className={cn("block", betweenLines)}>
            <BrandHeadlineGradient>{t.brandHeroLine2}</BrandHeadlineGradient>
          </span>
        </>
      ) : (
        <>
          <span className={cn("block", locale === "en" && "lg:whitespace-nowrap")}>
            <CreatorHeadlineLine
              lead={formatHeroHeadlineLine1(t.creatorHeroLine1)}
              tail={t.creatorHeroLine1Tail}
              highlight={t.creatorHeroHighlightLine1}
              stacked={locale === "en" && Boolean(t.creatorHeroLine1Tail)}
              compactSpacing={mobileIntro}
            />
          </span>
          <span className={cn("block", betweenLines, locale === "en" && "lg:whitespace-nowrap")}>
            <CreatorHeadlineLine
              lead={t.creatorHeroLine2}
              tail={t.creatorHeroLine2Tail}
              highlight={t.creatorHeroHighlightLine2}
              stacked={locale === "en" && Boolean(t.creatorHeroLine2Tail)}
              compactSpacing={mobileIntro}
            />
          </span>
        </>
      )}
    </h1>
  );
}

function LoginHeroSubtitle({
  text,
  isBrand,
  className
}: {
  text: string;
  isBrand: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[13px] leading-[1.2rem] sm:text-sm sm:leading-[1.4rem]",
        isBrand ? "text-white sm:whitespace-nowrap" : "max-w-md text-zinc-600",
        className
      )}
    >
      {text}
    </p>
  );
}

function LoginMobileIntro({
  role,
  locale,
  t
}: {
  role: LoginRole;
  locale: Locale;
  t: LoginPageCopy;
}) {
  return (
    <div className="mb-6 mt-8 text-center sm:mb-8 sm:mt-10 lg:hidden">
      <LoginMarketingHeadline
        role={role}
        locale={locale}
        t={t}
        mobileIntro
        className="text-[2.125rem] sm:text-[2.5rem]"
      />
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
  googleOAuthEnabled = false,
  googleOneTapClientId = "",
  t
}: LoginPageShellProps) {
  const isBrand = role === "brand";
  const pageVisual = getLoginVisual(role);
  const formVisual = isBrand ? getLoginVisual("brand") : getLoginVisual("creator");
  const desktopCardTitle = locale === "zh" ? "三步完成登录" : "Three quick steps to sign in";
  const heroSubtitle = isBrand ? t.brandHeroSubtitle : t.creatorHeroSubtitle;

  return (
    <AcknowledgeAlertProvider locale={locale}>
    <main className="relative min-h-[100dvh] overflow-hidden">
      <GoogleOneTap
        clientId={googleOneTapClientId}
        locale={locale}
        role={role}
        nextPath={nextPath}
        enabled={googleOAuthEnabled}
      />
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${pageVisual.bg})` }} aria-hidden />
      <div className="absolute inset-0" style={{ background: pageVisual.overlay }} aria-hidden />

      <div className={cn("relative z-10 flex min-h-[100dvh] flex-col", pageVisual.panelText)}>
        <header className="relative mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <MarketingHomeLink locale={locale} className="inline-flex items-center">
            <BrandLogoLockup
              contrastOn={isBrand ? "dark" : "light"}
              markClassName={cn("h-6 w-6 sm:h-9 sm:w-9", isBrand && "rounded-md ring-1 ring-white/15 sm:rounded-xl")}
              wordmarkClassName="h-[13px] w-[81px] sm:h-[21px] sm:w-[134px]"
              priority
            />
          </MarketingHomeLink>

          <div className="hidden w-9 sm:block" aria-hidden />
        </header>

        <div className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col gap-6 px-5 pb-8 sm:px-8 max-lg:justify-start lg:gap-10 lg:px-10 lg:pb-12 xl:gap-14 xl:px-12 lg:flex-row lg:items-center lg:justify-between">
          <section className="hidden min-w-0 lg:block lg:flex-1 lg:pl-6 lg:py-6 xl:max-w-[820px] xl:pl-14">
            {isBrand ? (
              <>
                <LoginMarketingHeadline
                  role={role}
                  locale={locale}
                  t={t}
                  className={cn(
                    "mt-8 text-[2rem] sm:text-[2.75rem]",
                    locale === "en" ? "lg:text-[2.45rem] xl:text-[3.05rem]" : "lg:text-[3.25rem]"
                  )}
                />
                <ul className="mt-8 hidden space-y-5 lg:block lg:mt-10">
                  {t.brandFeatures.map((feature, index) => {
                    const Icon = featureIcons[feature.icon];
                    return (
                      <li key={feature.title} className="flex gap-4">
                        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1", pageVisual.featureIcon[index])}>
                          <Icon className="h-5 w-5" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0 pt-0.5">
                          <p className="text-[15px] font-medium leading-6">{feature.title}</p>
                          <p className={cn("mt-1 text-sm leading-6", pageVisual.panelMuted)}>{feature.description}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <LoginHeroSubtitle
                  text={heroSubtitle}
                  isBrand={isBrand}
                  className="mt-12 hidden lg:block xl:text-[15px] xl:leading-7"
                />
              </>
            ) : (
              <>
                <LoginMarketingHeadline
                  role={role}
                  locale={locale}
                  t={t}
                  className={cn(
                    "mt-8 text-[2rem] sm:text-[2.75rem]",
                    locale === "en" ? "lg:text-[2.55rem] xl:text-[3.05rem]" : "lg:text-[3.25rem]"
                  )}
                />
                <ul className="mt-8 space-y-5 sm:mt-10">
                  {t.creatorFeatures.map((feature, index) => {
                    const Icon = featureIcons[feature.icon];
                    return (
                      <li key={feature.title} className="flex gap-4">
                        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1", pageVisual.featureIcon[index])}>
                          <Icon className="h-5 w-5" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0 pt-0.5">
                          <p className="text-[15px] font-medium leading-6">{feature.title}</p>
                          <p className={cn("mt-1 text-sm leading-6", pageVisual.panelMuted)}>{feature.description}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <LoginHeroSubtitle
                  text={heroSubtitle}
                  isBrand={isBrand}
                  className="mt-12 hidden lg:block sm:text-base"
                />
              </>
            )}

            <p className={cn("mt-10 hidden text-xs lg:block", pageVisual.panelMuted)}>
              © {new Date().getFullYear()} {studioOS.productName}. {t.rights}
            </p>
          </section>

          <section className="w-full max-w-[460px] lg:w-[460px] lg:shrink-0 xl:w-[480px] max-lg:mx-auto max-lg:mt-10 sm:max-lg:mt-12">
            <LoginMobileIntro role={role} locale={locale} t={t} />

            <div
              className={cn(
                "rounded-[1.65rem] p-6 backdrop-blur-xl sm:p-8 lg:px-10 lg:py-10",
                isBrand
                  ? "border border-white/10 bg-black/45 text-white shadow-[0_24px_80px_-12px_rgba(0,0,0,0.65)]"
                  : "border border-white/70 bg-white/85 text-zinc-950 shadow-[0_28px_90px_-28px_rgba(88,28,135,0.35)]"
              )}
            >
              <h2
                className={cn(
                  "text-center text-[15px] font-semibold leading-snug tracking-[-0.02em] sm:text-base",
                  isBrand ? "text-white/90" : "text-zinc-800"
                )}
              >
                {desktopCardTitle}
              </h2>

              <nav className={cn("mt-5 grid grid-cols-2 gap-1 rounded-xl sm:mt-6", formVisual.tabWrap)} aria-label={locale === "zh" ? "登录身份" : "Sign-in role"}>
                <RoleTab href={roleTabHref("brand", nextPath)} active={isBrand} visual={formVisual} icon={UserRound}>
                  {t.brandTab}
                </RoleTab>
                <RoleTab href={roleTabHref("creator", nextPath)} active={!isBrand} visual={formVisual} icon={Clapperboard}>
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
                  visualOverride={formVisual}
                  t={t}
                />
              </div>

              <div className="relative mt-6 py-1">
                <div className={cn("absolute inset-x-0 top-1/2 h-px", isBrand ? "bg-white/10" : "bg-zinc-200")} />
                <p className={cn("relative mx-auto w-fit px-3 text-[11px] sm:text-xs", formVisual.divider, isBrand ? "bg-black/45" : "bg-white/75")}>
                  {t.socialDivider}
                </p>
              </div>
              <LoginSocialButtons
                locale={locale}
                role={role}
                nextPath={nextPath}
                visualOverride={formVisual}
              />
            </div>

            <div className={cn("mt-8 pb-4 lg:hidden", isBrand ? "text-white" : "text-zinc-950")}>
              <LoginHeroSubtitle
                text={heroSubtitle}
                isBrand={isBrand}
                className={cn("mx-auto text-center", !isBrand && "text-black")}
              />
              <p className={cn("mt-8 text-center text-xs", pageVisual.panelMuted)}>
                © {new Date().getFullYear()} {studioOS.productName}. {t.rights}
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
    </AcknowledgeAlertProvider>
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
