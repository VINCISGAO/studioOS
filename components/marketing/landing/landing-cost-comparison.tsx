"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Check, X } from "lucide-react";
import { cinematicEase } from "@/components/marketing/landing/landing-motion";
import {
  LandingEyebrow,
  LandingHeadline,
  LandingLead,
  LandingSection,
  LandingShell
} from "@/components/marketing/landing/landing-ui";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function LegacyMark({ className }: { className?: string }) {
  return <X className={cn("h-4 w-4 text-red-500", className)} strokeWidth={2.4} aria-hidden />;
}

const spring = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.82 };

const headerStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } }
};

const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.95, ease: cinematicEase }
  }
};

export function LandingCostComparison({ locale }: { locale: Locale }) {
  const t = landingText("cost", locale);
  const reduce = useReducedMotion();
  const costRows = t.rows.slice(0, 2);
  const workflowRows = t.rows.slice(2);

  return (
    <LandingSection className="relative overflow-hidden bg-[#000000] py-16 sm:py-24 lg:py-28">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(255,255,255,0.07),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        aria-hidden
      />

      <LandingShell className="relative">
        <motion.div
          initial={reduce ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          variants={headerStagger}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div variants={fadeUpItem}>
            <LandingEyebrow className="!font-sans !text-[13px] !font-semibold !normal-case !tracking-[0.22em] !text-zinc-400 sm:!text-sm sm:!tracking-[0.26em]">
              {locale === "zh" ? "成本对比" : "Cost comparison"}
            </LandingEyebrow>
          </motion.div>
          <motion.div variants={fadeUpItem}>
            <LandingHeadline className="mx-auto mt-5 text-[2rem] font-semibold tracking-[-0.04em] text-white sm:text-[2.75rem] lg:text-[3.25rem]">
              {t.title}
            </LandingHeadline>
          </motion.div>
          <motion.div variants={fadeUpItem}>
            <LandingLead className="mx-auto mt-5 max-w-2xl whitespace-pre-line text-center text-[15px] leading-7 text-zinc-400 sm:text-base sm:leading-8">
              {t.body}
            </LandingLead>
          </motion.div>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-6%" }}
          transition={{ duration: 1.05, ease: cinematicEase, delay: 0.12 }}
          className="relative mx-auto mt-12 max-w-5xl lg:mt-16"
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch lg:gap-6">
            <ComparePanel
              title={t.traditional}
              variant="legacy"
              rows={costRows.map((row) => ({ label: row.label, value: row.trad }))}
              footerRows={workflowRows.map((row) => ({ label: row.label, value: row.trad }))}
              delay={0.05}
              reduce={reduce}
            />

            <VsMark reduce={reduce} />

            <ComparePanel
              title={t.studio}
              variant="studio"
              badges={t.savings}
              rows={costRows.map((row) => ({ label: row.label, value: row.studio }))}
              footerRows={workflowRows.map((row) => ({ label: row.label, value: row.studio }))}
              delay={0.14}
              reduce={reduce}
            />
          </div>
        </motion.div>
      </LandingShell>
    </LandingSection>
  );
}

function VsMark({ reduce }: { reduce: boolean | null }) {
  return (
    <div className="relative flex min-h-10 items-center justify-center py-2 lg:min-h-full lg:px-1">
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent lg:hidden" />
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.72 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ ...spring, delay: 0.18 }}
        whileHover={reduce ? undefined : { scale: 1.06 }}
        className="relative z-10 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/[0.08] text-[10px] font-semibold tracking-[0.22em] text-white/90 shadow-[0_0_40px_rgba(255,255,255,0.12)] backdrop-blur-xl sm:h-12 sm:w-12"
      >
        VS
      </motion.div>
    </div>
  );
}

