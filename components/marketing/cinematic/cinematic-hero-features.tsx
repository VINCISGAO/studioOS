"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Clapperboard, ShieldCheck, Users, Zap } from "lucide-react";
import { cinematicEase } from "@/components/marketing/cinematic/motion-primitives";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const featureIcons = {
  users: Users,
  play: Clapperboard,
  shield: ShieldCheck,
  zap: Zap
} as const;

export function CinematicHeroFeatures({ locale }: { locale: Locale }) {
  const reduce = useReducedMotion();
  const features = landingText("heroFeatures", locale);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="mx-auto mt-6 w-full pt-1 sm:mt-12 sm:pt-2">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {features.map((feature, index) => {
          const Icon = featureIcons[feature.icon];
          const isActive = index === activeIndex;

          return (
            <motion.button
              key={feature.title}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: cinematicEase, delay: 0.55 + index * 0.08 }}
              className={cn(
                "group flex min-h-[136px] flex-col items-center justify-center rounded-lg border p-3 text-center transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:min-h-[172px] sm:p-5",
                isActive
                  ? "border-white/24 bg-white/[0.085] shadow-[0_20px_60px_-34px_rgba(255,255,255,0.55)]"
                  : "border-white/10 bg-black/20 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.045]"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition duration-300 sm:h-14 sm:w-14",
                  isActive
                    ? "bg-white text-zinc-950"
                    : "bg-violet-600/25 text-violet-200 group-hover:bg-white/10 group-hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 sm:h-6 sm:w-6" strokeWidth={1.75} />
              </span>
              <span className="mt-2.5 text-[13px] font-semibold leading-5 text-white sm:mt-4 sm:text-base sm:leading-6">{feature.title}</span>
              <span className="mt-1 max-w-[8.5rem] text-[11px] leading-4 text-zinc-400 sm:mt-1.5 sm:max-w-[13rem] sm:text-[13px] sm:leading-5">
                {feature.desc}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
