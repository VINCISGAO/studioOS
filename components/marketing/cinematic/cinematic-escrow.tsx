"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Lock, ShieldCheck, Unlock } from "lucide-react";
import { RevealSection, cinematicEase } from "@/components/marketing/cinematic/motion-primitives";
import { MarketingEyebrowPill, marketingSectionTitleClassName } from "@/components/marketing/landing/landing-ui";
import { cinematicText } from "@/lib/marketing/cinematic-copy";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const icons = [Lock, ShieldCheck, Unlock];

export function CinematicEscrow({
  locale,
  copyLocale = locale
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
}) {
  const t = cinematicText("escrow", copyLocale);
  const reduce = useReducedMotion();

  return (
    <section className="bg-[#050505] pb-6 pt-10 sm:pb-8 sm:pt-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <RevealSection className="text-center">
          <MarketingEyebrowPill tone="dark">{t.chapter}</MarketingEyebrowPill>
          <motion.h2
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.65, ease: cinematicEase }}
            className={cn("mx-auto mt-4 max-w-2xl text-white", marketingSectionTitleClassName)}
          >
            {t.title}
          </motion.h2>
        </RevealSection>

        <div className="mt-6 grid gap-3 md:grid-cols-3 md:gap-5 lg:mt-10">
          {t.items.map((item, index) => {
            const Icon = icons[index] ?? ShieldCheck;
            return (
              <motion.article
                key={item.title}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8%" }}
                transition={{ duration: 0.6, delay: index * 0.08, ease: cinematicEase }}
                whileHover={reduce ? undefined : { y: -4 }}
                className="group relative flex items-center gap-3 overflow-hidden rounded-lg border border-white/10 bg-[#111315] p-4 transition-colors duration-300 hover:border-[#d8d2c4]/40 hover:bg-[#151515]"
              >
                <span
                  className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#d8d2c4]/0 to-transparent transition duration-500 group-hover:via-[#d8d2c4]/60"
                  aria-hidden
                />
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/[0.055] text-[#d8d2c4] ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-[#d8d2c4]/12 group-hover:text-white group-hover:ring-[#d8d2c4]/35">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="shrink-0 text-base font-semibold text-white transition duration-300 group-hover:text-[#f4f0e7]">
                  {item.title}
                </h3>
                <p className="min-w-0 truncate text-xs leading-5 text-zinc-500 transition duration-300 group-hover:text-zinc-300">
                  {item.desc}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
