"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Banknote, Check, Clock3, CreditCard, Globe2, PencilLine, Sparkles, Users, X } from "lucide-react";
import { LandingSection, LandingShell } from "@/components/marketing/landing/landing-ui";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function LegacyMark({ className }: { className?: string }) {
  return <X className={cn("h-4 w-4 text-rose-300/80", className)} strokeWidth={2.2} aria-hidden />;
}

function StudioMark({ className }: { className?: string }) {
  return <Check className={cn("h-4 w-4 text-[#e8e0d0]", className)} strokeWidth={2.15} aria-hidden />;
}

export function LandingCostComparison({ locale }: { locale: Locale }) {
  const t = landingText("cost", locale);
  const reduce = useReducedMotion();
  const costRows = t.rows.slice(0, 2);
  const workflowRows = t.rows.slice(2);

  return (
    <LandingSection className="relative overflow-hidden bg-[#000000] py-5 sm:py-16 lg:py-20">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(255,255,255,0.07),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        aria-hidden
      />

      <LandingShell className="relative">
        <ComparisonBoard
          locale={locale}
          title={t.compareTitle}
          traditional={t.traditional}
          studio={t.studio}
          labels={
            locale === "zh"
              ? {
                  model: "对比模型",
                  legacy: "传统链路",
                  studio: "系统化交付",
                  pain: "传统模式的问题",
                  workflow: "对比项",
                  faster: "更快",
                  cheaper: "更便宜",
                  smarter: "更智能",
                  creatorCta: "一眼看懂差异",
                  creatorSub: "已经有 100+ 品牌和创作者在 VINCIS 完成合作",
                  cases: "了解更多案例",
                  start: "立即开始"
                }
              : {
                  model: "Comparison model",
                  legacy: "Legacy stack",
                  studio: "Operating system",
                  pain: "Why it feels heavy",
                  workflow: "Compare",
                  faster: "Faster",
                  cheaper: "Cheaper",
                  smarter: "Smarter",
                  creatorCta: "Connect global creators, ship better creative",
                  creatorSub: "100+ brands and creators have collaborated through VINCIS",
                  cases: "View cases",
                  start: "Start now"
                }
          }
          badges={t.savings}
          painPoints={t.pains}
          costRows={costRows}
          workflowRows={workflowRows}
          reduce={reduce}
        />
      </LandingShell>
    </LandingSection>
  );
}

