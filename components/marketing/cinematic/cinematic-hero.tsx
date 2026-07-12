"use client";

import { useMarketingHomePortalSession } from "@/components/marketing/use-marketing-home-portal-session";
import { landingText } from "@/lib/marketing/landing-copy";
import type { MarketingHomePortalSession } from "@/lib/marketing/portal-entry";
import { resolveMarketingHeroCtaTargets } from "@/lib/marketing/portal-entry";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { CinematicHeroFeatures } from "@/components/marketing/cinematic/cinematic-hero-features";
import { CinematicHeroBrandsDesktop, CinematicHeroBrandsMobile } from "@/components/marketing/cinematic/cinematic-hero-brands";
import { CinematicHeroBackdrop } from "@/components/marketing/cinematic/cinematic-hero-backdrop";
import { HeroCtaGroup } from "@/components/marketing/cinematic/cinematic-hero-cta";
import { cn } from "@/lib/utils";

const HERO_BG_FALLBACK = "/images/background.png";

const COMPACT_HERO_LOCALES = new Set<Locale | MarketingLocale>(["vi", "es", "fr", "ms", "ja", "en"]);

const LEGACY_COMPACT_TITLE_LOCALES = new Set<Locale | MarketingLocale>(["vi", "es", "fr", "ms"]);

/** Latin-script hero locales — desktop: lg title cap + subtitle pretty; title stays 2 explicit lines. */
const LATIN_HERO_LOCALES = new Set<Locale | MarketingLocale>(["en", "es", "fr", "ms", "vi"]);

function isCompactHeroLocale(locale: Locale | MarketingLocale) {
  return COMPACT_HERO_LOCALES.has(locale);
}

function usesLegacyCompactTitle(locale: Locale | MarketingLocale) {
  return LEGACY_COMPACT_TITLE_LOCALES.has(locale);
}

function isLatinHeroLocale(locale: Locale | MarketingLocale) {
  return LATIN_HERO_LOCALES.has(locale);
}

