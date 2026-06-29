"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  MessageSquare,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2
} from "lucide-react";
import { HomeScrollReveal } from "@/components/marketing/home-scroll-reveal";
import { WorkCoverImage } from "@/components/creator/work-cover-image";
import { LandingEyebrow, LandingHeadline, LandingLead, LandingSection, LandingShell } from "@/components/marketing/landing/landing-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    eyebrow: "Review & approval",
    title: "Review like Frame.io. Approve like enterprise.",
    subtitle:
      "Time-coded comments, version stacks, and stakeholder routing — native to your production OS, not bolted on.",
    versions: ["v1", "v2", "v3"],
    comments: [
      {
        time: "00:04",
        author: "Brand — Maya",
        text: "Hook feels slow — trim first 0.5s, punch in on product texture.",
        color: "violet"
      },
      {
        time: "00:12",
        author: "Legal — Alex",
        text: "Disclaimer placement approved. Check CTA safe zone on 9:16.",
        color: "amber"
      },
      {
        time: "00:19",
        author: "Studio — Nova",
        text: "v3 addresses notes. Ready for final sign-off.",
        color: "emerald"
      }
    ],
    approved: "Approved for paid social",
    pending: "2 open threads"
  },
  zh: {
    eyebrow: "审片与审批",
    title: "Frame.io 级审片，企业级审批。",
    subtitle: "时间码评论、版本栈与角色路由 — 内置于制作操作系统，不是外挂工具。",
    versions: ["v1", "v2", "v3"],
    comments: [
      {
        time: "00:04",
        author: "品牌 — Maya",
        text: "开场偏慢 — 剪掉前 0.5 秒，产品质感特写再推进。",
        color: "violet"
      },
      {
        time: "00:12",
        author: "法务 — Alex",
        text: "免责声明位置 OK。请检查 9:16 画幅 CTA 安全区。",
        color: "amber"
      },
      {
        time: "00:19",
        author: "制作 — Nova",
        text: "v3 已处理全部意见，可终审。",
        color: "emerald"
      }
    ],
    approved: "已通过付费社交投放",
    pending: "2 条待处理"
  }
};

export function HomeReviewShowcase({
  locale,
  posterSrc,
  projectTitle
}: {
  locale: Locale;
  posterSrc?: string | null;
  projectTitle?: string;
}) {
  const t = copy[locale];
  const [version, setVersion] = useState(2);
  const title = projectTitle ?? "Summer Launch — Hero 9:16";

  return (
    <LandingSection className="relative overflow-hidden bg-[#0a0a0a] pb-8 lg:pb-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(255,255,255,0.035),transparent_60%)]" />

      <LandingShell className="relative">
        <HomeScrollReveal className="mx-auto max-w-3xl text-center lg:max-w-4xl">
          <LandingEyebrow>{t.eyebrow}</LandingEyebrow>
          <LandingHeadline className="mt-6 text-[2.25rem] sm:text-[3rem] lg:text-[3.75rem]">{t.title}</LandingHeadline>
          <LandingLead className="mx-auto mt-6">{t.subtitle}</LandingLead>
        </HomeScrollReveal>

        <HomeScrollReveal delay={1} className="mx-auto mt-16 lg:mt-20">
          <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#080808] shadow-[0_48px_120px_-48px_rgba(0,0,0,0.9)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-2 text-xs text-zinc-500">{title}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {t.versions.map((v, i) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVersion(i)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[11px] font-medium transition",
                      version === i ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <div className="border-b border-white/[0.06] lg:border-b-0 lg:border-r">
                <div className="relative aspect-[16/10] bg-zinc-950">
                  {posterSrc ? (
                    <WorkCoverImage src={posterSrc} alt={title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
                  )}
                  <div className="absolute inset-0 bg-black/25" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_35%_25%,rgba(255,255,255,0.06),transparent_55%)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      type="button"
                      className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] backdrop-blur transition hover:scale-105 hover:bg-white/10"
                      aria-label="Play"
                    >
                      <Play className="ml-0.5 h-7 w-7 fill-white text-white" />
                    </button>
                  </div>

                  <span className="absolute left-[18%] top-[42%] h-3.5 w-3.5 animate-pin-pop-1 rounded-full border-2 border-white/80 bg-white shadow-[0_0_20px_rgba(255,255,255,0.35)]" />
                  <span className="absolute left-[48%] top-[58%] h-3.5 w-3.5 animate-pin-pop-2 rounded-full border-2 border-amber-200/80 bg-amber-300/90 shadow-[0_0_16px_rgba(251,191,36,0.45)]" />
                  <span className="absolute left-[72%] top-[36%] h-3.5 w-3.5 animate-pin-pop-3 rounded-full border-2 border-emerald-200/80 bg-emerald-300/90 shadow-[0_0_16px_rgba(52,211,153,0.45)]" />
                </div>

                <div className="border-t border-white/[0.06] px-4 py-3 sm:px-5">
                  <div className="relative h-1 rounded-full bg-white/10">
                    <div className="absolute left-0 top-0 h-full w-[63%] rounded-full bg-white/70" />
                    <div className="animate-playhead absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-[#030303] bg-white shadow-lg" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
                    <div className="flex items-center gap-3">
                      <Pause className="h-3.5 w-3.5" />
                      <SkipBack className="h-3.5 w-3.5" />
                      <SkipForward className="h-3.5 w-3.5" />
                      <Volume2 className="h-3.5 w-3.5" />
                      <span className="font-mono">00:19 / 00:30</span>
                    </div>
                    <span className="text-zinc-600">{t.pending}</span>
                  </div>
                </div>
              </div>

              <aside className="flex flex-col bg-[#060606]">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 sm:px-5">
                  <span className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {locale === "zh" ? "评论线程" : "Comment threads"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-zinc-600" />
                </div>
                <ul className="flex-1 space-y-3 p-4 sm:p-5">
                  {t.comments.map((comment) => (
                    <li
                      key={comment.time}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 transition hover:border-white/[0.1]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-zinc-600">{comment.time}</span>
                        <span className="text-[10px] text-zinc-500">{comment.author}</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-zinc-400">{comment.text}</p>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-white/[0.06] p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500/80" />
                    {t.approved}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </HomeScrollReveal>
      </LandingShell>
    </LandingSection>
  );
}
