"use client";

import { motion } from "framer-motion";
import {
  AnimatedCounter,
  RevealSection,
  cinematicEase
} from "@/components/marketing/landing/landing-motion";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale } from "@/lib/i18n";

const statMeta = [
  { animate: 70 as number | null, suffix: "%", extra: "↓" },
  { animate: null, display: "72h" },
  { animate: null, display: "4K" },
  { animate: 2000 as number | null, suffix: "+" }
] as const;

export function LandingStatsBar({ locale }: { locale: Locale }) {
  const stats = landingText("stats", locale);
  const logos = landingText("logos", locale);

  return (
    <section className="relative border-b border-white/10 bg-[#0a0a0a] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      <RevealSection className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const meta = statMeta[index];
          return (
            <motion.div
              key={stat.label}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: cinematicEase } }
              }}
              className="group relative px-6 py-9 text-center sm:px-8 sm:py-11"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.08),transparent_70%)] opacity-0 transition duration-500 group-hover:opacity-100" />
              <p className="relative font-mono text-3xl font-semibold tracking-tight sm:text-[2.75rem]">
                {meta.animate !== null ? (
                  <>
                    <AnimatedCounter value={meta.animate} locale={locale} />
                    {meta.suffix}
                    {"extra" in meta && meta.extra ? (
                      <span className="ml-1 text-2xl text-emerald-400">{meta.extra}</span>
                    ) : null}
                  </>
                ) : (
                  "display" in meta && meta.display
                )}
              </p>
              <p className="relative mt-2 text-xs text-zinc-500 sm:text-sm">{stat.label}</p>
            </motion.div>
          );
        })}
      </RevealSection>

      <div className="border-t border-white/10 px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-600">
          {logos.label}
        </p>
        <ul className="mx-auto mt-7 flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {logos.brands.map((brand, index) => (
            <motion.li
              key={brand}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04, duration: 0.5 }}
              className="text-sm font-medium tracking-tight text-zinc-600 transition hover:text-zinc-400"
            >
              {brand}
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
