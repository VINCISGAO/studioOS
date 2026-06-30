"use client";

import Image from "next/image";
import { Sparkles, Star } from "lucide-react";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale } from "@/lib/i18n";
import { LOGIN_SPACE_BG } from "@/lib/studioos/login-background";
import { marketingHeadlineClassName } from "@/lib/studioos/marketing-headline-font";
import { cn } from "@/lib/utils";

const STAR_POSITIONS = [
  { top: "12%", left: "18%", size: 2, delay: "0s" },
  { top: "22%", left: "72%", size: 1.5, delay: "1.2s" },
  { top: "38%", left: "44%", size: 2.5, delay: "0.4s" },
  { top: "52%", left: "82%", size: 1.5, delay: "2.1s" },
  { top: "64%", left: "28%", size: 2, delay: "0.8s" },
  { top: "78%", left: "58%", size: 1.5, delay: "1.6s" },
  { top: "18%", left: "52%", size: 1.5, delay: "2.8s" },
  { top: "46%", left: "8%", size: 2, delay: "1.1s" }
] as const;

export function LandingCosmicScene({ locale }: { locale: Locale }) {
  const t = landingText("hero", locale);
  const split = landingText("split", locale);

  return (
    <div className="landing-cosmic-scene relative flex min-h-[44vh] flex-col justify-between overflow-hidden bg-[#050508] text-white lg:min-h-[100dvh]">
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
      <div className="absolute inset-0 premium-grid-bg opacity-40" aria-hidden />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {STAR_POSITIONS.map((star, index) => (
          <span
            key={index}
            className="landing-star absolute rounded-full bg-white"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              animationDelay: star.delay
            }}
          />
        ))}
        <div className="landing-planet-orbit absolute left-[8%] top-[52%] hidden h-[min(52vw,420px)] w-[min(52vw,420px)] -translate-y-1/2 lg:block">
          <div className="landing-planet-core absolute inset-[18%] rounded-full bg-gradient-to-br from-indigo-300/90 via-violet-500/80 to-[#1a1030]" />
          <div className="landing-planet-ring absolute inset-[8%] rounded-full border border-white/15" />
          <div className="landing-planet-ring landing-planet-ring--outer absolute inset-0 rounded-full border border-violet-400/20" />
          <div className="landing-planet-glow absolute -inset-[12%] rounded-full bg-violet-500/20 blur-3xl" />
        </div>
        <div className="absolute -right-24 top-[18%] h-72 w-72 rounded-full bg-indigo-500/15 blur-[100px] animate-hero-orb" />
        <div className="absolute bottom-[12%] left-[30%] h-56 w-56 rounded-full bg-violet-600/10 blur-[80px] animate-hero-orb [animation-delay:-4s]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-16">
        <p className="landing-split-enter inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-violet-200/90 uppercase">
          <Sparkles className="h-3.5 w-3.5" />
          {t.eyebrow}
        </p>

        <h1
          className={cn(
            "landing-split-enter landing-split-enter-delay-1 mt-6 max-w-xl text-[2.125rem] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[2.75rem] lg:text-[3.25rem] xl:text-[3.5rem]",
            locale === "en" ? marketingHeadlineClassName("en") : "text-pretty"
          )}
        >
          <span className="block">{t.titleLine1}</span>
          <span className="mt-2 block">
            <span className="bg-gradient-to-r from-violet-300 via-indigo-200 to-violet-300 bg-clip-text text-transparent">
              {t.titleHighlight}
            </span>{" "}
            {t.titleLine2}
          </span>
        </h1>

        <p className="landing-split-enter landing-split-enter-delay-2 mt-5 max-w-lg text-[15px] leading-7 text-zinc-300 sm:text-base">
          {t.subtitle}
        </p>

        <div className="landing-split-enter landing-split-enter-delay-3 mt-8 hidden items-center gap-5 lg:flex">
          <div className="flex -space-x-2.5">
            {["A", "B", "C", "D"].map((initial, index) => (
              <span
                key={initial}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#050508] text-xs font-medium",
                  index % 2 === 0 ? "bg-zinc-700 text-zinc-200" : "bg-zinc-600 text-zinc-100"
                )}
              >
                {initial}
              </span>
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

        <p className="landing-split-enter landing-split-enter-delay-3 mt-10 hidden max-w-md text-xs leading-6 text-zinc-500 lg:block">
          {split.leftFootnote}
        </p>
      </div>
    </div>
  );
}
