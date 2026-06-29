"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AnimatedCounter, cinematicEase } from "@/components/marketing/landing/landing-motion";
import { LandingShell } from "@/components/marketing/landing/landing-ui";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale } from "@/lib/i18n";

/** Full-bleed typographic moment — the "wow" stat interstitial. */
export function LandingStatMoment({ locale }: { locale: Locale }) {
  const stats = landingText("stats", locale);
  const reduce = useReducedMotion();
  const heroStat = stats[0];

  return (
    <section className="relative overflow-hidden border-y border-white/[0.06] bg-[#030303] py-24 sm:py-32 lg:py-40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_50%_50%,rgba(255,255,255,0.04),transparent_70%)]" />

      <LandingShell className="relative text-center">
        <motion.p
          initial={reduce ? false : { opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1.1, ease: cinematicEase }}
          className="font-mono text-[clamp(4.5rem,18vw,11rem)] font-medium leading-none tracking-[-0.06em] text-white"
        >
          <AnimatedCounter value={70} locale={locale} />
          <span className="text-zinc-500">%</span>
          <span className="ml-2 text-[0.45em] text-zinc-600">↓</span>
        </motion.p>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: cinematicEase, delay: 0.15 }}
          className="mx-auto mt-6 max-w-md text-[15px] uppercase tracking-[0.24em] text-zinc-500"
        >
          {heroStat.label}
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-8 border-t border-white/[0.06] pt-12 text-left sm:gap-12"
        >
          {stats.slice(1).map((stat) => (
            <div key={stat.label}>
              <p className="font-mono text-2xl font-medium tracking-[-0.03em] text-white sm:text-3xl">{stat.value}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-zinc-600">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </LandingShell>
    </section>
  );
}
