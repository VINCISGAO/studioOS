"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { HOME_HERO_STUDIO_SRC } from "@/lib/hero-studio";
import { cinematicText } from "@/lib/marketing/cinematic-copy";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { ChapterLabel, MaskRevealLine, cinematicEase } from "@/components/marketing/cinematic/motion-primitives";

export function CinematicHero({
  locale,
  portalHref
}: {
  locale: Locale;
  portalHref: string;
}) {
  const t = cinematicText("hero", locale);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 0.35], [1, 1.14]);
  const y = useTransform(scrollYProgress, [0, 0.35], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.28], [1, 0.2]);

  return (
    <section className="relative min-h-[115vh] overflow-hidden bg-black">
      <motion.div style={{ scale, y }} className="absolute inset-0 will-change-transform">
        <Image
          src={HOME_HERO_STUDIO_SRC}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_38%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,transparent_0%,black_78%)]" />
      </motion.div>

      <motion.div style={{ opacity }} className="relative z-10 mx-auto flex min-h-[115vh] max-w-7xl flex-col justify-end px-5 pb-28 pt-32 sm:px-8 sm:pb-36">
        <motion.div
          initial={reduce ? false : "hidden"}
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.14, delayChildren: 0.2 } } }}
        >
          <ChapterLabel className="mb-8">{t.chapter}</ChapterLabel>

          <h1 className="max-w-4xl text-[clamp(2.5rem,6vw,4.75rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-white">
            {t.lines.map((line) => (
              <MaskRevealLine key={line}>{line}</MaskRevealLine>
            ))}
          </h1>

          <motion.p
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: cinematicEase, delay: 0.55 } } }}
            className="mt-8 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg"
          >
            {t.subtitle}
          </motion.p>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: cinematicEase, delay: 0.72 } } }}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <motion.div animate={reduce ? undefined : { y: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
              <Link
                href={portalHref}
                className="hero-shimmer-border inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-black transition hover:bg-zinc-100"
              >
                {t.primary}
              </Link>
            </motion.div>
            <Link
              href={withLocale("/login?role=creator", locale)}
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 bg-white/5 px-8 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
            >
              {t.secondary}
            </Link>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
          className="mt-20 font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-600"
        >
          {t.scroll}
        </motion.p>
      </motion.div>
    </section>
  );
}
