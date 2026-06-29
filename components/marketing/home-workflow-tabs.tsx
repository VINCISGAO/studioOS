"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle2,
  Clapperboard,
  FileText,
  MessageSquare,
  Users
} from "lucide-react";
import { HomeScrollReveal } from "@/components/marketing/home-scroll-reveal";
import { LandingEyebrow, LandingHeadline, LandingLead, LandingSection, LandingShell } from "@/components/marketing/landing/landing-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type TabId = "brief" | "match" | "produce" | "review";

const copy = {
  en: {
    eyebrow: "Workflow",
    title: "Move fast. Break nothing.",
    subtitle:
      "From structured brief to escrow release — every stakeholder stays aligned, every version stays traceable.",
    tabs: {
      brief: {
        label: "Brief",
        title: "AI-assisted briefs that procurement can trust",
        body: "Six-step wizard, confirmed snapshots, and brand checklists — no more scattered docs or ambiguous asks.",
        points: ["Structured campaign wizard", "Confirmed brief PDF export", "Brand asset library"]
      },
      match: {
        label: "Match",
        title: "Portfolio-first studio matching",
        body: "Browse real ad work, open Proposal Room, and route the right studio — without endless email threads.",
        points: ["Style & platform filters", "Proposal Room quotes", "Invite-only visibility"]
      },
      produce: {
        label: "Produce",
        title: "Production with guardrails",
        body: "Escrow, contracts, and studio assignment in one flow — so creative teams focus on the cut, not the chase.",
        points: ["Dual-sign contracts", "Escrow milestones", "Creator assignment alerts"]
      },
      review: {
        label: "Review",
        title: "Frame-accurate review & approval",
        body: "Timeline comments, version stacks, and approval gates — the Ziflow / Frame.io experience, built into StudioOS.",
        points: ["Time-coded feedback", "Version compare", "Audit-ready approvals"]
      }
    }
  },
  zh: {
    eyebrow: "工作流",
    title: "快速推进，零失误。",
    subtitle: "从结构化简报到托管释放 — 每个角色对齐，每个版本可追溯。",
    tabs: {
      brief: {
        label: "需求",
        title: "AI 辅助简报，采购也能放心",
        body: "六步向导、确认快照与品牌清单 — 告别散落文档与模糊需求。",
        points: ["结构化投放向导", "确认简报 PDF 导出", "品牌素材库"]
      },
      match: {
        label: "匹配",
        title: "作品集优先的制作方匹配",
        body: "先看真实广告作品，再进方案间报价 — 不用在邮件里来回拉扯。",
        points: ["风格与平台筛选", "方案间报价", "邀请制可见性"]
      },
      produce: {
        label: "制作",
        title: "有护栏的制作执行",
        body: "托管、合约与指派在一个流程里 — 制作方专注出片，不用追催付款。",
        points: ["双签合约", "托管里程碑", "制作方指派通知"]
      },
      review: {
        label: "审片",
        title: "帧级审片与审批",
        body: "时间轴评论、版本栈与审批关卡 — Ziflow / Frame.io 级体验，内置于 StudioOS。",
        points: ["时间码反馈", "版本对比", "可审计审批"]
      }
    }
  }
};

const tabOrder: TabId[] = ["brief", "match", "produce", "review"];

const tabIcons = {
  brief: FileText,
  match: Users,
  produce: Clapperboard,
  review: MessageSquare
};

