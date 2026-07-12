"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DollarSign,
  FolderKanban,
  Grid3X3,
  LayoutList,
  MoreHorizontal,
  Search,
  TrendingDown,
  TrendingUp,
  UploadCloud
} from "lucide-react";
import type { StoredOrder } from "@/lib/order-types";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import {
  buildCreatorProjectRows,
  buildCreatorProjectsStats,
  type CreatorProjectsStats
} from "@/lib/studioos/creator-projects-ui";
import {
  countCreatorOrdersByBucket,
  creatorProjectFilterLabels,
  creatorProjectFilters,
  type CreatorProjectFilter
} from "@/lib/studioos/creator-order-lifecycle";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const copy = {
  zh: {
    title: "我的项目",
    subtitle: "上传、审核、修改、交付 — 都在项目详情里完成。",
    inProgress: "进行中项目",
    pendingReview: "待审核项目",
    completedMonth: "本月完成项目",
    monthlyIncome: "本月收入 (USD)",
    avgDelivery: "平均交付周期",
    search: "搜索项目名称 / 品牌",
    allBrands: "所有品牌",
    allStages: "所有阶段",
    dateRange: "开始日期 → 结束日期",
    sort: "最新动态",
    project: "项目",
    brand: "品牌",
    stage: "阶段",
    task: "当前任务",
    deadline: "截止时间",
    progress: "进度",
    amount: "金额",
    update: "最新动态",
    actions: "操作",
    detail: "查看详情",
    total: (n: number) => `共 ${n} 个项目`,
    perPage: "每页显示 10",
    empty: "当前阶段没有项目。"
  },
  en: {
    title: "My projects",
    subtitle: "Upload, review, revise, and deliver — all inside each project.",
    inProgress: "In progress",
    pendingReview: "Pending review",
    completedMonth: "Completed this month",
    monthlyIncome: "Monthly income (USD)",
    avgDelivery: "Avg delivery cycle",
    search: "Search project / brand",
    allBrands: "All brands",
    allStages: "All stages",
    dateRange: "Start → end date",
    sort: "Latest activity",
    project: "Project",
    brand: "Brand",
    stage: "Stage",
    task: "Current task",
    deadline: "Deadline",
    progress: "Progress",
    amount: "Amount",
    update: "Latest update",
    actions: "Actions",
    detail: "View details",
    total: (n: number) => `${n} projects total`,
    perPage: "10 per page",
    empty: "No projects in this stage."
  }
} as const;

const stageTone: Record<string, string> = {
  in_production: "bg-blue-50 text-blue-700",
  review: "bg-violet-50 text-violet-700",
  revision: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  waiting_payment: "bg-zinc-100 text-zinc-700"
};

function brandInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "B";
}

function statCards(stats: CreatorProjectsStats, locale: Locale) {
  const t = copy[locale];
  return [
    { label: t.inProgress, value: String(stats.inProgress), trend: stats.inProgressTrend, up: true, icon: FolderKanban, tone: "text-violet-600 bg-violet-50" },
    { label: t.pendingReview, value: String(stats.pendingReview), trend: stats.pendingTrend, up: false, icon: Clock3, tone: "text-blue-600 bg-blue-50" },
    { label: t.completedMonth, value: String(stats.completedThisMonth), trend: stats.completedTrend, up: true, icon: CheckSquare, tone: "text-amber-600 bg-amber-50" },
    { label: t.monthlyIncome, value: formatCurrency(stats.monthlyIncome, locale), trend: stats.incomeTrend, up: true, icon: DollarSign, tone: "text-emerald-600 bg-emerald-50" },
    { label: t.avgDelivery, value: locale === "zh" ? `${stats.avgDeliveryDays} 天` : `${stats.avgDeliveryDays}d`, trend: stats.deliveryTrend, up: false, icon: TrendingUp, tone: "text-violet-600 bg-violet-50" }
  ];
}

