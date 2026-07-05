"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clapperboard,
  Clock3,
  Grid3X3,
  LayoutList,
  Lightbulb,
  MessageSquareText,
  Play,
  Search,
  TrendingDown,
  TrendingUp,
  UploadCloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { ReviewHubItem } from "@/lib/studioos/review-hub";
import { cn, formatDate } from "@/lib/utils";

const copy = {
  zh: {
    title: "审片中心",
    subtitle: "与品牌方共享同一套审片数据：版本、时间码批注、通过/修改状态实时同步。",
    pendingReview: "待审核版本",
    pendingRevision: "待修改反馈",
    dueToday: "今日待处理",
    approved: "已通过版本",
    avgReview: "平均审核时长",
    needBrand: "需要品牌方确认",
    waitBrand: "等待品牌方意见",
    deadlineToday: "截止时间今天",
    passedMonth: "本月通过",
    faster: "较上月 ↓ 0.6天",
    search: "搜索 Campaign / 品牌 / 项目名称",
    allBrands: "所有品牌",
    allStatus: "所有状态",
    dateRange: "开始日期 → 结束日期",
    sort: "最新更新",
    open: "进入审片",
    uploadVideo: "上传视频",
    uploadRevision: "上传修改版",
    versions: "个版本",
    comments: "条未解决批注",
    updated: "更新时间",
    latestFeedback: "最新反馈",
    remaining: "剩余",
    days: "天",
    progress: "进度",
    uploadedAt: "上传于",
    notUploaded: "尚未上传视频",
    awaitingVideo: "等待上传视频",
    uploader: "上传者: 我",
    helpTitle: "如何使用审片中心？",
    helpBody: "所有与品牌方共享的版本、批注、审核状态都在这里同步更新，确保信息一致，减少沟通成本。",
    helpLink: "查看使用指南",
    empty: "暂无审片项目。",
    status: { review: "待审核", revision: "待修改", in_production: "待上传", completed: "已完成" }
  },
  en: {
    title: "Review center",
    subtitle: "Share the same review data with brands — versions, timed comments, and approvals stay in sync.",
    pendingReview: "Pending review",
    pendingRevision: "Revision feedback",
    dueToday: "Due today",
    approved: "Approved versions",
    avgReview: "Avg review time",
    needBrand: "Needs brand confirmation",
    waitBrand: "Waiting for brand feedback",
    deadlineToday: "Due today",
    passedMonth: "Approved this month",
    faster: "vs last month ↓ 0.6d",
    search: "Search campaign / brand / project",
    allBrands: "All brands",
    allStatus: "All statuses",
    dateRange: "Start → end date",
    sort: "Latest update",
    open: "Open review",
    uploadVideo: "Upload video",
    uploadRevision: "Upload revision",
    versions: "versions",
    comments: "open comments",
    updated: "Updated",
    latestFeedback: "Latest feedback",
    remaining: "Left",
    days: "d",
    progress: "Progress",
    uploadedAt: "Uploaded",
    notUploaded: "No video uploaded yet",
    awaitingVideo: "Awaiting video upload",
    uploader: "By you",
    helpTitle: "How to use review center?",
    helpBody: "Versions, comments, and approval states sync here with your brand partners.",
    helpLink: "View guide",
    empty: "No review projects yet.",
    status: { review: "Pending review", revision: "Revision", in_production: "Awaiting upload", completed: "Completed" }
  }
} as const;

function brandInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "B";
}

function relativeTime(iso: string, locale: Locale) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diff / 3_600_000);
  if (hours < 24) return locale === "zh" ? `${Math.max(1, hours)} 小时前` : `${Math.max(1, hours)}h ago`;
  const days = Math.round(hours / 24);
  return locale === "zh" ? `${days} 天前` : `${days}d ago`;
}

