"use client";

import { motion } from "framer-motion";
import { Clapperboard, FileText, Focus, Play, Shield, Users } from "lucide-react";
import {
  MaskRevealLine,
  RevealSection,
  cinematicEase
} from "@/components/marketing/landing/landing-motion";
import {
  LandingEyebrow,
  LandingGhostButton,
  LandingHeadline,
  LandingLead,
  LandingPrimaryButton,
  LandingSection,
  LandingShell
} from "@/components/marketing/landing/landing-ui";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

const stepIcons = [Focus, Users, Clapperboard, Play];

export function LandingHowItWorks({ locale }: { locale: Locale }) {
  const t = landingText("steps", locale);

  return (
    <section id="how-it-works" className="bg-[#050505] py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RevealSection className="mx-auto max-w-3xl text-center">
          <LandingEyebrow>{t.eyebrow}</LandingEyebrow>
          <LandingHeadline className="mt-4">{t.title}</LandingHeadline>
        </RevealSection>

        <RevealSection className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.items.map((item, index) => {
            const Icon = stepIcons[index] ?? FileText;
            return (
              <motion.article
                key={item.num}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: cinematicEase } }
                }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#141414] to-[#0a0a0a] p-6 transition hover:border-violet-500/35 hover:shadow-[0_20px_50px_-24px_rgba(139,92,246,0.5)]"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-600/10 blur-2xl transition group-hover:bg-violet-600/20" />
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600/15 text-violet-300 ring-1 ring-violet-500/20">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="relative mt-6 font-mono text-xs text-violet-400/80">{item.num}</p>
                <h3 className="relative mt-1 text-lg font-semibold tracking-tight">{item.title}</h3>
                <p className="relative mt-2 text-sm leading-6 text-zinc-400">{item.desc}</p>
              </motion.article>
            );
          })}
        </RevealSection>
      </div>
    </section>
  );
}

export function LandingWhy({ locale }: { locale: Locale }) {
  const t = landingText("why", locale);

  return (
    <section className="relative flex min-h-[80svh] items-center overflow-hidden border-y border-white/[0.06] bg-[#030303] py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_65%)]" />
      <LandingShell className="relative w-full text-center">
        <RevealSection>
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: cinematicEase } }
            }}
            className="text-base text-zinc-700 line-through decoration-zinc-800 sm:text-xl"
          >
            {t.line1} {t.line2}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 1, ease: cinematicEase, delay: 0.1 }}
          >
            <LandingHeadline as="h2" className="mx-auto mt-14 max-w-4xl text-[2.75rem] sm:text-[3.75rem] lg:text-[4.75rem]">
              <MaskRevealLine>{t.highlight}</MaskRevealLine>
            </LandingHeadline>
          </motion.div>
        </RevealSection>
      </LandingShell>
    </section>
  );
}

export function LandingFeatures({ locale }: { locale: Locale }) {
  const t = landingText("features", locale);

  return (
    <section className="grid border-t border-white/[0.06] bg-[#030303] lg:grid-cols-2">
      <div className="border-b border-white/[0.06] p-10 sm:p-14 lg:border-b-0 lg:border-r">
        <h3 className="text-lg font-medium tracking-[-0.02em] text-white">{t.networkTitle}</h3>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {t.networkItems.map((item) => (
            <li key={item} className="text-[14px] text-zinc-500">
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="p-10 sm:p-14">
        <h3 className="flex items-center gap-2 text-lg font-medium tracking-[-0.02em] text-white">
          <Shield className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
          {t.trustTitle}
        </h3>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {t.trustItems.map((item) => (
            <li key={item} className="text-[14px] text-zinc-500">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function LandingCta({
  locale,
  portalHref,
  portalLabel
}: {
  locale: Locale;
  portalHref: string;
  portalLabel?: string;
}) {
  const t = landingText("cta", locale);
  const primaryLabel = portalLabel ?? t.primary;

  return (
    <section className="bg-black px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 1, ease: cinematicEase }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/80 via-[#0f0a1a] to-black p-10 sm:p-14"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{t.title}</h2>
            <p className="mt-4 text-base leading-7 text-zinc-400">{t.subtitle}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <LandingPrimaryButton href={portalHref}>{primaryLabel}</LandingPrimaryButton>
            <LandingGhostButton href={withLocale("/contact", locale)}>{t.secondary}</LandingGhostButton>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
