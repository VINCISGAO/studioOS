"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DeliveryUploadPanel } from "@/components/studioos/delivery-upload-panel";
import { DeliverableVideoPolicyNotice } from "@/components/studioos/deliverable-video-policy-notice";
import { DeliverableNotesBlock } from "@/components/studioos/deliverable-notes-block";
import { IntegrationStatus } from "@/components/studioos/integration-status";
import { QualityCenterPanel } from "@/components/studioos/quality-center-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import type { QualityReport } from "@/lib/studioos/quality-types";
import type { ReviewComment } from "@/lib/studioos/review-store";
import { deliverableNotesForViewer } from "@/lib/studioos/deliverable-notes";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowRight,
  ChevronRight,
  Clapperboard,
  Clock3,
  MessageSquare,
  ShieldCheck,
  UploadCloud
} from "lucide-react";

export type DeliveryOrderRow = {
  order: StoredOrder;
  deliverables: StoredDeliverable[];
  comments: ReviewComment[];
  openComments: number;
  totalComments: number;
  qualityReport: QualityReport;
  projectDeadline: string | null;
};

const UPLOADABLE_STATUSES = new Set(["in_production", "revision", "review"]);

const copy = {
  en: {
    workspace: "Delivery Workspace",
    subtitle: "Version control, brand review, and final delivery — built for professional post-production.",
    campaign: "Campaign",
    selectCampaign: "Select campaign",
    noProjects: "No assigned campaigns yet",
    noProjectsBody: "When a brand assigns you a project, review and delivery tools appear here.",
    exploreBriefs: "Browse open briefs",
    viewDashboard: "Studio dashboard",
    brand: "Brand",
    budget: "Budget",
    escrow: "Escrow",
    currentVersion: "Current version",
    reviewStatus: "Review status",
    openFeedback: "Brand feedback",
    aiQuality: "AI quality",
    deadline: "Deadline",
    noVersion: "Not uploaded",
    waitingReview: "Waiting review",
    inRevision: "Revision requested",
    approved: "Approved",
    complete: "Complete",
    waitingPayment: "Waiting for escrow",
    openComments: (n: number) => `${n} open`,
    qualityScore: (n: number) => `${n}% passed`,
    qualityPending: "Pending upload",
    daysLeft: (n: number) => `${n}d remaining`,
    noDeadline: "No deadline",
    uploadReview: "Upload review version",
    uploadHint: "MP4, MOV, or ProRes. AI generates a watermarked 720p review copy for the brand.",
    cannotUpload: "Upload unlocks once production starts.",
    waitingPaymentHint: "Waiting for brand escrow payment.",
    versionHistory: "Version history",
    noVersions: "No versions yet.",
    versionLabel: (v: number) => `Version ${v}`,
    current: "Current",
    submitted: "Submitted",
    openReview: "Open review room",
    sendNewVersion: "Send new version",
    reviewReady: "Review ready",
    projectInfo: "Project info",
    projectName: "Project",
    deliveryLead: "Delivery lead",
    created: "Created",
    protectedNote: "Brands only see watermarked review copies until approval."
  },
  zh: {
    workspace: "交付工作台",
    subtitle: "围绕版本、审批、协作与交付 — 专业后期工作流，不是网盘上传。",
    campaign: "Campaign",
    selectCampaign: "选择 Campaign",
    noProjects: "暂无分配项目",
    noProjectsBody: "品牌分配 Campaign 后，审片与交付工具会出现在这里。",
    exploreBriefs: "查看待处理 Brief",
    viewDashboard: "返回制作台",
    brand: "品牌方",
    budget: "项目预算",
    escrow: "托管资金",
    currentVersion: "当前版本",
    reviewStatus: "审批状态",
    openFeedback: "品牌反馈",
    aiQuality: "AI 质检",
    deadline: "交付倒计时",
    noVersion: "尚未上传",
    waitingReview: "审片中",
    inRevision: "修改中",
    approved: "已通过",
    complete: "已完成",
    waitingPayment: "等待托管",
    openComments: (n: number) => `${n} 条待处理`,
    qualityScore: (n: number) => `${n}% 通过`,
    qualityPending: "待上传",
    daysLeft: (n: number) => `剩余 ${n} 天`,
    noDeadline: "未设置",
    uploadReview: "上传审片版",
    uploadHint: "支持 MP4 / MOV / ProRes。系统会自动生成带水印的 720p 审片版供品牌审阅。",
    cannotUpload: "项目进入制作阶段后可上传。",
    waitingPaymentHint: "等待品牌托管付款。",
    versionHistory: "版本管理",
    noVersions: "还没有版本记录。",
    versionLabel: (v: number) => `Version ${v}`,
    current: "当前",
    submitted: "已提交",
    openReview: "进入审片室",
    sendNewVersion: "发送新版本",
    reviewReady: "审片就绪",
    projectInfo: "项目信息",
    projectName: "项目名称",
    deliveryLead: "交付负责人",
    created: "创建时间",
    protectedNote: "品牌只能观看带水印的审片版，批准后才可下载母版。"
  }
};

