"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clapperboard,
  Grid3X3,
  LayoutList,
  Lightbulb,
  MessageSquareText,
  Play,
  Search,
  TrendingUp,
  UploadCloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { ReviewHubItem } from "@/lib/studioos/review-hub";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    title: "审片中心",
    subtitle: "与品牌方共享同一套审片数据：版本、时间码批注、通过/修改状态实时同步。",
    pendingReview: "待审核版本",
    pendingRevision: "待修改反馈",
    approved: "已通过版本",
    avgReview: "平均审核时长",
    needBrand: "需要品牌方确认",
    waitBrand: "等待品牌方意见",
    passedMonth: "累计通过",
    avgReviewBase: "基于已完成版本",
    search: "搜索 Campaign / 品牌 / 项目名称",
    allBrands: "所有品牌",
    allStatus: "所有状态",
    dateRange: "开始日期 → 结束日期",
    sort: "最新更新",
    open: "进入审片",
    uploadVideo: "上传第一版视频",
    uploadRevision: "上传修改版",
    uploadVersion: "上传视频版本",
    orderDetail: "查看订单详情",
    projectNo: "项目编号",
    paid: "已付款",
    brand: "品牌方",
    orderAmount: "订单金额",
    paymentStatus: "付款状态",
    dueDate: "交付截止",
    confirmed: "订单已确认",
    uploadVersionStep: "上传视频版本",
    brandReviewStep: "品牌方审核",
    projectDoneStep: "项目完成",
    waitUpload: "等待上传",
    waitStart: "待开始",
    waitComplete: "待完成",
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
    guideIntro:
      "审片中心是品牌方与创作者共同协作审核视频的地方。所有版本、批注和审核记录都会实时同步，避免重复沟通，确保每一次修改都有据可查。",
    guideSteps: [
      {
        title: "1. 上传新版本",
        body: "创作者每完成一次修改，即可上传新的视频版本。系统会自动保留历史版本，方便随时对比和回溯。"
      },
      {
        title: "2. 添加批注",
        body: "点击视频任意时间点即可留下批注，支持文字说明，让反馈更加准确，不再需要反复截图或发送消息。"
      },
      {
        title: "3. 查看修改状态",
        body: "每条批注都会显示处理状态，例如：待处理、修改中、已完成。品牌方可以实时查看修改进度。"
      },
      {
        title: "4. 审核并确认",
        body: "确认当前版本符合要求后，点击审核通过即可进入下一阶段。如仍需调整，可继续添加批注并等待新的版本。"
      },
      {
        title: "5. 查看历史版本",
        body: "所有历史版本都会永久保存，可随时切换查看，对比修改效果，确保不会遗漏任何内容。"
      }
    ],
    guideWhyTitle: "为什么使用审片中心？",
    guideWhyItems: [
      "所有反馈集中管理，不再分散在微信、邮件或聊天工具。",
      "精准定位视频时间点，沟通更加高效。",
      "每次修改都有完整记录，可随时追溯。",
      "品牌方与创作者始终保持同一审核进度。",
      "减少沟通成本，让项目交付更加顺畅。"
    ],
    empty: "暂无审片项目。",
    status: { paid: "待上传", review: "待审核", revision: "待修改", in_production: "待上传", completed: "已完成" }
  },
  en: {
    title: "Review center",
    subtitle: "Share the same review data with brands — versions, timed comments, and approvals stay in sync.",
    pendingReview: "Pending review",
    pendingRevision: "Revision feedback",
    approved: "Approved versions",
    avgReview: "Avg review time",
    needBrand: "Needs brand confirmation",
    waitBrand: "Waiting for brand feedback",
    passedMonth: "Total approved",
    avgReviewBase: "Based on completed versions",
    search: "Search campaign / brand / project",
    allBrands: "All brands",
    allStatus: "All statuses",
    dateRange: "Start → end date",
    sort: "Latest update",
    open: "Open review",
    uploadVideo: "Upload first video",
    uploadRevision: "Upload revision",
    uploadVersion: "Upload video version",
    orderDetail: "View order details",
    projectNo: "Project ID",
    paid: "Paid",
    brand: "Brand",
    orderAmount: "Order amount",
    paymentStatus: "Payment",
    dueDate: "Due date",
    confirmed: "Order confirmed",
    uploadVersionStep: "Upload video version",
    brandReviewStep: "Brand review",
    projectDoneStep: "Project complete",
    waitUpload: "Waiting upload",
    waitStart: "Not started",
    waitComplete: "Not complete",
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
    guideIntro:
      "The review center is where brands and creators review videos together. Versions, comments, and review records stay synced so every change is traceable.",
    guideSteps: [
      {
        title: "1. Upload a new version",
        body: "Creators can upload a new video version after each revision. Historical versions are kept for comparison and rollback."
      },
      {
        title: "2. Add comments",
        body: "Click any video timestamp to leave written feedback, so review notes are precise without repeated screenshots or side messages."
      },
      {
        title: "3. Track revision status",
        body: "Each comment shows its status, such as pending, in progress, or completed, so brands can follow progress in real time."
      },
      {
        title: "4. Review and approve",
        body: "Approve the current version when it meets requirements. If more changes are needed, add comments and wait for the next version."
      },
      {
        title: "5. View version history",
        body: "All historical versions are saved so you can switch back, compare changes, and avoid missing details."
      }
    ],
    guideWhyTitle: "Why use review center?",
    guideWhyItems: [
      "Keep all feedback in one place instead of chat, email, or screenshots.",
      "Pin feedback to exact video timestamps.",
      "Keep a complete record of every revision.",
      "Keep brands and creators aligned on the same review status.",
      "Reduce communication cost and make delivery smoother."
    ],
    empty: "No review projects yet.",
    status: { paid: "Awaiting upload", review: "Pending review", revision: "Revision", in_production: "Awaiting upload", completed: "Completed" }
  }
} as const;

