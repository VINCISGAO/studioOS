"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  AnimatedCounter,
  cinematicEase
} from "@/components/marketing/cinematic/motion-primitives";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const statMeta = [
  { animate: 70 as number | null, suffix: "%", extra: "↓" },
  { animate: null, display: "72h" },
  { animate: null, display: "4K" },
  { animate: 2000 as number | null, suffix: "+" }
] as const;

const panelVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 1.15, ease: cinematicEase, delay: 0.45 }
  }
};

const statVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.92 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.85, ease: cinematicEase, delay: 0.72 + index * 0.1 }
  })
};

const logoVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: cinematicEase, delay: 1.15 + index * 0.05 }
  })
};

export function CinematicHeroStats({ locale }: { locale: Locale }) {
  const reduce = useReducedMotion();
  const stats = landingText("stats", locale);
  const logos = landingText("logos", locale);

  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      animate="visible"
      variants={panelVariants}
      className="hero-stats-dock relative w-full"
    >
      <div className="hero-stats-panel relative overflow-hidden rounded-2xl border border-white/[0.1] bg-black/40 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:rounded-[1.25rem]">
        <div className="hero-stats-shimmer pointer-events-none absolute inset-x-0 top-0 h-px" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(139,92,246,0.14),transparent_65%)]"
          aria-hidden
        />

        <div className="relative grid grid-cols-2 divide-x divide-white/[0.08] lg:grid-cols-4">
          {stats.map((stat, index) => {
            const meta = statMeta[index];
            return (
              <motion.div
                key={stat.label}
                custom={index}
                initial={reduce ? false : "hidden"}
                animate="visible"
                variants={statVariants}
                className="group relative px-5 py-7 text-center sm:px-7 sm:py-9"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.12),transparent_72%)] opacity-0 transition duration-700 group-hover:opacity-100" />
                <p className="relative font-mono text-[1.75rem] font-semibold tracking-tight sm:text-[2.65rem]">
                  <span className="hero-stat-glow inline-block">
                    {meta.animate !== null ? (
                      <>
                        <AnimatedCounter value={meta.animate} locale={locale} />
                        {meta.suffix}
                        {"extra" in meta && meta.extra ? (
                          <span className="ml-0.5 text-xl text-emerald-400 sm:text-2xl">{meta.extra}</span>
                        ) : null}
                      </>
                    ) : (
                      "display" in meta && meta.display
                    )}
                  </span>
                </p>
                <p className="relative mt-2 text-[11px] text-zinc-400 sm:text-sm">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="relative border-t border-white/[0.08] px-4 py-7 sm:px-6 sm:py-8">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: cinematicEase, delay: 1.05 }}
            className="text-center text-[10px] font-medium uppercase tracking-[0.24em] text-zinc-500 sm:text-[11px]"
          >
            {logos.label}
          </motion.p>
          <ul className="mx-auto mt-5 flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:mt-6 sm:gap-x-10">
            {logos.brands.map((brand, index) => (
              <motion.li
                key={brand}
                custom={index}
                initial={reduce ? false : "hidden"}
                animate="visible"
                variants={logoVariants}
                className={cn(
                  "text-xs font-medium tracking-tight text-zinc-500 transition duration-300 hover:text-zinc-300 sm:text-sm"
                )}
              >
                {brand}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
