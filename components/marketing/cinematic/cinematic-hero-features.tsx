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
    <div className="mx-auto mt-8 w-full pt-2 sm:mt-12">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                "group flex min-h-[156px] flex-col items-center justify-center rounded-lg border p-4 text-center transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:min-h-[172px] sm:p-5",
                isActive
                  ? "border-white/24 bg-white/[0.085] shadow-[0_20px_60px_-34px_rgba(255,255,255,0.55)]"
                  : "border-white/10 bg-black/20 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.045]"
              )}
            >
              <span
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full transition duration-300 sm:h-14 sm:w-14",
                  isActive
                    ? "bg-white text-zinc-950"
                    : "bg-violet-600/25 text-violet-200 group-hover:bg-white/10 group-hover:text-white"
                )}
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
              </span>
              <span className="mt-4 text-[15px] font-semibold leading-6 text-white sm:text-base">{feature.title}</span>
              <span className="mt-1.5 max-w-[13rem] text-[12px] leading-5 text-zinc-400 sm:text-[13px]">
                {feature.desc}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