function ComparisonBoard({
  locale,
  traditional,
  studio,
  labels,
  badges,
  costRows,
  workflowRows,
  reduce
}: {
  locale: Locale;
  title: string;
  traditional: string;
  studio: string;
  labels: {
    model: string;
    legacy: string;
    studio: string;
    pain: string;
    workflow: string;
    faster: string;
    cheaper: string;
    smarter: string;
    creatorCta: string;
    creatorSub: string;
    cases: string;
    start: string;
  };
  badges: readonly string[];
  painPoints: readonly string[];
  costRows: Array<{ label: string; trad: string; studio: string }>;
  workflowRows: Array<{ label: string; trad: string; studio: string }>;
  reduce: boolean | null;
}) {
  const comparisonRows = [
    { icon: Banknote, label: costRows[0]?.label ?? "", trad: costRows[0]?.trad ?? "", studio: costRows[0]?.studio ?? "" },
    { icon: Clock3, label: costRows[1]?.label ?? "", trad: costRows[1]?.trad ?? "", studio: costRows[1]?.studio ?? "" },
    { icon: Users, label: workflowRows[0]?.label ?? "", trad: workflowRows[0]?.trad ?? "", studio: workflowRows[0]?.studio ?? "" },
    { icon: PencilLine, label: workflowRows[1]?.label ?? "", trad: workflowRows[1]?.trad ?? "", studio: workflowRows[1]?.studio ?? "" },
    {
      icon: CreditCard,
      label: locale === "zh" ? "支付方式" : "Payment",
      trad: locale === "zh" ? "传统合同" : "Traditional contract",
      studio: locale === "zh" ? "平台托管支付" : "Platform escrow"
    },
    {
      icon: Sparkles,
      label: locale === "zh" ? "AI & 智能" : "AI & automation",
      trad: locale === "zh" ? "无" : "None",
      studio: locale === "zh" ? "AI 赋能全流程" : "AI-assisted workflow"
    }
  ];

  const stats = [
    {
      icon: Banknote,
      label: locale === "zh" ? "节省成本" : "Cost saved",
      value: "70%+",
      caption: locale === "zh" ? "相比传统广告公司" : "Compared with agencies"
    },
    {
      icon: Clock3,
      label: locale === "zh" ? "交付时间" : "Delivery time",
      value: "80%+",
      caption: locale === "zh" ? "更快完成项目" : "Faster project delivery"
    },
    {
      icon: Globe2,
      label: locale === "zh" ? "覆盖全球" : "Global reach",
      value: "20+",
      caption: locale === "zh" ? "国家和地区的创作者" : "countries and regions"
    }
  ];

  return (
    <motion.div
      className="relative mx-auto mt-0 max-w-6xl"
    >
      <div className="pointer-events-none absolute inset-x-8 top-8 h-52 rounded-full bg-[#e8e0d0]/[0.055] blur-3xl" />
      <div className="relative">
        <div className="mx-auto flex max-w-3xl justify-center">
          <span className="rounded-full border border-white/[0.08] bg-white/[0.045] px-4 py-1.5 text-[11px] font-medium tracking-[0.08em] text-zinc-300">
            {labels.faster} · {labels.cheaper} · {labels.smarter}
          </span>
        </div>
        <h3 className="mt-4 text-center text-[2rem] font-semibold tracking-[-0.055em] text-white sm:mt-5 sm:text-[2.9rem]">
          {locale === "zh" ? "为什么选择 VINCIS?" : "Why choose VINCIS?"}
        </h3>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-zinc-500 sm:mt-3 sm:text-base">
          {locale === "zh"
            ? "用 AI 和全球创作者网络，重新定义广告制作流程"
            : "Redefine commercial production with AI and a global creator network"}
        </p>
      </div>

      <motion.div
        whileHover={
          reduce
            ? undefined
            : {
                y: -3,
                transition: { type: "spring", stiffness: 360, damping: 30 }
              }
        }
        className="relative mt-7 overflow-hidden rounded-[1.65rem] border border-white/[0.12] bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] shadow-[0_48px_150px_-90px_rgba(255,255,255,0.65)] backdrop-blur-2xl"
      >
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[38%] bg-[radial-gradient(ellipse_at_center,rgba(232,224,208,0.13),transparent_65%)]" />
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#e8e0d0]/45 to-transparent" />

        <div className="relative grid items-stretch lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 lg:flex lg:h-full lg:flex-col">
            <div className="grid shrink-0 grid-cols-[minmax(0,0.9fr)_minmax(92px,0.75fr)_minmax(112px,0.9fr)] border-b border-white/[0.08] text-[12px] font-semibold tracking-[0.08em] text-zinc-400 sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.9fr)_minmax(220px,1fr)] sm:text-[13px]">
              <div className="px-4 py-4 text-center sm:px-7">{labels.workflow}</div>
              <div className="border-l border-white/[0.08] px-3 py-4 text-center sm:px-6">{traditional}</div>
              <div className="relative border-l border-[#e8e0d0]/[0.14] bg-white/[0.04] px-3 py-4 text-center text-white sm:px-6">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#e8e0d0] shadow-[0_0_18px_rgba(232,224,208,0.7)]" />
                  VINCIS
                </span>
              </div>
            </div>

        {comparisonRows.map((row) => (
          <ComparisonTableRow key={row.label} row={row} />
            ))}
          </div>

          <div className="grid h-full gap-3 border-t border-white/[0.08] p-4 sm:grid-cols-3 lg:grid-cols-1 lg:border-l lg:border-t-0 lg:p-5">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex h-full items-center gap-4 rounded-2xl border border-white/[0.075] bg-white/[0.04] px-5 py-3.5"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/[0.065] text-[#e8e0d0] ring-1 ring-white/[0.06]">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span>
                    <span className="block text-[12px] font-medium text-zinc-400">{stat.label}</span>
                    <span className="block text-2xl font-semibold tracking-[-0.05em] text-[#e8e0d0]">{stat.value}</span>
                    <span className="block text-[11px] text-zinc-500">{stat.caption}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative grid gap-4 border-t border-white/[0.08] px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-7">
          <div className="text-center">
            <p className="text-base font-semibold tracking-[-0.035em] text-white">{labels.creatorCta}</p>
            <p className="mt-1 text-sm text-zinc-500">{labels.creatorSub}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="#work"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.12] px-5 text-sm font-medium text-zinc-200 transition hover:border-white/25 hover:bg-white/[0.05]"
            >
              {labels.cases}
              <span aria-hidden>→</span>
            </a>
            <a
              href={locale === "zh" ? "/login?role=brand&lang=zh" : "/login?role=brand&lang=en"}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              {labels.start}
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ComparisonTableRow({
  row
}: {
  row: { icon: typeof Banknote; label: string; trad: string; studio: string };
}) {
  const Icon = row.icon;

  return (
    <div
      className="grid grid-cols-[minmax(0,0.9fr)_minmax(92px,0.75fr)_minmax(112px,0.9fr)] border-b border-white/[0.07] text-[12px] last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.9fr)_minmax(220px,1fr)] sm:text-sm lg:flex-1"
    >
      <div className="flex items-center justify-center gap-2 px-4 py-3.5 text-center font-medium text-zinc-300 sm:px-7">
        <Icon className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.7} />
        <span>{row.label}</span>
      </div>
      <div className="flex items-center justify-center gap-2 border-l border-white/[0.08] px-3 py-3.5 font-medium text-zinc-400 sm:px-6">
        <LegacyMark className="hidden h-3.5 w-3.5 sm:block" />
        <span>{row.trad}</span>
      </div>
      <div className="relative flex items-center justify-center gap-2 border-l border-[#e8e0d0]/[0.14] bg-white/[0.04] px-3 py-3.5 font-semibold text-white sm:px-6">
        <StudioMark className="h-3.5 w-3.5" />
        <span>{row.studio}</span>
      </div>
    </div>
  );
}
