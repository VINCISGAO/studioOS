"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  AnimatedCounter,
  ChapterLabel,
  RevealSection,
  cinematicEase
} from "@/components/marketing/cinematic/motion-primitives";
import { cinematicText } from "@/lib/marketing/cinematic-copy";
import type { Locale } from "@/lib/i18n";

export function CinematicCostBreak({ locale }: { locale: Locale }) {
  const t = cinematicText("cost", locale);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ offset: ["start end", "end start"] });
  const cut = useTransform(scrollYProgress, [0.15, 0.55], [100, 0]);
  const clipPath = useTransform(cut, (v) => `inset(0 ${v}% 0 0)`);
  const slashLeft = useTransform(cut, (v) => `${100 - v}%`);
  const slashOpacity = useTransform(scrollYProgress, [0.2, 0.45], [0, 1]);

  const currency = locale === "zh" ? "¥" : "$";

  return (
    <section className="relative bg-black py-32 sm:py-40">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <RevealSection>
          <ChapterLabel>{t.chapter}</ChapterLabel>
          <motion.h2
            variants={{
              hidden: { opacity: 0, y: 32 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: cinematicEase } }
            }}
            className="mt-6 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl"
          >
            {t.title}
          </motion.h2>
        </RevealSection>

        <div className="relative mt-20 min-h-[420px] overflow-hidden rounded-3xl border border-white/10 sm:min-h-[480px]">
          <motion.div
            style={reduce ? undefined : { clipPath }}
            className="absolute inset-0 z-[2] bg-gradient-to-br from-zinc-900 to-zinc-950"
          >
            <div className="flex h-full flex-col justify-center px-8 sm:px-14">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-red-400/80">{t.agency}</p>
              <p className="mt-4 text-sm text-zinc-500">{t.agencyLabel}</p>
              <AnimatedCounter
                value={t.agencyPrice}
                locale={locale}
                prefix={currency}
                className="mt-3 font-mono text-5xl font-semibold text-zinc-300 sm:text-7xl"
              />
            </div>
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-black to-black">
            <div className="flex h-full flex-col items-end justify-center px-8 text-right sm:px-14">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-violet-300">{t.studio}</p>
              <p className="mt-4 text-sm text-zinc-500">{t.studioLabel}</p>
              <AnimatedCounter
                value={t.studioPrice}
                locale={locale}
                prefix={currency}
                className="mt-3 font-mono text-5xl font-semibold text-white sm:text-7xl"
              />
              <span className="mt-6 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-300">
                {t.save}
              </span>
            </div>
          </div>

          <motion.div
            style={reduce ? undefined : { opacity: slashOpacity, left: slashLeft }}
            className="pointer-events-none absolute inset-y-0 z-10 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white to-transparent shadow-[0_0_40px_rgba(255,255,255,0.45)]"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
