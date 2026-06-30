"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Clapperboard, ShieldCheck, Users, Zap } from "lucide-react";
import { cinematicEase } from "@/components/marketing/cinematic/motion-primitives";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale } from "@/lib/i18n";

const featureIcons = {
  users: Users,
  play: Clapperboard,
  shield: ShieldCheck,
  zap: Zap
} as const;

export function CinematicHeroFeatures({ locale }: { locale: Locale }) {
  const reduce = useReducedMotion();
  const features = landingText("heroFeatures", locale);

  return (
    <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8 pt-2 sm:mt-12 lg:grid-cols-4">
      {features.map((feature, index) => {
        const Icon = featureIcons[feature.icon];
        return (
          <motion.div
            key={feature.title}
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: cinematicEase, delay: 0.55 + index * 0.08 }}
            className="flex flex-col items-start gap-3 sm:gap-4"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600/25 text-violet-200">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white sm:text-[15px]">{feature.title}</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500 sm:text-[13px]">{feature.desc}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