function formatMoney(amount: number) {
  return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function shortDate(iso: string | null) {
  if (!iso) return "--";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

function activeStep(item: ReviewHubItem) {
  if (item.status === "completed") return 5;
  if (item.status === "review" || item.status === "revision" || item.deliverableCount > 0) return 4;
  return 3;
}

function reviewDurationDays(item: ReviewHubItem) {
  if (item.status !== "completed" || !item.latestVersionUploadedAt) {
    return null;
  }
  const startedAt = new Date(item.latestVersionUploadedAt).getTime();
  const completedAt = new Date(item.updatedAt).getTime();
  if (Number.isNaN(startedAt) || Number.isNaN(completedAt) || completedAt < startedAt) {
    return null;
  }
  return (completedAt - startedAt) / (1000 * 60 * 60 * 24);
}

function formatAvgReviewDays(locale: Locale, value: number) {
  if (value <= 0) {
    return locale === "zh" ? "0天" : "0d";
  }
  const rounded = Math.round(value * 10) / 10;
  return locale === "zh" ? `${rounded}天` : `${rounded}d`;
}

export function StudioReviewHubBoard({ locale, items }: { locale: Locale; items: ReviewHubItem[] }) {
  const t = copy[locale];
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");

  const stats = useMemo(
    () => {
      const reviewDurations = items
        .map(reviewDurationDays)
        .filter((value): value is number => value != null);
      const avgReviewDays =
        reviewDurations.length > 0
          ? reviewDurations.reduce((sum, value) => sum + value, 0) / reviewDurations.length
          : 0;

      return {
        pendingReview: items.filter((item) => item.status === "review").length,
        pendingRevision: items.filter((item) => item.status === "revision").length,
        approved: items.filter((item) => item.status === "completed").length,
        avgReviewDays
      };
    },
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
    { label: t.approved, value: stats.approved, sub: t.passedMonth, icon: CheckCircle2, tone: "emerald" },
    { label: t.avgReview, value: formatAvgReviewDays(locale, stats.avgReviewDays), sub: t.avgReviewBase, icon: TrendingUp, tone: "violet" }
  ];

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.035em] text-zinc-950">{t.title}</h1>
        <p className="max-w-3xl text-sm leading-6 text-zinc-500">{t.subtitle}</p>
      </header>

      <section className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
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
              className="rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md sm:p-5"
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-zinc-500 sm:text-sm">{card.label}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 sm:mt-2 sm:text-3xl">{card.value}</p>
                </div>
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl", iconTone)}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{card.sub}</p>
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
            const isAwaitingUpload =
              (item.status === "paid" || item.status === "in_production") && item.deliverableCount === 0;
            const isRevisionUpload = item.status === "revision";
            const usesUploadAction = isAwaitingUpload || isRevisionUpload;
            const actionLabel = isRevisionUpload
              ? t.uploadRevision
              : isAwaitingUpload
                ? t.uploadVersion
                : t.open;
            const currentStep = activeStep(item);
            const projectCode = item.projectId ?? item.orderId;
            const steps = [
              { label: t.confirmed, meta: shortDate(item.updatedAt).slice(5) },
              { label: t.paid, meta: shortDate(item.updatedAt).slice(5) },
              {
                label: t.uploadVersionStep,
                meta: item.latestVersionUploadedAt ? shortDate(item.latestVersionUploadedAt).slice(5) : t.waitUpload
              },
              { label: t.brandReviewStep, meta: t.waitStart },
              { label: t.projectDoneStep, meta: item.status === "completed" ? t.projectDoneStep : t.waitComplete }
            ];

            return (
            <article
              key={item.orderId}
              className="overflow-hidden rounded-[18px] border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <div className="grid gap-5 px-5 pb-4 pt-5 lg:grid-cols-[200px_minmax(0,1fr)_170px] lg:items-start">
                <div className="relative h-[118px] overflow-hidden rounded-xl bg-zinc-100">
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-200 to-zinc-100 text-zinc-400">
                      <Play className="h-8 w-8" />
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 rounded bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
                    02:15
                  </span>
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-[20px] font-semibold leading-7 text-zinc-950">{item.title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t.status[item.status as keyof typeof t.status] ?? item.status}
                    </span>
                    <span className="text-zinc-400">·</span>
                    <span className="text-zinc-500">
                      {t.projectNo}: {projectCode}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 text-sm text-zinc-500 lg:grid-cols-4">
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-400">{t.brand}</p>
                      <p className="mt-1 truncate font-medium text-zinc-800">{item.brandName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">{t.orderAmount}</p>
                      <p className="mt-1 font-semibold text-zinc-900">{formatMoney(item.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">{t.paymentStatus}</p>
                      <p className="mt-1 inline-flex items-center gap-1 font-medium text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t.paid}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">{t.dueDate}</p>
                      <p className="mt-1 font-medium text-zinc-800">{shortDate(item.deadline)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:items-stretch">
                  <Button asChild className="h-11 rounded-xl bg-violet-600 px-5 text-sm font-semibold hover:bg-violet-700">
                    <Link href={withLocale(item.reviewHref, locale)}>
                      {usesUploadAction ? <UploadCloud className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                      {actionLabel}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-11 rounded-xl border-zinc-200 bg-white px-5 text-sm font-semibold">
                    <Link href={withLocale(`/studio/projects/${item.orderId}`, locale)}>
                      {t.orderDetail}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="border-t border-zinc-100 px-5 py-4">
                <div className="grid grid-cols-5 items-start gap-2">
                  {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const done = stepNumber < currentStep;
                    const active = stepNumber === currentStep;
                    return (
                      <div key={step.label} className="relative text-center">
                        {index > 0 ? (
                          <span className="absolute right-1/2 top-3 h-px w-full bg-zinc-200" aria-hidden />
                        ) : null}
                        <span
                          className={cn(
                            "relative z-10 mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                            done && "bg-violet-100 text-violet-600",
                            active && "bg-violet-600 text-white shadow-[0_6px_14px_rgba(124,58,237,0.24)]",
                            !done && !active && "border border-zinc-200 bg-white text-zinc-300"
                          )}
                        >
                          {done ? <CheckCircle2 className="h-4 w-4" /> : stepNumber}
                        </span>
                        <p className="mt-2 text-xs font-medium text-zinc-700">{step.label}</p>
                        <p className="mt-0.5 text-[11px] text-zinc-400">{step.meta}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
            );
          })}
        </div>
      )}

      <section className="rounded-2xl border border-violet-100 bg-violet-50/60 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
            <Lightbulb className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-zinc-950">{t.helpTitle}</p>
            <p className="mt-1 text-sm text-zinc-600">{t.helpBody}</p>
            <details className="group mt-4">
              <summary className="inline-flex cursor-pointer list-none items-center text-sm font-medium text-violet-700 hover:text-violet-800">
                {t.helpLink}
                <ChevronRight className="ml-1 h-4 w-4 transition group-open:rotate-90" />
              </summary>
              <div className="mt-4 space-y-4 rounded-2xl border border-violet-100 bg-white/80 p-4 text-sm leading-6 text-zinc-600">
                <p>{t.guideIntro}</p>
                <div className="space-y-3">
                  {t.guideSteps.map((step) => (
                    <div key={step.title}>
                      <p className="font-semibold text-zinc-900">{step.title}</p>
                      <p className="mt-1">{step.body}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">{t.guideWhyTitle}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {t.guideWhyItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
