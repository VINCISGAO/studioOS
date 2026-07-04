"use client";

import { BadgeCheck, Clock3, DollarSign, FolderKanban, ListTodo } from "lucide-react";
import type { CreatorHomeStats } from "@/lib/studioos/creator-home-ui";
import { trendToneClass } from "@/lib/studioos/creator-home-ui";
import { cn, formatCurrency } from "@/lib/utils";

const iconStyles = [
  { icon: DollarSign, bg: "bg-violet-100 text-violet-700" },
  { icon: FolderKanban, bg: "bg-blue-100 text-blue-700" },
  { icon: ListTodo, bg: "bg-amber-100 text-amber-700" },
  { icon: BadgeCheck, bg: "bg-emerald-100 text-emerald-700" },
  { icon: Clock3, bg: "bg-violet-100 text-violet-700" }
] as const;

export function CreatorHomeStatCards({
  labels,
  stats
}: {
  labels: {
    totalEarnings: string;
    activeProjects: string;
    pendingTasks: string;
    verification: string;
    responseTime: string;
    proCreator: string;
  };
  stats: CreatorHomeStats;
}) {
  const cards = [
    {
      label: labels.totalEarnings,
      value: formatCurrency(stats.totalEarnings),
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
      label: labels.pendingTasks,
      value: String(stats.pendingTasks),
      trend: stats.pendingTrend,
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
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card, index) => {
        const Icon = iconStyles[index].icon;
        return (
          <div
            key={card.label}
            className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-500">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{card.value}</p>
              </div>
              <span
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                  iconStyles[index].bg
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
            </div>
            {card.sub ? <p className="mt-1 text-xs text-zinc-500">{card.sub}</p> : null}
            {card.trend ? (
              <p className={cn("mt-2 text-xs font-medium", trendToneClass(card.trend))}>{card.trend}</p>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
