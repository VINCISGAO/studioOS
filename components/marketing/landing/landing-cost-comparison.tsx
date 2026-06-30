"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import {
  RevealSection,
  cinematicEase
} from "@/components/marketing/landing/landing-motion";
import {
  LandingEyebrow,
  LandingHeadline,
  LandingLead,
  LandingSection,
  LandingShell
} from "@/components/marketing/landing/landing-ui";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale } from "@/lib/i18n";

export function LandingCostComparison({ locale }: { locale: Locale }) {
  const t = landingText("cost", locale);

  return (
    <LandingSection className="bg-[#0a0a0a] py-14 sm:py-20">
      <LandingShell>
        <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-24 lg:items-start">
          <RevealSection>
            <LandingEyebrow>{locale === "zh" ? "成本对比" : "Cost break"}</LandingEyebrow>
            <LandingHeadline className="mt-6 max-w-[18rem] sm:max-w-none">{t.title}</LandingHeadline>
            <LandingLead className="mt-6">{t.body}</LandingLead>
            <ul className="mt-8 space-y-4 border-t border-white/[0.06] pt-8">
              {t.pains.map((pain, index) => (
                <motion.li
                  key={pain}
                  variants={{
                    hidden: { opacity: 0, x: -12 },
                    visible: {
                      opacity: 1,
                      x: 0,
                      transition: { duration: 0.75, ease: cinematicEase, delay: index * 0.05 }
                    }
                  }}
                  className="flex items-start gap-4 text-[14px] leading-6 text-zinc-500"
                >
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" strokeWidth={1.5} />
                  {pain}
                </motion.li>
              ))}
            </ul>
          </RevealSection>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 1, ease: cinematicEase }}
            className="relative"
          >
            <div className="overflow-hidden rounded-lg border border-white/[0.16] bg-[#111] shadow-[0_24px_80px_-42px_rgba(255,255,255,0.2)]">
              <div className="grid grid-cols-2 border-b border-white/[0.1] bg-white/[0.02]">
                <div className="px-6 py-5 sm:px-8 sm:py-6">
                  <p className="landing-eyebrow text-zinc-500">{t.traditional}</p>
                </div>
                <div className="border-l border-white/[0.12] px-6 py-5 sm:px-8 sm:py-6">
                  <p className="landing-eyebrow text-zinc-300">{t.studio}</p>
                </div>
              </div>

              {t.rows.map((row) => (
                <motion.div
                  key={row.label}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.995 }}
                  transition={{ duration: 0.22 }}
                  className="group grid grid-cols-2 border-b border-white/[0.08] transition-colors duration-300 last:border-b-0 hover:bg-white/[0.045]"
                >
                  <div className="space-y-2 px-6 py-5 transition-colors duration-300 group-hover:bg-black/10 sm:px-8 sm:py-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 transition-colors duration-300 group-hover:text-zinc-400">{row.label}</p>
                    <div className="flex items-center gap-2.5">
                      <X className="h-3.5 w-3.5 shrink-0 text-zinc-600 transition-colors duration-300 group-hover:text-zinc-500" strokeWidth={1.5} />
                      <p className="text-[14px] text-zinc-500 transition-colors duration-300 group-hover:text-zinc-400">{row.trad}</p>
                    </div>
                  </div>
                  <div className="space-y-2 border-l border-white/[0.12] px-6 py-5 transition-colors duration-300 group-hover:bg-white/[0.035] sm:px-8 sm:py-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 transition-colors duration-300 group-hover:text-zinc-300">{row.label}</p>
                    <div className="flex items-center gap-2.5">
                      <Check className="h-3.5 w-3.5 shrink-0 text-zinc-300 transition-colors duration-300 group-hover:text-white" strokeWidth={1.5} />
                      <p className="text-[14px] font-medium text-white transition duration-300 group-hover:drop-shadow-[0_0_14px_rgba(255,255,255,0.22)]">{row.studio}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-9 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#f6f5f1] text-xs font-bold tracking-[0.08em] text-black shadow-[0_12px_38px_-18px_rgba(255,255,255,0.55)] sm:h-10 sm:w-[4.5rem]">
              VS
            </div>

            <div className="mt-4 flex justify-center">
              <span className="rounded-full border border-[#aeb9a6]/35 bg-[#aeb9a6]/10 px-5 py-2 text-sm font-semibold text-[#c8d4bd]">
                {t.saveBadge}
              </span>
            </div>
          </motion.div>
        </div>
      </LandingShell>
    </LandingSection>
  );
}
