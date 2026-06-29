"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChapterLabel, cinematicEase } from "@/components/marketing/cinematic/motion-primitives";
import { cinematicText } from "@/lib/marketing/cinematic-copy";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

export function CinematicFinalCta({
  locale,
  portalHref
}: {
  locale: Locale;
  portalHref: string;
}) {
  const t = cinematicText("cta", locale);
  const { scrollYProgress } = useScroll({ offset: ["start end", "end end"] });
  const letterSpacing = useTransform(scrollYProgress, [0.7, 1], ["0.02em", "0.35em"]);
  const opacity = useTransform(scrollYProgress, [0.75, 1], [0.4, 1]);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5 py-32 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(88,28,135,0.2),transparent_70%)]" aria-hidden />

      <motion.div style={{ opacity }} className="relative z-10 mx-auto max-w-3xl text-center">
        <ChapterLabel className="justify-center text-center">{t.chapter}</ChapterLabel>

        <motion.h2
          style={{ letterSpacing }}
          className="mt-8 text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-tight tracking-tight text-white"
        >
          {t.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: cinematicEase, delay: 0.15 }}
          className="mx-auto mt-6 max-w-xl text-base leading-7 text-zinc-500"
        >
          {t.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: cinematicEase, delay: 0.28 }}
          className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href={portalHref}
            className="inline-flex h-12 min-w-[200px] items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-black transition hover:bg-zinc-100"
          >
            {t.primary}
          </Link>
          <Link
            href={withLocale("/contact", locale)}
            className="inline-flex h-12 min-w-[200px] items-center justify-center rounded-full border border-white/20 px-8 text-sm font-semibold text-white transition hover:bg-white/5"
          >
            {t.secondary}
          </Link>
        </motion.div>

        <p className="mt-24 font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-700">StudioOS — End of reel</p>
      </motion.div>
    </section>
  );
}