function reviewStatusLabel(
  locale: Locale,
  status: StoredOrder["status"],
  hasVersions: boolean,
  openComments: number
) {
  const t = copy[locale];
  if (status === "completed") return t.complete;
  if (status === "review" && openComments === 0) return t.approved;
  if (status === "review") return t.waitingReview;
  if (status === "revision") return t.inRevision;
  if (hasVersions) return t.reviewReady;
  if (status === "waiting_payment") return t.waitingPayment;
  return t.noVersion;
}

function sessionIdFromOrder(orderId: string) {
  return orderId.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase() || "A2F83K";
}

function daysUntil(deadline: string | null) {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  return Number.isFinite(days) ? days : null;
}

function pickInitialOrderId(rows: DeliveryOrderRow[], initialOrderId?: string) {
  if (initialOrderId && rows.some((row) => row.order.id === initialOrderId)) {
    return initialOrderId;
  }
  return (
    rows.find((row) => UPLOADABLE_STATUSES.has(row.order.status) && row.deliverables.length === 0)?.order
      .id ??
    rows.find((row) => UPLOADABLE_STATUSES.has(row.order.status))?.order.id ??
    rows[0]?.order.id ??
    ""
  );
}

export function StudioDeliveryHub({
  locale,
  rows,
  initialOrderId
}: {
  locale: Locale;
  rows: DeliveryOrderRow[];
  initialOrderId?: string;
}) {
  const t = copy[locale];
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(() => pickInitialOrderId(rows, initialOrderId));

  useEffect(() => {
    setSelectedId(pickInitialOrderId(rows, initialOrderId));
  }, [rows, initialOrderId]);

  const selected = rows.find((row) => row.order.id === selectedId) ?? rows[0];
  const sortedDeliverables = useMemo(
    () => [...(selected?.deliverables ?? [])].sort((a, b) => b.version - a.version),
    [selected?.deliverables]
  );
  const canUpload = selected ? UPLOADABLE_STATUSES.has(selected.order.status) : false;
  const hasVersions = sortedDeliverables.length > 0;
  const latestVersion = sortedDeliverables[0]?.version ?? 0;
  const nextVersion = hasVersions ? latestVersion + 1 : 1;
  const qualityPassed = selected
    ? Math.round(
        (selected.qualityReport.checks.filter((item) => item.status === "pass").length /
          Math.max(selected.qualityReport.checks.length, 1)) *
          100
      )
    : 0;
  const daysLeft = daysUntil(selected?.projectDeadline ?? null);

  function handleCampaignChange(orderId: string) {
    setSelectedId(orderId);
    const url = withLocale(`/studio/delivery?order=${orderId}`, locale);
    router.replace(url, { scroll: false });
  }

  if (!rows.length) {
    return (
      <div className="space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600">{t.workspace}</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{t.workspace}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-500">{t.subtitle}</p>
        </header>
        <section className="rounded-3xl border border-zinc-200/80 bg-zinc-50 px-6 py-16 text-center sm:px-12">
          <Clapperboard className="mx-auto h-12 w-12 text-zinc-400" />
          <h2 className="mt-6 text-xl font-semibold">{t.noProjects}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-zinc-500">{t.noProjectsBody}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="rounded-full">
              <Link href={withLocale("/studio", locale)}>{t.viewDashboard}</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href={withLocale("/creators", locale)}>{t.exploreBriefs}</Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <header className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-500">
            <span className="font-medium text-violet-700">{t.workspace}</span>
            {selected ? (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-zinc-900">{selected.order.title}</span>
              </>
            ) : null}
          </nav>
          {rows.length > 1 ? (
            <Select value={selected?.order.id ?? ""} onValueChange={handleCampaignChange}>
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue placeholder={t.selectCampaign} />
              </SelectTrigger>
              <SelectContent>
                {rows.map((row) => (
                  <SelectItem key={row.order.id} value={row.order.id}>
                    {row.order.title || row.order.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        {selected ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                  {selected.order.title}
                </h1>
                <StatusBadge status={selected.order.status} locale={locale} />
              </div>
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
                <span>
                  {t.brand}: {selected.order.company_name || selected.order.client_name}
                </span>
                <span>
                  {t.budget}: {formatCurrency(selected.order.amount)}
                </span>
                <span>
                  {t.escrow}: {formatCurrency(selected.order.amount)}
                </span>
              </p>
            </div>
            <IntegrationStatus locale={locale} show={["ffprobe"]} />
          </div>
        ) : null}
      </header>

      {selected ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              {
                label: t.currentVersion,
                value: hasVersions ? t.versionLabel(latestVersion) : t.noVersion,
                icon: UploadCloud
              },
              {
                label: t.reviewStatus,
                value: reviewStatusLabel(locale, selected.order.status, hasVersions, selected.openComments),
                icon: ShieldCheck
              },
              {
                label: t.openFeedback,
                value: selected.openComments ? t.openComments(selected.openComments) : "—",
                icon: MessageSquare
              },
              {
                label: t.aiQuality,
                value: hasVersions ? t.qualityScore(qualityPassed) : t.qualityPending,
                icon: ShieldCheck
              },
              {
                label: t.deadline,
                value:
                  daysLeft != null
                    ? daysLeft >= 0
                      ? t.daysLeft(daysLeft)
                      : locale === "zh"
                        ? "已逾期"
                        : "Overdue"
                    : t.noDeadline,
                icon: Clock3
              }
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-zinc-200/80 bg-white px-4 py-4 shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
                <p className="mt-2 text-lg font-semibold text-zinc-950">{item.value}</p>
              </div>
            ))}
          </section>

          {hasVersions ? (
            <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0d0d0d]">
              <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    {locale === "zh" ? "审片中心" : "Review center"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-300">
                    {locale === "zh"
                      ? "Frame.io 风格全屏审片 — 时间码评论、版本管理、批准流程"
                      : "Full-screen Frame.io-style review — timecoded comments, versions, approval"}
                  </p>
                </div>
                <Button asChild size="lg" className="rounded-lg bg-white text-black hover:bg-zinc-200">
                  <Link href={withLocale(`/creator/orders/${selected.order.id}/review-upload`, locale)}>
                    {t.openReview}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              {sortedDeliverables[0]?.file_url ? (
                <div className="relative aspect-video bg-black">
                  <video
                    src={sortedDeliverables[0].file_url}
                    className="h-full w-full object-contain opacity-80"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button asChild size="lg" className="rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20">
                      <Link href={withLocale(`/creator/orders/${selected.order.id}/review-upload`, locale)}>
                        <Clapperboard className="h-5 w-5" />
                        {t.openReview}
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : (
            <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-8">
              <div className="mx-auto max-w-2xl">
                <h2 className="text-lg font-semibold text-zinc-950">{t.uploadReview}</h2>
                <p className="mt-1 text-sm text-zinc-500">{t.uploadHint}</p>
                {canUpload ? (
                  <div className="mt-6">
                    <DeliveryUploadPanel
                      locale={locale}
                      orderId={selected.order.id}
                      nextVersion={nextVersion}
                      mode="first"
                      onSuccess={() => router.refresh()}
                    />
                  </div>
                ) : (
                  <p className="mt-6 rounded-xl bg-amber-50 px-4 py-4 text-sm text-amber-900">
                    {selected.order.status === "waiting_payment" ? t.waitingPaymentHint : t.cannotUpload}
                  </p>
                )}
              </div>
            </section>
          )}

          <div className="grid gap-6 xl:grid-cols-3">
            <section className="rounded-2xl border border-zinc-200/80 bg-white p-5">
              <h3 className="text-sm font-semibold text-zinc-900">{t.versionHistory}</h3>
              {hasVersions ? (
                <ul className="mt-4 space-y-2">
                  {sortedDeliverables.map((item, index) => (
                    <li
                      key={item.id}
                      className="rounded-xl border border-zinc-100 bg-zinc-50/60 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{t.versionLabel(item.version)}</p>
                        {index === 0 ? (
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-violet-700">
                            {t.current}
                          </span>
                        ) : null}
                      </div>
                      {(() => {
                        const notesView = deliverableNotesForViewer(item, "studio", locale);
                        return notesView ? (
                          <DeliverableNotesBlock locale={locale} view={notesView} className="mt-2" />
                        ) : null;
                      })()}
                      <p className="mt-1 text-xs text-zinc-400">
                        {t.submitted} · {formatDate(item.created_at)}
                      </p>
                      <Button asChild size="sm" variant="ghost" className="mt-2 h-8 px-0 text-violet-700">
                        <Link href={withLocale(`/creator/orders/${selected.order.id}/review-upload`, locale)}>
                          {t.openReview} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-zinc-500">{t.noVersions}</p>
              )}
            </section>

            <section id="upload-review-version" className="rounded-2xl border border-zinc-200/80 bg-white p-5">
              <h3 className="text-sm font-semibold text-zinc-900">{t.uploadReview}</h3>
              <DeliverableVideoPolicyNotice locale={locale} showUploadLimit className="mt-3" />
              {canUpload ? (
                <div className="mt-4">
                  <DeliveryUploadPanel
                    locale={locale}
                    orderId={selected.order.id}
                    nextVersion={nextVersion}
                    mode={hasVersions ? "revision" : "first"}
                    onSuccess={() => router.refresh()}
                  />
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
                  {selected.order.status === "waiting_payment" ? t.waitingPaymentHint : t.cannotUpload}
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-zinc-200/80 bg-white p-5">
              <h3 className="text-sm font-semibold text-zinc-900">{t.aiQuality}</h3>
              {hasVersions ? (
                <div className="mt-4">
                  <QualityCenterPanel locale={locale} report={selected.qualityReport} />
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-500">{copy[locale].qualityPending}</p>
              )}
            </section>
          </div>

          <section className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-5">
            <h3 className="text-sm font-semibold text-zinc-900">{t.projectInfo}</h3>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: t.projectName, value: selected.order.title },
                { label: t.brand, value: selected.order.company_name || selected.order.client_name },
                { label: t.deliveryLead, value: locale === "zh" ? "Studio 负责人" : "Studio lead" },
                { label: t.created, value: formatDate(selected.order.created_at) },
                {
                  label: t.deadline,
                  value: selected.projectDeadline ? formatDate(selected.projectDeadline) : t.noDeadline
                }
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{item.label}</dt>
                  <dd className="mt-1 text-sm font-medium text-zinc-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      ) : null}
    </div>
  );
}
