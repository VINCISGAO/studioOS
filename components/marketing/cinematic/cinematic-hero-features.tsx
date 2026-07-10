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
  className
}: {
  locale: Locale | MarketingLocale;
  className?: string;
}) {
  const features = landingText("heroFeatures", locale);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className={cn("w-full", className)}>
      <div className="grid w-full grid-cols-4 gap-3 md:gap-4">
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
                "group flex min-h-[172px] w-full flex-col items-center justify-center rounded-lg border p-4 text-center backdrop-blur-[2px] transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:p-5",
                isActive
                  ? "border-white/45 bg-white/[0.075] shadow-[0_20px_60px_-36px_rgba(255,255,255,0.58)]"
                  : "border-white/[0.085] bg-black/24 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.045]"
              )}
            >
              <span
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full transition duration-300",
                  isActive
                    ? "bg-white text-zinc-950"
                    : "bg-violet-600/25 text-violet-200 group-hover:bg-white/10 group-hover:text-white"
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <span className="mt-4 text-base font-semibold leading-6 text-white">{feature.title}</span>
              <span className="mt-1.5 text-[13px] leading-5 text-zinc-400">{feature.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
