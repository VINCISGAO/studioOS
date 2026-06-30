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
  const costRows = t.rows.slice(0, 2);
  const workflowRows = t.rows.slice(2);

  return (
    <LandingSection className="bg-[#0a0a0a] py-10 sm:py-20 lg:py-24">
      <LandingShell>
        <RevealSection className="mx-auto max-w-4xl text-center">
          <LandingEyebrow>{locale === "zh" ? "成本对比" : "Cost break"}</LandingEyebrow>
          <LandingHeadline className="mx-auto mt-4 max-w-[18rem] text-[2.15rem] sm:mt-6 sm:max-w-3xl sm:text-[2.75rem] lg:text-[3.5rem]">
            {t.title}
          </LandingHeadline>
          <LandingLead className="mx-auto mt-4 max-w-[21rem] text-[14px] leading-7 sm:mt-6 sm:max-w-2xl sm:text-base sm:leading-8">
            {t.body}
          </LandingLead>
          <div className="mx-auto mt-7 hidden max-w-3xl grid-cols-1 gap-2.5 sm:mt-8 sm:grid sm:grid-cols-2">
            {t.pains.map((pain, index) => (
              <motion.div
                key={pain}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.7, ease: cinematicEase, delay: index * 0.05 }
                  }
                }}
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-center text-[13px] font-medium leading-5 text-zinc-400 sm:text-[14px]"
              >
                <X className="h-3.5 w-3.5 shrink-0 text-zinc-600" strokeWidth={1.7} />
                <span>{pain}</span>
              </motion.div>
            ))}
          </div>
        </RevealSection>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 1, ease: cinematicEase }}
          className="relative mx-auto mt-6 max-w-6xl sm:mt-10 lg:mt-12"
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-stretch">
            <ComparisonCard
              title={t.traditional}
              tone="muted"
              rows={costRows.map((row) => ({ label: row.label, value: row.trad }))}
              footerRows={workflowRows.map((row) => ({ label: row.label, value: row.trad }))}
            />

            <VsDivider />

            <ComparisonCard
              title={t.studio}
              tone="strong"
              badges={t.savings}
              rows={costRows.map((row) => ({ label: row.label, value: row.studio }))}
              footerRows={workflowRows.map((row) => ({ label: row.label, value: row.studio }))}
            />
          </div>
        </motion.div>
      </LandingShell>
    </LandingSection>
  );
}

function VsDivider() {
  return (
    <div className="relative flex min-h-12 items-center justify-center py-1 lg:min-h-full lg:px-2 lg:py-0">
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/[0.16] to-transparent lg:hidden" />
      <div className="absolute hidden h-px w-20 bg-gradient-to-r from-transparent via-white/[0.22] to-transparent lg:block" />
      <motion.div
        aria-hidden
        className="absolute h-16 w-16 rounded-full bg-white/[0.08] blur-xl"
        animate={{ opacity: [0.25, 0.55, 0.25], scale: [0.9, 1.12, 0.9] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="relative z-10 grid h-12 w-12 place-items-center rounded-full border border-white/25 bg-[radial-gradient(circle_at_35%_25%,#ffffff_0%,#f6f5f1_42%,#d9d6cf_100%)] text-[11px] font-black tracking-[0.14em] text-black shadow-[0_16px_44px_-22px_rgba(255,255,255,0.75)] sm:h-14 sm:w-14 sm:text-[12px]"
        initial={{ rotate: -8 }}
        whileInView={{ rotate: 0 }}
        whileHover={{ scale: 1.06, rotate: 0 }}
        transition={{ duration: 0.6, ease: cinematicEase }}
      >
        <span className="absolute inset-1 rounded-full border border-black/[0.08]" />
        <span className="relative">VS</span>
      </motion.div>
    </div>
  );
}

function ComparisonCard({
  title,
  tone,
  badges,
  rows,
  footerRows
}: {
  title: string;
  tone: "muted" | "strong";
  badges?: readonly string[];
  rows: Array<{ label: string; value: string }>;
  footerRows: Array<{ label: string; value: string }>;
}) {
  const isStrong = tone === "strong";
  const Icon = isStrong ? Check : X;

  return (
    <div
      className={[
        "relative overflow-hidden rounded-lg border p-5 sm:p-6 lg:p-7",
        isStrong
          ? "border-white/20 bg-white/[0.075] shadow-[0_30px_90px_-48px_rgba(255,255,255,0.45)]"
          : "border-white/[0.09] bg-white/[0.025]"
      ].join(" ")}
    >
      <div
        className={[
          "pointer-events-none absolute inset-x-0 top-0 h-px",
          isStrong ? "bg-white/45" : "bg-white/[0.08]"
        ].join(" ")}
      />

      <div className="flex min-h-12 flex-col items-center justify-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <h3
          className={[
            "text-base font-semibold tracking-[0.16em] sm:text-lg",
            isStrong ? "text-white" : "text-zinc-500"
          ].join(" ")}
        >
          {title}
        </h3>
        {badges?.length ? (
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            {badges.map((badge) => (
              <span
                key={badge}
                className="shrink-0 rounded-full border border-[#aeb9a6]/35 bg-[#aeb9a6]/10 px-3 py-1.5 text-[12px] font-semibold text-[#d8e4cf] sm:text-[13px]"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-7">
        {rows.map((row) => (
          <div
            key={row.label}
            className={[
              "rounded-lg border px-4 py-4 text-center",
              isStrong ? "border-white/[0.1] bg-black/20" : "border-white/[0.06] bg-black/15"
            ].join(" ")}
          >
            <p className="text-[12px] font-medium tracking-[0.14em] text-zinc-500">{row.label}</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Icon
                className={["h-4 w-4 shrink-0", isStrong ? "text-white" : "text-zinc-600"].join(" ")}
                strokeWidth={1.9}
              />
              <p
                className={[
                  "text-2xl font-semibold leading-none sm:text-3xl",
                  isStrong ? "text-white" : "text-zinc-500"
                ].join(" ")}
              >
                {row.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 divide-y divide-white/[0.07] border-t border-white/[0.08] pt-2">
        {footerRows.map((row) => (
          <div key={row.label} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] items-center gap-3 py-4">
            <p className="text-[12px] font-medium tracking-[0.14em] text-zinc-500">{row.label}</p>
            <div className="flex items-center justify-end gap-2 text-right">
              <Icon
                className={["h-4 w-4 shrink-0", isStrong ? "text-white" : "text-zinc-600"].join(" ")}
                strokeWidth={1.9}
              />
              <p
                className={[
                  "text-base font-semibold leading-6 sm:text-lg",
                  isStrong ? "text-white" : "text-zinc-500"
                ].join(" ")}
              >
                {row.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