function TabPreview({ tab, locale }: { tab: TabId; locale: Locale }) {
  if (tab === "brief") {
    return (
      <div className="space-y-3 p-5">
        {[1, 2, 3, 4, 5, 6].map((step) => (
          <div
            key={step}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-xs transition",
              step <= 4
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
                : "border-white/10 bg-white/[0.03] text-zinc-500"
            )}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 font-mono text-[10px]">
              {step}
            </span>
            {locale === "zh" ? `向导步骤 ${step}` : `Wizard step ${step}`}
            {step <= 4 ? <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-400" /> : null}
          </div>
        ))}
      </div>
    );
  }

  if (tab === "match") {
    return (
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        {["Nova Motion", "Signal Frame", "Copperwing"].map((name, i) => (
          <div
            key={name}
            className={cn(
              "rounded-xl border p-3 transition",
              i === 0 ? "border-violet-400/30 bg-violet-500/10" : "border-white/10 bg-white/[0.03]"
            )}
          >
            <div className="aspect-video rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900" />
            <p className="mt-2 text-xs font-medium text-white">{name}</p>
            <p className="text-[10px] text-zinc-500">{locale === "zh" ? "9:16 · CPG" : "9:16 · CPG"}</p>
          </div>
        ))}
      </div>
    );
  }

  if (tab === "produce") {
    return (
      <div className="space-y-3 p-5">
        {[
          locale === "zh" ? "合约已双签" : "Contract signed",
          locale === "zh" ? "托管 $4,200" : "Escrow $4,200",
          locale === "zh" ? "Nova Studio 制作中" : "Nova Studio in production"
        ].map((label, i) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className={cn("h-2 w-2 rounded-full", i < 2 ? "bg-emerald-400" : "bg-amber-400 animate-pulse")} />
            <span className="text-xs text-zinc-300">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
        <div className="absolute bottom-3 left-3 right-3 h-1 rounded-full bg-white/10">
          <div className="h-full w-2/3 rounded-full bg-violet-400" />
        </div>
        <span className="absolute left-[22%] top-[38%] h-3 w-3 animate-pin-pop-1 rounded-full border-2 border-violet-300 bg-violet-500 shadow-[0_0_12px_rgba(167,139,250,0.8)]" />
        <span className="absolute left-[55%] top-[52%] h-3 w-3 animate-pin-pop-2 rounded-full border-2 border-amber-200 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)]" />
      </div>
    </div>
  );
}

export function HomeWorkflowTabs({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [active, setActive] = useState<TabId>("brief");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((prev) => {
        const index = tabOrder.indexOf(prev);
        return tabOrder[(index + 1) % tabOrder.length];
      });
    }, 5200);
    return () => window.clearInterval(timer);
  }, []);

  const activeTab = t.tabs[active];

  return (
    <LandingSection className="border-t border-white/[0.06] bg-[#030303] text-white">
      <LandingShell>
        <HomeScrollReveal className="max-w-2xl">
          <LandingEyebrow>{t.eyebrow}</LandingEyebrow>
          <LandingHeadline className="mt-6">{t.title}</LandingHeadline>
          <LandingLead className="mt-5">{t.subtitle}</LandingLead>
        </HomeScrollReveal>

        <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-14">
          <HomeScrollReveal delay={1}>
            <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-0 lg:divide-y lg:divide-white/[0.06] lg:border-y lg:border-white/[0.06]">
              {tabOrder.map((id) => {
                const Icon = tabIcons[id];
                const isActive = active === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActive(id)}
                    className={cn(
                      "flex w-full items-center gap-3 px-0 py-4 text-left transition duration-300 lg:px-1",
                      isActive ? "text-white" : "text-zinc-600 hover:text-zinc-400"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    <span className="text-[15px] font-medium tracking-[-0.01em]">{t.tabs[id].label}</span>
                    {isActive ? <span className="ml-auto hidden h-px w-8 bg-white lg:block" /> : null}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 lg:mt-12"
              >
                <h3 className="text-xl font-medium tracking-[-0.02em] text-white sm:text-2xl">{activeTab.title}</h3>
                <p className="mt-4 text-[15px] leading-7 text-zinc-500">{activeTab.body}</p>
                <ul className="mt-6 space-y-3">
                  {activeTab.points.map((point) => (
                    <li key={point} className="flex items-center gap-3 text-[14px] text-zinc-400">
                      <span className="h-1 w-1 rounded-full bg-zinc-600" />
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </HomeScrollReveal>

          <HomeScrollReveal delay={2}>
            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#080808] shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9)]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <span className="text-xs text-zinc-500">StudioOS — {t.tabs[active].label}</span>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                  <BarChart3 className="h-3 w-3" />
                  Live
                </span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <TabPreview tab={active} locale={locale} />
                </motion.div>
              </AnimatePresence>
            </div>
          </HomeScrollReveal>
        </div>
      </LandingShell>
    </LandingSection>
  );
}
