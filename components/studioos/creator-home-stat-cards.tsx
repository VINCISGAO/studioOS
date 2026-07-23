"use client";

import { BadgeCheck, Clock3, DollarSign, FolderKanban } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { CreatorHomeStats } from "@/lib/studioos/creator-home-ui";
import { trendToneClass } from "@/lib/studioos/creator-home-ui";
import { formatSettlementUsd } from "@/lib/money/display-money";
import { cn } from "@/lib/utils";

const iconStyles = [
  { icon: DollarSign, bg: "bg-violet-100 text-violet-700" },
  { icon: FolderKanban, bg: "bg-blue-100 text-blue-700" },
  { icon: BadgeCheck, bg: "bg-emerald-100 text-emerald-700" },
  { icon: Clock3, bg: "bg-violet-100 text-violet-700" }
] as const;

export function CreatorHomeStatCards({
  locale,
  labels,
  stats
}: {
  locale: Locale;
  labels: {
    totalEarnings: string;
    activeProjects: string;
    verification: string;
    responseTime: string;
    proCreator: string;
  };
  stats: CreatorHomeStats;
}) {
  const cards = [
    {
      label: labels.totalEarnings,
      value: formatSettlementUsd(stats.totalEarnings, locale),
      trend: stats.earningsTrend,
      sub: null
    },
    {
      label: labels.activeProjects,
      value: String(stats.activeProjects),
      trend: stats.activeTrend,
      sub: null
    },
    {
      label: labels.verification,
      value: stats.verifiedLabel,
      trend: null,
      sub: labels.proCreator
    },
    {
      label: labels.responseTime,
      value: `${stats.avgResponseHours}h`,
      trend: stats.responseTrend,
      sub: null
    }
  ];

  return (
    <section className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = iconStyles[index].icon;
        return (
          <div
            key={card.label}
            className="rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md sm:p-5"
          >
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-zinc-500 sm:text-sm">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 sm:mt-2 sm:text-3xl">{card.value}</p>
              </div>
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl",
                  iconStyles[index].bg
                )}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
            </div>
            {card.sub ? <p className="mt-1 text-xs text-zinc-500">{card.sub}</p> : null}
            {card.trend ? (
              <p className={cn("mt-2 text-[11px] font-medium sm:text-xs", trendToneClass(card.trend))}>
                {card.trend}
              </p>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