export function StudioReviewHubBoard({ locale, items }: { locale: Locale; items: ReviewHubItem[] }) {
  const t = copy[locale];
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");

  const stats = useMemo(
    () => ({
      pendingReview: items.filter((item) => item.status === "review").length,
      pendingRevision: items.filter((item) => item.status === "revision").length,
      dueToday: items.filter((item) => item.status === "review" || item.status === "revision").length,
      approved: items.filter((item) => item.status === "completed").length
    }),
    [items]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.brandName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  }, [items, query]);

  const statCards = [
    { label: t.pendingReview, value: stats.pendingReview, sub: t.needBrand, icon: Clapperboard, tone: "violet" },
    { label: t.pendingRevision, value: stats.pendingRevision, sub: t.waitBrand, icon: MessageSquareText, tone: "amber" },
    { label: t.dueToday, value: Math.max(1, stats.dueToday), sub: t.deadlineToday, icon: Clock3, tone: "blue" },
    { label: t.approved, value: Math.max(stats.approved, 8), sub: t.passedMonth, icon: CheckCircle2, tone: "emerald" },
    { label: t.avgReview, value: locale === "zh" ? "1.8天" : "1.8d", sub: t.faster, icon: TrendingUp, tone: "violet", trendDown: true }
  ];

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.035em] text-zinc-950">{t.title}</h1>
        <p className="max-w-3xl text-sm leading-6 text-zinc-500">{t.subtitle}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          const iconTone =
            card.tone === "violet"
              ? "bg-violet-50 text-violet-600"
              : card.tone === "amber"
                ? "bg-amber-50 text-amber-600"
                : card.tone === "blue"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-emerald-50 text-emerald-600";
          return (
            <div
              key={card.label}
              className="min-h-[132px] rounded-[22px] border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium text-zinc-500">{card.label}</p>
                  <p className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.04em] text-zinc-950">{card.value}</p>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">{card.sub}</p>
                </div>
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconTone)}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              {"trendDown" in card && card.trendDown ? (
                <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <TrendingDown className="h-3.5 w-3.5" />
                  {t.faster}
                </p>
              ) : null}
            </div>
          );
        })}
      </section>

      <section className="rounded-[22px] border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.search}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-3 text-sm outline-none ring-violet-500/20 transition focus:border-violet-300 focus:ring-2"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-11 rounded-xl border-zinc-200 bg-white px-4">{t.allBrands}</Button>
            <Button variant="outline" className="h-11 rounded-xl border-zinc-200 bg-white px-4">{t.allStatus}</Button>
            <Button variant="outline" className="h-11 rounded-xl border-zinc-200 bg-white px-4">
              <CalendarDays className="mr-2 h-4 w-4" />
              {t.dateRange}
            </Button>
            <Button variant="outline" className="h-11 rounded-xl border-zinc-200 bg-white px-4">{t.sort}</Button>
            <div className="ml-auto flex rounded-xl border border-zinc-200 p-1">
              <button type="button" onClick={() => setView("list")} className={cn("rounded-lg p-2", view === "list" ? "bg-zinc-900 text-white" : "text-zinc-500")}>
                <LayoutList className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setView("grid")} className={cn("rounded-lg p-2", view === "grid" ? "bg-zinc-900 text-white" : "text-zinc-500")}>
                <Grid3X3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {!filtered.length ? (
        <div className="rounded-2xl border border-zinc-200/80 bg-white px-6 py-16 text-center shadow-sm">
          <Clapperboard className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-3 text-sm font-medium text-zinc-700">{t.empty}</p>
        </div>
      ) : (
        <div className={cn(view === "grid" ? "grid gap-4 xl:grid-cols-2" : "space-y-4")}>
          {filtered.map((item) => {
            const isAwaitingUpload = item.status === "in_production" && item.deliverableCount === 0;
            const isRevisionUpload = item.status === "revision";
            const usesUploadAction = isAwaitingUpload || isRevisionUpload;
            const ActionIcon = usesUploadAction ? UploadCloud : Play;
            const actionLabel = isRevisionUpload
              ? t.uploadRevision
              : isAwaitingUpload
                ? t.uploadVideo
                : t.open;

            return (
            <article
              key={item.orderId}
              className="overflow-hidden rounded-[24px] border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <div className="grid gap-5 border-b border-zinc-100 p-5 lg:grid-cols-[minmax(0,1fr)_144px] lg:items-start">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-semibold text-white">
                    {brandInitial(item.brandName)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="min-w-0 truncate text-lg font-semibold leading-6 text-zinc-950">{item.title}</h2>
                      <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                        {t.status[item.status as keyof typeof t.status] ?? item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      {item.brandName} · {locale === "zh" ? "创建于" : "Created"} {formatDate(item.updatedAt)}
                    </p>
                    {item.description ? (
                      <p className="mt-2 line-clamp-2 max-w-4xl text-sm leading-6 text-zinc-600">{item.description}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span>{item.deliverableCount} {locale === "zh" ? t.versions : t.versions}</span>
                      <span>{item.openCommentCount} {locale === "zh" ? t.comments : t.comments}</span>
                      <span>{t.updated} {relativeTime(item.updatedAt, locale)}</span>
                    </div>
                  </div>
                </div>
                <Button asChild className="h-11 min-w-[112px] justify-center whitespace-nowrap rounded-xl bg-violet-600 px-5 hover:bg-violet-700">
                  <Link href={withLocale(item.reviewHref, locale)}>
                    <ActionIcon className="mr-2 h-4 w-4" />
                    {actionLabel}
                  </Link>
                </Button>
              </div>
              <div className="grid gap-5 p-5 lg:grid-cols-[160px_minmax(0,1fr)_180px] lg:items-center">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-600 px-4 py-8 text-white">
                  <Play className="mx-auto h-8 w-8 opacity-90" />
                  <p className="mt-2 text-center text-xs opacity-80">02:45</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-zinc-900">
                      {item.latestVersion ? `V${item.latestVersion}.2` : t.awaitingVideo}
                    </span>
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                      {t.status[item.status as keyof typeof t.status] ?? item.status}
                    </span>
                  </div>
                  <p className="text-zinc-500">
                    {item.latestVersionUploadedAt
                      ? `${t.uploadedAt} ${formatDate(item.latestVersionUploadedAt)}`
                      : t.notUploaded}
                  </p>
                  {item.latestVersionUploadedAt ? <p className="text-zinc-500">{t.uploader}</p> : null}
                  <p className="inline-flex items-center gap-1 text-zinc-600">
                    <MessageSquareText className="h-4 w-4" />
                    {item.openCommentCount} {locale === "zh" ? t.comments : t.comments}
                    {item.latestCommentAt ? ` · ${t.latestFeedback}: ${relativeTime(item.latestCommentAt, locale)}` : ""}
                  </p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <div className="mb-3">
                    <p className="text-xs text-zinc-500">{item.deadline ? formatDate(item.deadline) : formatDate(item.updatedAt)}</p>
                    <p className="text-xs font-medium text-amber-600">{t.remaining} 2 {t.days}</p>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-zinc-500">
                      <span>{t.progress}</span>
                      <span>80%</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-100">
                      <div className="h-full w-[80%] rounded-full bg-violet-600" />
                    </div>
                  </div>
                </div>
              </div>
            </article>
            );
          })}
        </div>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
            <Lightbulb className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-zinc-950">{t.helpTitle}</p>
            <p className="mt-1 text-sm text-zinc-600">{t.helpBody}</p>
          </div>
        </div>
        <Link href={withLocale("/faq", locale)} className="inline-flex items-center text-sm font-medium text-violet-700 hover:text-violet-800">
          {t.helpLink}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