export function CreatorProjectsBoard({
  locale,
  orders,
  deliverableCounts,
  lastUploadAtByOrderId = {}
}: {
  locale: Locale;
  orders: StoredOrder[];
  deliverableCounts: Record<string, number>;
  lastUploadAtByOrderId?: Record<string, string | null>;
}) {
  const t = copy[locale];
  const labels = creatorProjectFilterLabels[locale];
  const [filter, setFilter] = useState<CreatorProjectFilter>("in_progress");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "grid">("list");
  const pageSize = 10;

  const counts = useMemo(() => countCreatorOrdersByBucket(orders), [orders]);
  const stats = useMemo(() => buildCreatorProjectsStats(locale, orders), [locale, orders]);
  const rows = useMemo(() => {
    const built = buildCreatorProjectRows({
      locale,
      orders,
      deliverableCounts,
      lastUploadAtByOrderId,
      filter
    });
    const q = query.trim().toLowerCase();
    if (!q) return built;
    return built.filter(
      (row) => row.title.toLowerCase().includes(q) || row.brand.toLowerCase().includes(q)
    );
  }, [deliverableCounts, filter, lastUploadAtByOrderId, locale, orders, query]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[28px]">{t.title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{t.subtitle}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {creatorProjectFilters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setFilter(item);
              setPage(1);
            }}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              filter === item ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:text-zinc-900"
            )}
          >
            {labels[item]} {counts[item]}
          </button>
        ))}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards(stats, locale).map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-zinc-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">{card.value}</p>
                  <p className={cn("mt-2 inline-flex items-center gap-1 text-xs font-medium", card.up ? "text-emerald-600" : "text-rose-600")}>
                    {card.up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {card.trend}
                  </p>
                </div>
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", card.tone)}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={t.search}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-11 rounded-xl border-zinc-200 bg-white">{t.allBrands}</Button>
            <Button variant="outline" className="h-11 rounded-xl border-zinc-200 bg-white">{t.allStages}</Button>
            <Button variant="outline" className="h-11 rounded-xl border-zinc-200 bg-white">
              <CalendarDays className="mr-2 h-4 w-4" />
              {t.dateRange}
            </Button>
            <Button variant="outline" className="h-11 rounded-xl border-zinc-200 bg-white">{t.sort}</Button>
            <div className="ml-auto flex rounded-xl border border-zinc-200 p-1">
              <button type="button" onClick={() => setView("list")} className={cn("rounded-lg p-2", view === "list" ? "bg-violet-600 text-white" : "text-zinc-500")}>
                <LayoutList className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setView("grid")} className={cn("rounded-lg p-2", view === "grid" ? "bg-violet-600 text-white" : "text-zinc-500")}>
                <Grid3X3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        {pageRows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] table-fixed text-left text-sm">
              <colgroup>
                <col style={{ width: "18%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "11%" }} />
              </colgroup>
              <thead className="border-b border-zinc-100 bg-zinc-50/70 text-xs font-medium text-zinc-500">
                <tr>
                  <th className="px-5 py-3 text-left">{t.project}</th>
                  <th className="px-5 py-3 text-left">{t.brand}</th>
                  <th className="px-5 py-3 text-left">{t.stage}</th>
                  <th className="px-5 py-3 text-left">{t.task}</th>
                  <th className="px-5 py-3 text-left">{t.deadline}</th>
                  <th className="px-5 py-3 text-center">{t.progress}</th>
                  <th className="px-5 py-3 text-right">{t.amount}</th>
                  <th className="px-5 py-3 text-left">{t.update}</th>
                  <th className="px-5 py-3 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pageRows.map((row) => (
                  <tr key={row.id} className="align-middle hover:bg-zinc-50/60">
                    <td className="px-5 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 text-sm font-semibold text-zinc-600">
                          {brandInitial(row.thumbSeed)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-zinc-950">{row.title}</p>
                          <p className="truncate text-xs text-zinc-500">{row.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-[10px] font-semibold text-white">
                          {brandInitial(row.brand)}
                        </span>
                        <span className="truncate text-zinc-700">{row.brand}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", stageTone[row.status] ?? "bg-zinc-100 text-zinc-700")}>
                        {row.stageLabel}
                      </span>
                    </td>
                    <td className="max-w-0 px-5 py-4">
                      <p className="truncate text-zinc-600">{row.currentTask}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="whitespace-nowrap text-zinc-700">{formatDate(row.deadline)}</p>
                      <p className="whitespace-nowrap text-xs text-amber-600">{row.deadlineHint}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="mx-auto w-24">
                        <div className="mb-1 text-center text-xs text-zinc-500">{row.progress}%</div>
                        <div className="h-1.5 rounded-full bg-zinc-100">
                          <div className="h-full rounded-full bg-violet-600" style={{ width: `${row.progress}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-medium tabular-nums text-zinc-800">
                      {formatCurrency(row.amount, locale)}
                    </td>
                    <td className="max-w-0 px-5 py-4">
                      <p className="truncate text-zinc-500" title={row.latestUpdate}>
                        {row.latestUpdate}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          asChild
                          variant={row.actionVariant === "upload" ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "shrink-0 whitespace-nowrap rounded-lg px-3",
                            row.actionVariant === "upload"
                              ? "border border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                              : "border-zinc-200"
                          )}
                        >
                          <Link href={withLocale(row.actionHref, locale)}>
                            {row.actionVariant === "upload" ? <UploadCloud className="mr-1.5 h-3.5 w-3.5" /> : null}
                            {row.actionLabel}
                          </Link>
                        </Button>
                        <button
                          type="button"
                          aria-label={locale === "zh" ? "更多操作" : "More actions"}
                          className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center text-sm text-zinc-500">{t.empty}</div>
        )}

        <div className="flex flex-col gap-3 border-t border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-500">{t.total(rows.length)}</p>
          <div className="flex items-center gap-1">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg p-2 text-zinc-500 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium",
                  page === n ? "bg-violet-600 text-white" : "text-zinc-600 hover:bg-zinc-100"
                )}
              >
                {n}
              </button>
            ))}
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg p-2 text-zinc-500 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-zinc-500">{t.perPage}</p>
        </div>
      </section>
    </div>
  );
}
