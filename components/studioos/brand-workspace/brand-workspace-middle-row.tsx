"use client";

import Link from "next/link";
import { ChevronRight, Layers3 } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import {
  BRAND_ACTIVE_CAMPAIGN_LIMIT,
  brandActiveCampaignSlotsRemaining
} from "@/lib/studioos/brand-active-campaign-limit";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "Active campaigns",
    hint: "We recommend up to 3 simultaneous campaigns for the best creative outcomes.",
    count: (active: number) => `${active}/${BRAND_ACTIVE_CAMPAIGN_LIMIT}`,
    slots: (remaining: number) =>
      remaining === 0
        ? "No slots available — complete a campaign to start another."
        : remaining === 1
          ? "You can create 1 more project."
          : `You can create ${remaining} more projects.`,
    viewProjects: "View projects"
  },
  zh: {
    title: "进行中的项目",
    hint: "为了帮助您获得更好的创意成果，我们建议同时进行的项目不超过 3 个。",
    count: (active: number) => `${active}/${BRAND_ACTIVE_CAMPAIGN_LIMIT}`,
    slots: (remaining: number) =>
      remaining === 0
        ? "暂无可新建名额 — 请等待其中一个项目完成。"
        : remaining === 1
          ? "您还可以新建 1 个项目。"
          : `您还可以新建 ${remaining} 个项目。`,
    viewProjects: "查看项目"
  }
} as const;

export function BrandWorkspaceMiddleRow({
  locale,
  activeCount
}: {
  locale: Locale;
  activeCount: number;
}) {
  const t = copy[locale];
  const remaining = brandActiveCampaignSlotsRemaining(activeCount);
  const progress = Math.min(100, (activeCount / BRAND_ACTIVE_CAMPAIGN_LIMIT) * 100);

  return (
    <section
      className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm sm:p-6"
      aria-label={t.title}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <Layers3 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-950">{t.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{t.hint}</p>
          </div>
        </div>
        <span className="shrink-0 text-lg font-semibold tabular-nums text-violet-700">{t.count(activeCount)}</span>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            activeCount >= BRAND_ACTIVE_CAMPAIGN_LIMIT ? "bg-amber-500" : "bg-violet-600"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-xl bg-zinc-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600">{t.slots(remaining)}</p>
        <Link
          href={withLocale(`${brandPortalRoutes.dashboard}#my-ads`, locale)}
          className="inline-flex h-9 items-center justify-center gap-1 rounded-full bg-violet-600 px-4 text-sm font-medium text-white transition hover:bg-violet-700"
        >
          {t.viewProjects}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
