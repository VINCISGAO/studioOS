"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Clapperboard, FileText, Focus, Play, Users } from "lucide-react";
import {
  RevealSection,
  cinematicEase
} from "@/components/marketing/landing/landing-motion";
import {
  MarketingEyebrowPill,
  MarketingSectionTitle,
  LandingGhostButton,
  LandingPrimaryButton
} from "@/components/marketing/landing/landing-ui";
import { landingText } from "@/lib/marketing/landing-copy";
import { marketingHomeHref } from "@/lib/marketing/localized-href";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { isChineseLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const stepIcons = [Focus, Users, Clapperboard, Play];

export function LandingHowItWorks({
  locale,
  copyLocale = locale
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
}) {
  const t = landingText("steps", copyLocale);
  const reduce = useReducedMotion();

  return (
    <section className="bg-[#050505] py-10 text-white sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RevealSection className="mx-auto max-w-3xl text-center">
          <MarketingEyebrowPill tone="dark">{t.eyebrow}</MarketingEyebrowPill>
          <MarketingSectionTitle className="mx-auto mt-4 max-w-4xl">
            {t.title}
          </MarketingSectionTitle>
          {t.subtitle ? (
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">{t.subtitle}</p>
          ) : null}
        </RevealSection>

        <div className="mt-6 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4">
          {t.items.map((item, index) => {
            const Icon = stepIcons[index] ?? FileText;
            return (
              <motion.article
                key={item.num}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8%" }}
                transition={{ duration: 0.55, delay: index * 0.08, ease: cinematicEase }}
                whileHover={reduce ? undefined : { y: -4 }}
                className="group relative flex items-center gap-3 overflow-hidden rounded-lg border border-white/10 bg-[#111315] p-4 transition hover:border-[#d8d2c4]/35 hover:bg-[#151515]"
              >
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/[0.055] text-[#d8d2c4] ring-1 ring-white/10">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="relative shrink-0 font-mono text-[11px] text-[#d8d2c4]/80">{item.num}</p>
                <h3 className="relative shrink-0 text-base font-semibold tracking-tight text-white">{item.title}</h3>
                <p className="relative min-w-0 truncate text-xs leading-5 text-zinc-400">{item.desc}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function LandingCta({
  locale,
  copyLocale = locale
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
}) {
  const t = landingText("cta", copyLocale);
  const compactTitle = isChineseLanguage(copyLocale) || copyLocale === "ja" || copyLocale === "ko";

  return (
    <section className="bg-[#050505] pb-8 pt-3 sm:pb-12 sm:pt-4">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1, ease: cinematicEase }}
          className="relative overflow-hidden rounded-lg border border-white/12 bg-[#0c0f11] p-8 sm:p-12"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
          <div className="relative grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="text-center sm:text-left">
              <h2
                className={cn(
                  "mx-auto max-w-2xl font-semibold leading-tight tracking-tight text-white sm:mx-0 lg:text-4xl",
                  compactTitle ? "text-[1.45rem] sm:text-[2.05rem]" : "text-[1.6rem] sm:text-[2.05rem]"
                )}
              >
                {t.title}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:mx-0 sm:mt-4 sm:text-base sm:leading-7">
                {t.subtitle}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <LandingPrimaryButton href={marketingHomeHref.brand(copyLocale)} className="w-full sm:w-auto">
                {t.primary}
              </LandingPrimaryButton>
              <LandingGhostButton href={marketingHomeHref.contact(copyLocale)} className="w-full sm:w-auto">
                {t.secondary}
              </LandingGhostButton>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
