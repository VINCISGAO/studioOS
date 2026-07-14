"use client";

import { useState } from "react";
import { Clapperboard, ShieldCheck, Users, Zap } from "lucide-react";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const featureIcons = {
  users: Users,
  play: Clapperboard,
  shield: ShieldCheck,
  zap: Zap
} as const;

export function CinematicHeroFeatures({
  locale,
  className,
  lightHero = false
}: {
  locale: Locale | MarketingLocale;
  className?: string;
  lightHero?: boolean;
}) {
  const features = landingText("heroFeatures", locale);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className="grid min-w-0 grid-cols-4 gap-3 md:gap-4">
        {features.map((feature, index) => {
          const Icon = featureIcons[feature.icon];
          const isActive = index === activeIndex;

          return (
            <button
              key={feature.title}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                "marketing-hero-feature-card group flex min-h-[172px] w-full flex-col items-center justify-center rounded-lg border p-4 text-center transition duration-300 focus:outline-none focus-visible:ring-2 sm:p-5",
                lightHero
                  ? isActive
                    ? "border-zinc-300 bg-white shadow-[0_20px_60px_-36px_rgba(0,0,0,0.12)] focus-visible:ring-zinc-400"
                    : "border-zinc-200/80 bg-zinc-50/80 hover:-translate-y-1 hover:border-zinc-300 hover:bg-white focus-visible:ring-zinc-400"
                  : cn(
                      "backdrop-blur-[2px] focus-visible:ring-white/60",
                      isActive
                        ? "border-white/45 bg-white/[0.075] shadow-[0_20px_60px_-36px_rgba(255,255,255,0.58)]"
                        : "border-white/[0.085] bg-black/24 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.045]"
                    )
              )}
            >
              <span
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full transition duration-300",
                  lightHero
                    ? isActive
                      ? "bg-zinc-950 text-white"
                      : "bg-violet-100 text-violet-700 group-hover:bg-violet-600 group-hover:text-white"
                    : isActive
                      ? "bg-white text-zinc-950"
                      : "bg-violet-600/25 text-violet-200 group-hover:bg-white/10 group-hover:text-white"
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <span
                className={cn(
                  "mt-4 text-base font-semibold leading-6",
                  lightHero ? "text-zinc-900" : "text-white"
                )}
              >
                {feature.title}
              </span>
              <span className={cn("mt-1.5 text-[13px] leading-5", lightHero ? "text-zinc-500" : "text-zinc-400")}>
                {feature.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
