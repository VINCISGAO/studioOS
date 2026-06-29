"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AnimatedCounter, cinematicEase } from "@/components/marketing/landing/landing-motion";
import { LandingEyebrow, LandingShell } from "@/components/marketing/landing/landing-ui";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale } from "@/lib/i18n";

const statMeta = [
  { animate: 70 as number | null, suffix: "%", extra: "↓" },
  { animate: null, display: "72h" },
  { animate: null, display: "4K" },
  { animate: 2000 as number | null, suffix: "+" }
];

export function LandingTrustBand({ locale }: { locale: Locale }) {
  const stats = landingText("stats", locale);
  const logos = landingText("logos", locale);
  const loop = [...logos.brands, ...logos.brands];
  const reduce = useReducedMotion();

  return (
    <section className="border-y border-white/[0.06] bg-[#050505]">
      <LandingShell className="py-10 sm:py-12">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: cinematicEase }}
          className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-white/[0.06]"
        >
          {stats.map((stat, index) => {
            const meta = statMeta[index];
            return (
              <div key={stat.label} className="sm:px-8 sm:first:pl-0 sm:last:pr-0">
                <p className="font-mono text-2xl font-medium tracking-[-0.04em] text-white sm:text-[2rem]">
                  {meta.animate !== null ? (
                    <>
                      <AnimatedCounter value={meta.animate} locale={locale} />
                      {meta.suffix}
                      {"extra" in meta && meta.extra ? (
                        <span className="ml-1 text-lg text-zinc-500">{meta.extra}</span>
                      ) : null}
                    </>
                  ) : (
                    "display" in meta && meta.display
                  )}
                </p>
                <p className="landing-stat-label mt-2">{stat.label}</p>
              </div>
            );
          })}
        </motion.div>
      </LandingShell>

      <div className="border-t border-white/[0.06] py-8">
        <LandingEyebrow className="text-center text-zinc-600">{logos.label}</LandingEyebrow>
        <div className="relative mt-6 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#050505] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#050505] to-transparent" />
          <div className="animate-marquee flex w-max gap-14 px-8">
            {loop.map((brand, i) => (
              <span key={`${brand}-${i}`} className="whitespace-nowrap text-[13px] tracking-[0.1em] text-zinc-600">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