function getHeroTitleLines(titleLine1: string, titleLine2: string) {
  const line2 = titleLine2.trim();
  if (line2) return [titleLine1.trim(), line2];
  return titleLine1
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const HERO_AI_TOKEN_CLASS =
  "inline-block bg-gradient-to-br from-violet-100 from-[8%] via-fuchsia-300 via-[32%] via-violet-500 via-[52%] to-purple-900 to-[92%] bg-clip-text font-semibold text-transparent";

const HERO_AI_TOKEN_PATTERN = /(AI|IA)/;

function renderTitleLine(line: string, index: number, allowWrap = false) {
  const lineClass = cn("block", !allowWrap && "whitespace-nowrap", index > 0 && "mt-1.5 sm:mt-2.5");

  if (!HERO_AI_TOKEN_PATTERN.test(line)) {
    return (
      <span key={`${line}-${index}`} className={lineClass}>
        {line}
      </span>
    );
  }

  const parts = line.split(HERO_AI_TOKEN_PATTERN);

  return (
    <span key={`${line}-${index}`} className={lineClass}>
      {parts.map((part, partIndex) =>
        part === "AI" || part === "IA" ? (
          <span key={`${line}-${index}-${partIndex}`} className={HERO_AI_TOKEN_CLASS}>
            {part}
          </span>
        ) : (
          <span key={`${line}-${index}-${partIndex}`}>{part}</span>
        )
      )}
    </span>
  );
}

const heroCtaProps = {
  className:
    "flex w-full max-w-xl flex-row flex-wrap gap-2.5 md:max-w-3xl md:gap-4"
} as const;

export function CinematicHero({
  locale,
  copyLocale = locale,
  heroBgSrc = HERO_BG_FALLBACK,
  heroBgSrc2x,
  portalSession: serverPortalSession = null,
  hydratePortalSession = false
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  heroBgSrc?: string;
  heroBgSrc2x?: string;
  portalSession?: MarketingHomePortalSession | null;
  hydratePortalSession?: boolean;
}) {
  const { session: hydratedPortalSession } = useMarketingHomePortalSession(
    copyLocale,
    serverPortalSession,
    hydratePortalSession
  );
  const portalSession = hydratePortalSession ? hydratedPortalSession : serverPortalSession;
  const t = landingText("hero", copyLocale);
  const { brand: brandCta, creator: creatorCta } = resolveMarketingHeroCtaTargets(copyLocale, portalSession);
  const titleLines = getHeroTitleLines(t.titleLine1, t.titleLine2);
  const subtitleText = t.subtitle.replace(/\s*\n\s*/g, " ").trim();
  const compactHeroLocale = isCompactHeroLocale(copyLocale);
  const legacyCompactTitle = usesLegacyCompactTitle(copyLocale);
  const latinHeroLocale = isLatinHeroLocale(copyLocale);

  const ctaShared = {
    brandCta,
    creatorCta,
    primary: t.primary,
    secondary: t.secondary,
    primaryDescription: t.primaryDescription,
    secondaryDescription: t.secondaryDescription,
    compactLocale: compactHeroLocale,
    lightHero: true
  } as const;

  return (
    <section className="relative isolate flex flex-col overflow-hidden bg-white text-zinc-950 lg:min-h-[100dvh]">
      <CinematicHeroBackdrop src={heroBgSrc} src2x={heroBgSrc2x} />

      <div className="relative z-10 w-full px-4 pb-8 pt-[5.35rem] md:px-8 md:pb-12 lg:mx-auto lg:flex lg:min-h-[100dvh] lg:max-w-7xl lg:flex-col lg:px-8 lg:pb-0 lg:pt-0">
        <div className="md:pt-28 lg:pt-40">
          <div
            className={cn(
              "w-full max-w-2xl text-left",
              latinHeroLocale && "md:max-w-4xl"
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-0.5 shrink-0 rounded-full bg-violet-500/90" aria-hidden />
              <p
                className={cn(
                  "font-normal text-zinc-500 md:text-lg",
                  compactHeroLocale ? "text-[11.2px] md:text-lg" : "text-sm md:text-lg"
                )}
              >
                {t.eyebrow}
              </p>
            </div>

            <h1
              className={cn(
                "mt-5 font-bold leading-[1.08] tracking-[-0.03em] text-zinc-950 md:mt-6 md:text-[4.667rem]",
                compactHeroLocale
                  ? legacyCompactTitle
                    ? "text-[1.8rem]"
                    : "text-[2.12rem]"
                  : "text-[2.65rem]",
                latinHeroLocale && "md:text-[3.5rem]"
              )}
            >
              {titleLines.map((line, index) => renderTitleLine(line, index))}
            </h1>

            <p
              className={cn(
                "mt-4 max-w-xl leading-7 text-zinc-500 md:mt-5 md:text-2xl md:leading-8",
                latinHeroLocale ? "text-pretty" : "whitespace-nowrap",
                compactHeroLocale
                  ? legacyCompactTitle
                    ? "text-[10.4px]"
                    : "text-[11.2px]"
                  : "text-[14px]"
              )}
            >
              {subtitleText}
            </p>

            <HeroCtaGroup
              className={cn(heroCtaProps.className, "mt-6 md:hidden")}
              {...ctaShared}
            />
          </div>

          {/* iPad: mobile-style vertical stack + four golden-rule cards (图二) */}
          <div className="hidden md:mt-8 md:block lg:hidden">
            <HeroCtaGroup className={cn(heroCtaProps.className, "mb-8")} {...ctaShared} />
            <CinematicHeroFeatures locale={copyLocale} className="mt-0" lightHero />
            <CinematicHeroBrandsDesktop trustLabel={t.trustMarquee} lightHero />
          </div>
        </div>

        {/* Desktop: CTA + golden rules + brands anchored to hero bottom */}
        <div className="hidden lg:mt-auto lg:block lg:w-full lg:pb-10">
          <HeroCtaGroup className={cn(heroCtaProps.className, "mb-8")} {...ctaShared} />
          <CinematicHeroFeatures locale={copyLocale} className="mt-0" lightHero />
          <CinematicHeroBrandsDesktop trustLabel={t.trustMarquee} lightHero />
        </div>

        <CinematicHeroBrandsMobile trustLabel={t.trustMarquee} lightHero />
      </div>
    </section>
  );
}
