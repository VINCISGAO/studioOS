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
    <LandingSection className="bg-[#0a0a0a]">
      <LandingShell>
        <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-24 lg:items-start">
          <RevealSection>
            <LandingEyebrow>{locale === "zh" ? "成本对比" : "Cost break"}</LandingEyebrow>
            <LandingHeadline className="mt-6 max-w-[18rem] sm:max-w-none">{t.title}</LandingHeadline>
            <LandingLead className="mt-6">{t.body}</LandingLead>
            <ul className="mt-12 space-y-5 border-t border-white/[0.06] pt-10">
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
            className="relative lg:pt-10"
          >
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
              <div className="grid grid-cols-2 border-b border-white/[0.06]">
                <div className="px-6 py-5 sm:px-8 sm:py-6">
                  <p className="landing-eyebrow">{t.traditional}</p>
                </div>
                <div className="border-l border-white/[0.06] px-6 py-5 sm:px-8 sm:py-6">
                  <p className="landing-eyebrow text-zinc-400">{t.studio}</p>
                </div>
              </div>

              {t.rows.map((row) => (
                <div key={row.label} className="grid grid-cols-2 border-b border-white/[0.06] last:border-b-0">
                  <div className="space-y-2 px-6 py-5 sm:px-8 sm:py-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">{row.label}</p>
                    <div className="flex items-center gap-2.5">
                      <X className="h-3.5 w-3.5 shrink-0 text-zinc-600" strokeWidth={1.5} />
                      <p className="text-[14px] text-zinc-500">{row.trad}</p>
                    </div>
                  </div>
                  <div className="space-y-2 border-l border-white/[0.06] px-6 py-5 sm:px-8 sm:py-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">{row.label}</p>
                    <div className="flex items-center gap-2.5">
                      <Check className="h-3.5 w-3.5 shrink-0 text-zinc-300" strokeWidth={1.5} />
                      <p className="text-[14px] font-medium text-white">{row.studio}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute -right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black text-xs font-bold text-white shadow-xl sm:-right-4">
              VS
            </div>

            <div className="mt-4 flex justify-center">
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-300">
                {t.saveBadge}
              </span>
            </div>
          </motion.div>
        </div>
      </LandingShell>
    </LandingSection>
  );
}
