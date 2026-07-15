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

/** Latin-script hero locales — iPad/desktop only (md+). Mobile uses one shared scale for all 11 langs. */
const LATIN_HERO_LOCALES = new Set<Locale | MarketingLocale>(["en", "es", "fr", "ms", "vi"]);

/** ms / es — main title ×0.9 (long Latin lines). */
const REDUCED_HERO_TITLE_LOCALES = new Set<Locale | MarketingLocale>(["ms", "es"]);

function isLatinHeroLocale(locale: Locale | MarketingLocale) {
  return LATIN_HERO_LOCALES.has(locale);
}

function usesReducedHeroTitle(locale: Locale | MarketingLocale) {
  return REDUCED_HERO_TITLE_LOCALES.has(locale);
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
  "marketing-gradient-text inline-block bg-gradient-to-br from-violet-100 from-[8%] via-fuchsia-300 via-[32%] via-violet-500 via-[52%] to-purple-900 to-[92%] bg-clip-text font-semibold text-transparent";

const HERO_AI_TOKEN_PATTERN = /(AI|IA)/;

function renderTitleLine(line: string, index: number) {
  const lineClass = cn("block whitespace-nowrap", index > 0 && "mt-1.5 sm:mt-2.5");

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
  const latinHeroLocale = isLatinHeroLocale(copyLocale);
  const reducedHeroTitle = usesReducedHeroTitle(copyLocale);

  const ctaShared = {
    brandCta,
    creatorCta,
    primary: t.primary,
    secondary: t.secondary,
    primaryDescription: t.primaryDescription,
    secondaryDescription: t.secondaryDescription,
    lightHero: true
  } as const;

  return (
    <section className="marketing-hero-shell relative isolate flex flex-col overflow-x-clip bg-white text-zinc-950">
      <CinematicHeroBackdrop src={heroBgSrc} src2x={heroBgSrc2x} />

      <div className="marketing-hero-frame marketing-content-shell relative z-10 flex w-full min-w-0 flex-col pb-0 pt-[5.35rem] md:pb-0 md:pt-0 lg:pb-0">
        <div className="marketing-hero-top shrink-0 min-w-0">
          <div
            className={cn(
              "w-full max-w-2xl text-left",
              latinHeroLocale && "md:max-w-4xl"
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-0.5 shrink-0 rounded-full bg-violet-500/90" aria-hidden />
              <p className="font-normal text-sm text-zinc-500 md:text-lg">{t.eyebrow}</p>
            </div>

            <h1
              className={cn(
                "mt-5 font-bold leading-[1.08] tracking-[-0.03em] text-zinc-950 md:mt-6",
                reducedHeroTitle ? "text-[2.385rem]" : "text-[2.65rem]",
                reducedHeroTitle
                  ? "md:text-[3.15rem]"
                  : latinHeroLocale
                    ? "md:text-[3.5rem]"
                    : "md:text-[4.667rem]"
              )}
            >
              {titleLines.map((line, index) => renderTitleLine(line, index))}
            </h1>

            <p
              className={cn(
                "mt-4 max-w-xl min-w-0 overflow-x-clip text-[18.2px] leading-[2.275rem] text-zinc-500 md:mt-5 md:text-2xl md:leading-8",
                latinHeroLocale ? "whitespace-nowrap md:text-pretty" : "whitespace-nowrap"
              )}
            >
              {subtitleText}
            </p>

            <HeroCtaGroup
              className={cn(heroCtaProps.className, "mt-6 md:hidden")}
              {...ctaShared}
            />
          </div>

          {/* iPad: vertical stack (golden baseline) */}
          <div className="hidden md:mt-8 md:block lg:hidden">
            <HeroCtaGroup className={cn(heroCtaProps.className, "marketing-hero-cta-gap mb-8")} {...ctaShared} />
            <CinematicHeroFeatures locale={copyLocale} className="mt-0" lightHero />
            <CinematicHeroBrandsDesktop trustLabel={t.trustMarquee} lightHero />
          </div>
        </div>

        {/* Desktop lg+: CTA + cards + brands bottom-anchored like Safari */}
        <div className="marketing-hero-bottom hidden min-w-0 shrink-0 lg:block lg:w-full lg:pb-10">
          <HeroCtaGroup className={cn(heroCtaProps.className, "marketing-hero-cta-gap mb-8")} {...ctaShared} />
          <CinematicHeroFeatures locale={copyLocale} className="mt-0" lightHero />
          <CinematicHeroBrandsDesktop trustLabel={t.trustMarquee} lightHero />
        </div>

        <CinematicHeroBrandsMobile trustLabel={t.trustMarquee} lightHero />
      </div>
    </section>
  );
}
