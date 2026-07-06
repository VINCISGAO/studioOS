"use client";

import { motion } from "framer-motion";
import { Clapperboard, FileText, Focus, Play, Shield, Users } from "lucide-react";
import {
  RevealSection,
  cinematicEase,
  useReducedMotion
} from "@/components/marketing/landing/landing-motion";
import {
  LandingEyebrow,
  LandingGhostButton,
  LandingHeadline,
  LandingPrimaryButton,
  LandingShell
} from "@/components/marketing/landing/landing-ui";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

const stepIcons = [Focus, Users, Clapperboard, Play];

export function LandingHowItWorks({ locale }: { locale: Locale }) {
  const t = landingText("steps", locale);

  return (
    <section id="how-it-works" className="bg-[#050505] py-14 text-white sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RevealSection className="mx-auto max-w-3xl text-center">
          <LandingEyebrow>{t.eyebrow}</LandingEyebrow>
          <LandingHeadline className="mx-auto mt-4 max-w-4xl text-[2.35rem] leading-[1.08] sm:text-[3.25rem] lg:text-[4rem]">
            {t.title}
          </LandingHeadline>
        </RevealSection>

        <RevealSection className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                className="group relative overflow-hidden rounded-lg border border-white/10 bg-[#111315] p-6 transition hover:border-[#d8d2c4]/35 hover:bg-[#151515]"
              >
                <div className="relative flex h-11 w-11 items-center justify-center rounded-md bg-white/[0.055] text-[#d8d2c4] ring-1 ring-white/10">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="relative mt-6 font-mono text-xs text-[#d8d2c4]/80">{item.num}</p>
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
  const icons = [FileText, Users, Shield];
  const reduce = useReducedMotion();
  const chainLabel = locale === "zh" ? "进入同一条生产链路" : "Managed inside one production flow";

  return (
    <section className="relative overflow-hidden border-y border-black/[0.08] bg-[#f6f5f1] py-14 sm:py-20 lg:py-20">
      <LandingShell className="relative w-full">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.75fr)] lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
              {t.eyebrow}
            </p>
            <h2 className="mt-5 max-w-[56rem] text-[1.8rem] font-semibold leading-[1.08] tracking-tight text-zinc-950 sm:text-[2.35rem] lg:text-[2.75rem]">
              <span className="block">{t.titleLine1}</span>
              <span className="block">{t.titleLine2}</span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-600">
              {t.subtitle}
            </p>
          </div>

          <motion.div
            whileHover={
              reduce
                ? undefined
                : {
                    y: -5,
                    boxShadow: "0 28px 70px -36px rgba(0,0,0,0.28)",
                    transition: { type: "spring", stiffness: 380, damping: 28 }
                  }
            }
            className="rounded-lg border border-black/10 bg-white p-3 shadow-sm transition-[border-color,box-shadow] duration-500 hover:border-black/15"
          >
            {t.items.map((item, index) => {
              const Icon = icons[index] ?? FileText;
              return (
                <motion.div
                  key={item}
                  whileHover={
                    reduce
                      ? undefined
                      : {
                          x: 6,
                          backgroundColor: "rgba(0,0,0,0.025)",
                          transition: { duration: 0.25 }
                        }
                  }
                  whileTap={reduce ? undefined : { scale: 0.995 }}
                  className="group flex cursor-default items-center gap-4 border-b border-black/10 px-4 py-4 last:border-b-0"
                >
                  <motion.span
                    whileHover={
                      reduce
                        ? undefined
                        : { scale: 1.08, rotate: -3, transition: { type: "spring", stiffness: 420, damping: 22 } }
                    }
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-white transition-colors duration-300 group-hover:bg-zinc-800"
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </motion.span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-950 transition-colors duration-300 group-hover:text-zinc-800">
                      {item}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 transition-colors duration-300 group-hover:text-zinc-600">
                      {chainLabel}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
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
    <section className="bg-black px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 1, ease: cinematicEase }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-lg border border-white/12 bg-[#0c0f11] p-8 sm:p-12"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
              {t.title}
            </h2>
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