function ComparePanel({
  title,
  variant,
  badges,
  rows,
  footerRows,
  delay,
  reduce
}: {
  title: string;
  variant: "legacy" | "studio";
  badges?: readonly string[];
  rows: Array<{ label: string; value: string }>;
  footerRows: Array<{ label: string; value: string }>;
  delay: number;
  reduce: boolean | null;
}) {
  const isStudio = variant === "studio";

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: isStudio ? 36 : 24, scale: isStudio ? 0.96 : 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ ...spring, delay }}
      whileHover={
        reduce
          ? undefined
          : {
              y: isStudio ? -6 : -2,
              transition: { type: "spring", stiffness: 380, damping: 28 }
            }
      }
      className={cn(
        "group relative overflow-hidden rounded-[1.75rem] border p-6 sm:p-7 lg:p-8",
        "backdrop-blur-2xl transition-[box-shadow,border-color] duration-500",
        isStudio
          ? "border-white/20 bg-white/[0.08] shadow-[0_40px_120px_-60px_rgba(255,255,255,0.55)] hover:border-white/30 hover:shadow-[0_50px_140px_-50px_rgba(255,255,255,0.65)]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/10"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
          isStudio ? "via-white/50" : "via-white/10"
        )}
      />
      {isStudio ? (
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/[0.06] blur-3xl transition-opacity duration-700 group-hover:opacity-100"
          aria-hidden
        />
      ) : null}

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h3
          className={cn(
            "text-lg font-semibold tracking-[-0.03em] sm:text-xl",
            isStudio ? "text-white" : "text-zinc-500"
          )}
        >
          {title}
        </h3>
        {badges?.length ? (
          <div className="flex flex-wrap gap-2">
            {badges.map((badge, index) => (
              <motion.span
                key={badge}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: cinematicEase, delay: delay + 0.12 + index * 0.06 }}
                className="rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-1 text-[11px] font-medium tracking-wide text-emerald-200/90"
              >
                {badge}
              </motion.span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative mt-7 grid gap-3 sm:grid-cols-2">
        {rows.map((row, index) => (
          <MetricTile
            key={row.label}
            label={row.label}
            value={row.value}
            isStudio={isStudio}
            index={index}
            delay={delay}
            reduce={reduce}
          />
        ))}
      </div>

      <div className="relative mt-6 space-y-0 divide-y divide-white/[0.06] border-t border-white/[0.06]">
        {footerRows.map((row, index) => (
          <CompareRow
            key={row.label}
            label={row.label}
            value={row.value}
            isStudio={isStudio}
            index={index}
            delay={delay}
            reduce={reduce}
          />
        ))}
      </div>
    </motion.article>
  );
}

function MetricTile({
  label,
  value,
  isStudio,
  index,
  delay,
  reduce
}: {
  label: string;
  value: string;
  isStudio: boolean;
  index: number;
  delay: number;
  reduce: boolean | null;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ ...spring, delay: delay + 0.08 + index * 0.05 }}
      whileHover={reduce ? undefined : { scale: 1.02 }}
      className={cn(
        "rounded-2xl border px-4 py-5 text-center transition-colors duration-300",
        isStudio
          ? "border-white/10 bg-black/20 group-hover:border-white/15"
          : "border-white/[0.05] bg-black/25"
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <div className="mt-3 flex items-center justify-center gap-2">
        {isStudio ? (
          <Check className="h-4 w-4 text-emerald-300/90" strokeWidth={2.2} />
        ) : (
          <LegacyMark />
        )}
        <p
          className={cn(
            "font-semibold tracking-[-0.03em]",
            isStudio ? "text-[1.75rem] text-white sm:text-[2rem]" : "text-2xl text-zinc-500 sm:text-[1.75rem]"
          )}
        >
          {value}
        </p>
      </div>
    </motion.div>
  );
}

function CompareRow({
  label,
  value,
  isStudio,
  index,
  delay,
  reduce
}: {
  label: string;
  value: string;
  isStudio: boolean;
  index: number;
  delay: number;
  reduce: boolean | null;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, x: isStudio ? 12 : -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.75, ease: cinematicEase, delay: delay + 0.16 + index * 0.05 }}
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4 transition-colors duration-300",
        isStudio && "rounded-xl px-1 hover:bg-white/[0.03]"
      )}
    >
      <p className="text-[13px] font-medium text-zinc-500">{label}</p>
      <div className="flex items-center gap-2 text-right">
        {isStudio ? (
          <Check className="h-4 w-4 text-white/80" strokeWidth={2} />
        ) : (
          <LegacyMark className="h-3.5 w-3.5" />
        )}
        <p className={cn("text-[15px] font-semibold tracking-[-0.02em]", isStudio ? "text-white" : "text-zinc-500")}>
          {value}
        </p>
      </div>
    </motion.div>
  );
}
