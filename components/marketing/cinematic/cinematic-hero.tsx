"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { CinematicHeroFeatures } from "@/components/marketing/cinematic/cinematic-hero-features";
import { CinematicHeroStats } from "@/components/marketing/cinematic/cinematic-hero-stats";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { LOGIN_SPACE_BG } from "@/lib/studioos/login-background";
import { marketingHeadlineClassName } from "@/lib/studioos/marketing-headline-font";
import { cn } from "@/lib/utils";

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

  const headlineLine2 = [t.titleHighlight, t.titleLine2].filter(Boolean).join(" ");

  return (
    <section className="relative overflow-hidden bg-[#050508] text-white">
      {/* 固定使用 login-space-bg，不替换为 home-hero-bg */}
      <Image
        src={LOGIN_SPACE_BG}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-90"
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#050508]/90 via-[#0a0a12]/75 to-[#120818]/55"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-14 pt-24 sm:px-8 sm:pb-16 sm:pt-28 lg:pb-20">
        <div className="max-w-3xl">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-500/35 bg-violet-600/15 px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-violet-100">
            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
            {t.eyebrow}
          </p>

          <h1
            className={cn(
              "mt-6 text-[2.25rem] font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:text-[2.85rem] lg:text-[3.5rem]",
              locale === "en" ? marketingHeadlineClassName("en") : "text-pretty"
            )}
          >
            <span className="block">{t.titleLine1}</span>
            {locale === "en" ? (
              <span className="mt-2 block">
                <span className="bg-gradient-to-r from-violet-300 via-indigo-200 to-violet-300 bg-clip-text text-transparent">
                  {t.titleHighlight}
                </span>{" "}
                {t.titleLine2}
              </span>
            ) : (
              <span className="mt-2 block">{headlineLine2}</span>
            )}
          </h1>

          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-zinc-300 sm:text-base">{t.subtitle}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={primaryHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-7 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-transparent px-7 text-sm font-semibold text-white transition hover:bg-white/10"
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
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#050508] bg-gradient-to-br",
                    gradient
                  )}
                  aria-hidden
                />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-1 text-xs text-zinc-400">{t.trusted}</p>
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
