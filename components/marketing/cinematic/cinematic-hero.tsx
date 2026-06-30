"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { CinematicHeroFeatures } from "@/components/marketing/cinematic/cinematic-hero-features";
import { CinematicHeroStats } from "@/components/marketing/cinematic/cinematic-hero-stats";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { marketingHeadlineClassName } from "@/lib/studioos/marketing-headline-font";
import { cn } from "@/lib/utils";

/** Static public asset — avoids Next/Image + missing API bg breaking the page. */
const HERO_BG = "/images/home-hero-bg.png";

const AVATAR_GRADIENTS = [
  "from-violet-400 to-indigo-600",
  "from-sky-400 to-blue-600",
  "from-fuchsia-400 to-purple-600",
  "from-amber-300 to-orange-500",
  "from-emerald-400 to-teal-600"
] as const;

export function CinematicHero({
  locale,
  portalHref,
  portalLabel,
  isLoggedIn = false
}: {
  locale: Locale;
  portalHref: string;
  portalLabel?: string;
  isLoggedIn?: boolean;
}) {
  const t = landingText("hero", locale);

  const primaryLabel = isLoggedIn
    ? (portalLabel ?? (locale === "zh" ? "品牌方门户" : "Brand portal"))
    : t.primary;
  const primaryHref = isLoggedIn ? portalHref : withLocale("/login?role=brand", locale);
  const secondaryLabel = t.secondary;
  const secondaryHref = withLocale("/login?role=creator", locale);

  return (
    <section className="relative overflow-hidden bg-[#050508] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-[center_30%] bg-no-repeat opacity-95"
        style={{ backgroundImage: `url(${HERO_BG})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050508]/95 via-[#050508]/75 to-[#050508]/35" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/40 via-transparent to-[#050508]" aria-hidden />

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-14 pt-24 sm:px-8 sm:pb-16 sm:pt-28 lg:pb-20">
        <div className="max-w-3xl">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-500/30 bg-violet-600/15 px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-violet-200">
            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
            {t.eyebrow}
          </p>

          <h1
            className={cn(
              "mt-6 text-[2.25rem] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[2.85rem] lg:text-[3.5rem]",
              locale === "en" ? marketingHeadlineClassName("en") : "text-pretty"
            )}
          >
            <span className="block text-white">{t.titleLine1}</span>
            <span className="mt-2 block bg-gradient-to-r from-violet-300 via-indigo-200 to-sky-300 bg-clip-text text-transparent">
              {t.titleHighlight}
              {t.titleLine2 ? ` ${t.titleLine2}` : null}
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-zinc-400 sm:text-base">{t.subtitle}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={primaryHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-7 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(124,58,237,0.65)] transition hover:bg-violet-500"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-7 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              {secondaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-4 sm:gap-5">
            <div className="flex -space-x-2.5">
              {AVATAR_GRADIENTS.map((gradient, index) => (
                <span
                  key={gradient}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#050508] bg-gradient-to-br text-[10px] font-semibold text-white/90",
                    gradient
                  )}
                  aria-hidden
                >
                  {index + 1}
                </span>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-1 text-xs text-zinc-500">{t.trusted}</p>
            </div>
          </div>
        </div>

        <CinematicHeroFeatures locale={locale} />

        <div className="mt-10 sm:mt-12">
          <CinematicHeroStats locale={locale} />
        </div>
      </div>
    </section>
  );
}
