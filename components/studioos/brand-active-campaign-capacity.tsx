"use client";

import Link from "next/link";
import {
  BRAND_ACTIVE_CAMPAIGN_LIMIT,
  brandActiveCampaignSlotsRemaining
} from "@/lib/studioos/brand-active-campaign-limit";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Layers3 } from "lucide-react";

const copy = {
  en: {
    title: "Active campaigns",
    hint: "We recommend up to 3 simultaneous campaigns for the best creative outcomes.",
    count: (active: number) => `${active} of ${BRAND_ACTIVE_CAMPAIGN_LIMIT}`,
    slots: (remaining: number) =>
      remaining === 0
        ? "No slots available — complete a campaign to start another."
        : remaining === 1
          ? "1 slot available for a new campaign."
          : `${remaining} slots available for new campaigns.`,
    atLimit: "At the recommended limit",
    viewProjects: "View projects"
  },
  zh: {
    title: "进行中的项目",
    hint: "为了帮助您获得更好的创意成果，我们建议同时进行中的项目不超过 3 个。",
    count: (active: number) => `${active} / ${BRAND_ACTIVE_CAMPAIGN_LIMIT}`,
    slots: (remaining: number) =>
      remaining === 0
        ? "暂无可新建名额 — 请等待其中一个项目完成。"
        : remaining === 1
          ? "还可新建 1 个项目。"
          : `还可新建 ${remaining} 个项目。`,
    atLimit: "已达建议上限",
    viewProjects: "查看项目"
  }
} as const;

export function BrandActiveCampaignCapacity({
  locale,
  activeCount
}: {
  locale: Locale;
  activeCount: number;
}) {
  const t = copy[locale];
  const remaining = brandActiveCampaignSlotsRemaining(activeCount);
  const atLimit = activeCount >= BRAND_ACTIVE_CAMPAIGN_LIMIT;

  return (
    <section
      className={cn(
        "rounded-2xl border p-4 sm:p-5",
        atLimit ? "border-amber-200 bg-amber-50/80" : "border-violet-100 bg-violet-50/50"
      )}
      aria-label={t.title}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              atLimit ? "bg-amber-100 text-amber-800" : "bg-white text-violet-700 shadow-sm ring-1 ring-violet-100"
            )}
          >
            <Layers3 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-950">{t.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600 sm:text-sm">{t.hint}</p>
            <p className={cn("mt-2 text-xs font-medium", atLimit ? "text-amber-800" : "text-zinc-500")}>
              {atLimit ? t.atLimit : t.slots(remaining)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5" aria-hidden>
              {Array.from({ length: BRAND_ACTIVE_CAMPAIGN_LIMIT }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    index < activeCount
                      ? atLimit
                        ? "bg-amber-500"
                        : "bg-violet-600"
                      : "bg-zinc-200"
                  )}
                />
              ))}
            </div>
            <span className="text-lg font-semibold tabular-nums text-zinc-950">{t.count(activeCount)}</span>
          </div>
          <Link
            href={withLocale(`${brandPortalRoutes.dashboard}#my-ads`, locale)}
            className="text-xs font-medium text-violet-700 hover:text-violet-800"
          >
            {t.viewProjects}
          </Link>
        </div>
      </div>
    </section>
  );
}
