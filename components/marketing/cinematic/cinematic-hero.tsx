"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { landingText } from "@/lib/marketing/landing-copy";
import { marketingHomeHref } from "@/lib/marketing/localized-href";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { CinematicHeroFeatures } from "@/components/marketing/cinematic/cinematic-hero-features";
import { CinematicHeroBrandsDesktop, CinematicHeroBrandsMobile } from "@/components/marketing/cinematic/cinematic-hero-brands";
import { CinematicHeroBackdrop } from "@/components/marketing/cinematic/cinematic-hero-backdrop";
import { cn } from "@/lib/utils";

const HERO_BG_FALLBACK = "/images/home-hero-space.png";

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
  "inline-block bg-gradient-to-br from-violet-100 from-[8%] via-fuchsia-300 via-[32%] via-violet-500 via-[52%] to-purple-900 to-[92%] bg-clip-text font-semibold text-transparent drop-shadow-[0_1px_3px_rgba(126,34,206,0.55)]";

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

function HeroCtaButton({
  href,
  title,
  description,
  isActive,
  onHover,
  compactLocale = false
}: {
  href: string;
  title: string;
  description: string;
  isActive: boolean;
  onHover: () => void;
  compactLocale?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={onHover}
      className={cn(
        "group flex min-h-[4.5rem] flex-1 items-center justify-between gap-2 rounded-2xl px-3.5 py-3 transition duration-300 sm:min-h-[6.35rem] sm:gap-4 sm:rounded-[1.25rem] sm:px-5 sm:py-5 md:min-h-[6.35rem] md:gap-4 md:rounded-[1.25rem] md:px-5 md:py-5",
        isActive
          ? "border border-transparent bg-white text-black hover:bg-zinc-100"
          : "border border-white/35 bg-black/35 text-white backdrop-blur-sm hover:border-white/35 hover:bg-black/35"
      )}
    >
      <span className="min-w-0 text-left">
        <span
          className={cn(
            "block font-semibold leading-tight",
            compactLocale
              ? "text-[11.2px] sm:text-[16px] md:text-[20px]"
              : "text-[14px] sm:text-[20px] md:text-[20px]",
            isActive ? "text-black" : "text-white"
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            "mt-1 block leading-tight",
            compactLocale
              ? "text-[8.8px] sm:mt-1.5 sm:text-[12.8px] md:mt-1.5 md:text-base"
              : "text-[11px] sm:mt-1.5 sm:text-base md:mt-1.5 md:text-base",
            isActive ? "text-zinc-500" : "text-white/55"
          )}
        >
          {description}
        </span>
      </span>
      <ArrowRight
        className={cn(
          "h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 sm:h-5 sm:w-5 md:h-5 md:w-5",
          isActive ? "text-black" : "text-white"
        )}
      />
    </Link>
  );
}

function HeroCtaGroup({
  primaryHref,
  secondaryHref,
  primary,
  secondary,
  primaryDescription,
  secondaryDescription,
  className,
  compactLocale = false
}: {
  primaryHref: string;
  secondaryHref: string;
  primary: string;
  secondary: string;
  primaryDescription: string;
  secondaryDescription: string;
  className?: string;
  compactLocale?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className={className} onMouseLeave={() => setActiveIndex(0)}>
      <HeroCtaButton
        href={primaryHref}
        title={primary}
        description={primaryDescription}
        isActive={activeIndex === 0}
        onHover={() => setActiveIndex(0)}
        compactLocale={compactLocale}
      />
      <HeroCtaButton
        href={secondaryHref}
        title={secondary}
        description={secondaryDescription}
        isActive={activeIndex === 1}
        onHover={() => setActiveIndex(1)}
        compactLocale={compactLocale}
      />
    </div>
  );
}

export function CinematicHero({
  locale,
  copyLocale = locale,
  heroBgSrc = HERO_BG_FALLBACK,
  heroBgSrc2x
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  heroBgSrc?: string;
  heroBgSrc2x?: string;
}) {
  const t = landingText("hero", copyLocale);
  const primaryHref = marketingHomeHref.brand(copyLocale);
  const secondaryHref = marketingHomeHref.studio(copyLocale);
  const titleLines = getHeroTitleLines(t.titleLine1, t.titleLine2);
  const subtitleText = t.subtitle.replace(/\s*\n\s*/g, " ").trim();
  const compactHeroLocale = isCompactHeroLocale(copyLocale);
  const legacyCompactTitle = usesLegacyCompactTitle(copyLocale);
  const latinHeroLocale = isLatinHeroLocale(copyLocale);

  return (
    <section className="relative isolate flex flex-col overflow-hidden bg-black text-white sm:min-h-[100dvh]">
      <CinematicHeroBackdrop src={heroBgSrc} src2x={heroBgSrc2x} />

      <div className="relative z-10 w-full px-4 pb-8 pt-[5.35rem] sm:mx-auto sm:flex sm:min-h-[100dvh] sm:max-w-7xl sm:flex-col sm:px-8 sm:pb-0 sm:pt-0">
        <div className="sm:pt-40">
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
                  "font-normal text-zinc-400 md:text-lg",
                  compactHeroLocale ? "text-[11.2px] md:text-lg" : "text-sm md:text-lg"
                )}
              >
                {t.eyebrow}
              </p>
            </div>

            <h1
              className={cn(
                "mt-5 font-bold leading-[1.08] tracking-[-0.03em] text-white md:mt-6 md:text-[4.667rem]",
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
                "mt-4 max-w-xl leading-7 text-zinc-400 md:mt-5 md:text-2xl md:leading-8",
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
              className="mt-6 flex w-full max-w-xl flex-row gap-2.5 sm:hidden"
              primaryHref={primaryHref}
              secondaryHref={secondaryHref}
              primary={t.primary}
              secondary={t.secondary}
              primaryDescription={t.primaryDescription}
              secondaryDescription={t.secondaryDescription}
              compactLocale={compactHeroLocale}
            />
          </div>
        </div>

        <div className="hidden sm:mt-auto sm:block sm:w-full sm:pb-10">
          <HeroCtaGroup
            className="mb-8 flex w-full max-w-xl flex-row gap-2.5 sm:max-w-3xl sm:gap-4 md:max-w-3xl md:gap-4"
            primaryHref={primaryHref}
            secondaryHref={secondaryHref}
            primary={t.primary}
            secondary={t.secondary}
            primaryDescription={t.primaryDescription}
            secondaryDescription={t.secondaryDescription}
            compactLocale={compactHeroLocale}
          />
          <CinematicHeroFeatures locale={copyLocale} />
          <CinematicHeroBrandsDesktop trustLabel={t.trustMarquee} />
        </div>

        <CinematicHeroBrandsMobile trustLabel={t.trustMarquee} />
      </div>
    </section>
  );
}
