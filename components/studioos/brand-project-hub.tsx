import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  Clapperboard,
  Clock,
  FileText,
  Layers,
  Play,
  Sparkles,
  Users
} from "lucide-react";
import { BrandReviewWorkflowPanel } from "@/components/studioos/brand-review-workflow-panel";
import { BrandAcceptedCreatorsPanel } from "@/components/studioos/brand-accepted-creators-panel";
import { BrandInvitationRosterPanel } from "@/components/studioos/brand-invitation-roster-panel";
import { BrandInvitationStatusPanel } from "@/components/studioos/brand-invitation-status-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { creators } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import type { StoredProject } from "@/lib/project-types";
import {
  brandCommercialPhaseLabel,
  brandUserPhaseLabels,
  mapBrandStepToPhase,
  userCommercialPhaseIndex,
  userCommercialPhases,
  type BrandCommercialStep
} from "@/lib/studioos/commercial-lifecycle";
import type { ReviewComment } from "@/lib/studioos/review-store";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import type { CampaignProjectStatus } from "@/lib/studioos/project-status";
import { cn, formatDate } from "@/lib/utils";

type HubTab = "brief" | "match" | "proposal" | "production" | "review";

const tabs: { id: HubTab; label: { en: string; zh: string } }[] = [
  { id: "brief", label: { en: "Ad requirements", zh: "广告需求" } },
  { id: "match", label: { en: "Creators", zh: "创作者" } },
  { id: "production", label: { en: "Progress", zh: "项目进度" } },
  { id: "review", label: { en: "Review", zh: "审片" } },
  { id: "proposal", label: { en: "Payments", zh: "付款记录" } }
];

const copy = {
  en: {
    back: "Back to my ads",
    budget: "Budget",
    deadline: "Deadline",
    category: "Category",
    studio: "Studio",
    orderAmount: "Order amount",
    paid: "Paid · held in escrow",
    unpaid: "Awaiting payment",
    productionTitle: "Your studio is making the ads",
    productionBody:
      "Payment is held in escrow. The studio is working from your brief — we'll notify you when the first cut is ready to review.",
    productionWaiting: "Waiting for first draft",
    productionReady: "First draft uploaded",
    openReview: "Open review room",
    viewStudios: "View studio options",
    goCheckout: "View payment details",
    continueWizard: "Continue setup",
    briefTitle: "Project brief",
    briefEmpty: "No brief details yet.",
    matchTitle: "Production studio",
    matchSelected: "Selected for this project",
    matchPending: "Matching in progress",
    matchBody:
      "AI sent invitations to multiple creators at once. Acceptances join the shortlist — pick one candidate to officially start the project.",
    proposalTitle: "Payment & escrow",
    proposalBody: "Funds stay in escrow until you approve the final delivery.",
    reviewTitle: "Video review",
    reviewEmpty: "Videos appear here once the studio uploads the first version.",
    reviewReady: "Ready for your review",
    timeline: "Progress",
    stepPaid: "Payment received",
    stepProduction: "In production",
    stepDeliver: "First draft delivered",
    stepReview: "Your review",
    stepDone: "Approved & paid out",
    deliverable: (n: number) => `${n} version${n === 1 ? "" : "s"} uploaded`,
    openIssues: (n: number) => `${n} open note${n === 1 ? "" : "s"}`,
    platform: "Platforms",
    format: "Format",
    quantity: "Deliverables",
    goal: "Goal",
    product: "Product",
    projectBadge: "Ad project"
  },
  zh: {
    back: "返回我的广告",
    budget: "预算",
    deadline: "交付日期",
    category: "品类",
    studio: "制作团队",
    orderAmount: "订单金额",
    paid: "已付款 · 资金托管中",
    unpaid: "待付款",
    productionTitle: "制作团队正在做您的广告",
    productionBody:
      "款项已托管。制作团队正在按需求说明制作视频，初稿完成后会通知您来审片。",
    productionWaiting: "等待初稿上传",
    productionReady: "初稿已上传",
    openReview: "进入审片室",
    viewStudios: "查看推荐团队",
    goCheckout: "查看付款详情",
    continueWizard: "继续填写需求",
    briefTitle: "需求说明",
    briefEmpty: "暂无需求内容。",
    matchTitle: "合作制作团队",
    matchSelected: "本项目的合作方",
    matchPending: "招募进行中",
    matchBody:
      "AI 已同时向多位 Creator 发出邀请。接受者进入候选名单 — 请从候选 Creator 中最终选定 1 位，项目才正式开始。",
    proposalTitle: "付款与托管",
    proposalBody: "款项托管在平台，您对成片满意并确认后，才会打给制作团队。",
    reviewTitle: "视频审片",
    reviewEmpty: "制作团队上传第一个版本后，可在此审片。",
    reviewReady: "可以开始审片",
    timeline: "制作进度",
    stepPaid: "付款完成",
    stepProduction: "制作中",
    stepDeliver: "初稿交付",
    stepReview: "您来审片",
    stepDone: "确认并放款",
    deliverable: (n: number) => `已上传 ${n} 个版本`,
    openIssues: (n: number) => `${n} 条待处理批注`,
    platform: "投放平台",
    format: "视频规格",
    quantity: "交付数量",
    goal: "广告目标",
    product: "产品",
    projectBadge: "广告项目"
  }
};

function tabHref(projectId: string, tab: HubTab, locale: Locale) {
  if (tab === "review") {
    return withLocale(`/brand/projects/${projectId}/review`, locale);
  }
  return withLocale(`/brand/projects/${projectId}?tab=${tab}`, locale);
}

function isTabAvailable(
  status: CampaignProjectStatus,
  tab: HubTab,
  deliverableCount = 0,
  orderStatus?: string | null
): boolean {
  if (status === "draft") return tab === "brief";
  if (tab === "review") {
    if (deliverableCount > 0) return true;
    if (orderStatus === "review" || orderStatus === "revision") return true;
  }
  const order: HubTab[] = ["brief", "match", "proposal", "production", "review"];
  const statusTab: Record<CampaignProjectStatus, HubTab> = {
    draft: "brief",
    matching: "match",
    studio_selected: "match",
    proposal: "proposal",
    contract_pending: "proposal",
    payment_pending: "proposal",
    production: "production",
    in_review: "review",
    delivered: "review",
    completed: "review",
    cancelled: "brief",
    disputed: "production"
  };
  const current = statusTab[status] ?? "brief";
  return order.indexOf(tab) <= order.indexOf(current);
}

function primaryAction(
  project: StoredProject,
  locale: Locale,
  deliverableCount: number
): { href: string; label: string } | null {
  const id = project.id;
  if (project.status === "draft") {
    return {
      href: withLocale(`/brand/projects/new?project=${id}`, locale),
      label: copy[locale].continueWizard
    };
  }
  if (project.status === "matching") {
    return {
      href: withLocale(`/brand/projects/${id}?tab=match`, locale),
      label: copy[locale].matchPending
    };
  }
  if (["payment_pending", "contract_pending", "studio_selected", "proposal"].includes(project.status)) {
    return {
      href: withLocale(`/brand/projects/${id}/checkout`, locale),
      label: copy[locale].goCheckout
    };
  }
  if (project.status === "production" && deliverableCount > 0) {
    return {
      href: withLocale(`/brand/projects/${id}/review`, locale),
      label: copy[locale].openReview
    };
  }
  if (["in_review", "delivered", "completed"].includes(project.status)) {
    return {
      href: withLocale(`/brand/projects/${id}/review`, locale),
      label: copy[locale].openReview
    };
  }
  return null;
}

function TimelineStep({
  done,
  active,
  label
}: {
  done: boolean;
  active: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition",
          done ? "bg-zinc-900 text-white" : active ? "bg-zinc-900 text-white ring-4 ring-zinc-200" : "border border-zinc-200 bg-white text-zinc-400"
        )}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : null}
      </span>
      <span className={cn("text-center text-[11px] font-medium leading-tight", done || active ? "text-zinc-800" : "text-zinc-400")}>
        {label}
      </span>
    </div>
  );
}

function MetaChip({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function BriefField({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div className="border-b border-zinc-100 py-4 last:border-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-zinc-800">{value}</dd>
    </div>
  );
}

export function BrandProjectHub({
  locale,
  project,
  activeTab,
  linkedOrder,
  deliverables,
  reviewComments,
  acceptedInvitations = [],
  projectInvitations = [],
  brandCommercialStep
}: {
  locale: Locale;
  project: StoredProject;
  activeTab: HubTab;
  linkedOrder: StoredOrder | null;
  deliverables: StoredDeliverable[];
  reviewComments: ReviewComment[];
  acceptedInvitations?: StoredCreatorInvitation[];
  projectInvitations?: StoredCreatorInvitation[];
  brandCommercialStep: BrandCommercialStep;
}) {
  const t = copy[locale];
  const status = project.status;
  const studio = project.selected_studio_id
    ? creators.find((item) => item.id === project.selected_studio_id)
    : linkedOrder
      ? creators.find((item) => item.id === linkedOrder.creator_id)
      : null;
  const openComments = reviewComments.filter((item) => item.status === "open").length;
  const action = primaryAction(project, locale, deliverables.length);
  const latestDeliverable = deliverables[deliverables.length - 1];
  const deliverDone = deliverables.length > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={withLocale(`${brandPortalRoutes.dashboard}#my-ads`, locale)}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.back}
      </Link>

      <section className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 bg-gradient-to-br from-zinc-50 to-white p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-normal">
                  {t.projectBadge}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-normal",
                    status === "production" && "border-violet-200 bg-violet-50 text-violet-800",
                    status === "in_review" && "border-emerald-200 bg-emerald-50 text-emerald-800"
                  )}
                >
                  {brandCommercialPhaseLabel(brandCommercialStep, locale)}
                </Badge>
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                {project.title}
              </h1>
              {project.campaign_goal ? (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">{project.campaign_goal}</p>
              ) : null}
            </div>
            {action ? (
              <Button asChild size="lg" className="h-11 shrink-0 rounded-xl px-6">
                <Link href={action.href}>
                  {action.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {project.budget_range ? <MetaChip icon={CircleDollarSign} label={t.budget} value={project.budget_range} /> : null}
            {project.deadline ? <MetaChip icon={Calendar} label={t.deadline} value={project.deadline} /> : null}
            {project.category ? <MetaChip icon={Layers} label={t.category} value={project.category} /> : null}
            {studio ? <MetaChip icon={Users} label={t.studio} value={studio.name} /> : null}
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-b border-zinc-100 px-4 sm:px-6" aria-label="Campaign steps">
          {tabs.map((tab) => {
            const available = isTabAvailable(status, tab.id, deliverables.length, linkedOrder?.status);
            const active = activeTab === tab.id;
            return available ? (
              <Link
                key={tab.id}
                href={tabHref(project.id, tab.id, locale)}
                className={cn(
                  "relative shrink-0 px-4 py-3.5 text-sm font-medium transition",
                  active ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
                )}
              >
                {tab.label[locale]}
                {active ? <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-zinc-900" /> : null}
              </Link>
            ) : (
              <span
                key={tab.id}
                className="shrink-0 cursor-not-allowed px-4 py-3.5 text-sm font-medium text-zinc-300"
                aria-disabled
              >
                {tab.label[locale]}
              </span>
            );
          })}
        </nav>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <section className="min-w-0 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
          {activeTab === "brief" ? (
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
                <FileText className="h-5 w-5 text-zinc-400" />
                {t.briefTitle}
              </h2>
              {project.product_name || project.campaign_goal || project.notes ? (
                <dl className="mt-4">
                  <BriefField label={t.product} value={project.product_name} />
                  <BriefField label={t.goal} value={project.campaign_goal} />
                  <BriefField label={t.platform} value={project.target_platform} />
                  <BriefField label={t.format} value={project.video_format || project.aspect_ratios?.join(", ")} />
                  <BriefField
                    label={t.quantity}
                    value={project.output_quantity ? `${project.output_quantity}` : undefined}
                  />
                  <BriefField label={t.budget} value={project.budget_range} />
                  <BriefField label={t.deadline} value={project.deadline} />
                  {project.notes ? <BriefField label="Notes" value={project.notes} /> : null}
                </dl>
              ) : (
                <p className="mt-4 text-sm text-zinc-500">{t.briefEmpty}</p>
              )}
              {status === "draft" ? (
                <Button asChild className="mt-6 rounded-xl">
                  <Link href={withLocale(`/brand/projects/new?project=${project.id}`, locale)}>
                    {t.continueWizard}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : null}

          {activeTab === "match" ? (
            <div className="space-y-6">
              <BrandInvitationStatusPanel locale={locale} invitations={projectInvitations} />
              <BrandInvitationRosterPanel locale={locale} invitations={projectInvitations} />
              <BrandAcceptedCreatorsPanel
                locale={locale}
                projectId={project.id}
                accepted={acceptedInvitations}
              />
              {studio ? (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">{t.matchSelected}</h3>
                  <div className="mt-4 flex items-start gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-semibold text-white">
                      {studio.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="mt-0.5 text-base font-semibold text-zinc-900">{studio.name}</p>
                      <p className="mt-1 text-sm text-zinc-600">{studio.headline}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === "proposal" ? (
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
                <CircleDollarSign className="h-5 w-5 text-zinc-400" />
                {t.proposalTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{t.proposalBody}</p>
              {linkedOrder ? (
                <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-5">
                  <p className="text-xs font-medium text-zinc-500">{t.orderAmount}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
                    ${linkedOrder.amount.toLocaleString()}
                  </p>
                  <Badge variant="outline" className="mt-3 font-normal">
                    {linkedOrder.payment_status === "unpaid" ? t.unpaid : t.paid}
                  </Badge>
                </div>
              ) : null}
              <Button asChild className="mt-6 rounded-xl">
                <Link href={withLocale(`/brand/projects/${project.id}/checkout`, locale)}>
                  {t.goCheckout}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : null}

          {activeTab === "production" ? (
            <div className="space-y-8">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
                  <Clapperboard className="h-5 w-5 text-zinc-400" />
                  {t.productionTitle}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600">{t.productionBody}</p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.timeline}</p>
                <div className="mt-5 flex items-start justify-between gap-2">
                  {userCommercialPhases.map((phase, index) => {
                    const currentPhase = mapBrandStepToPhase(brandCommercialStep);
                    const currentIndex = userCommercialPhaseIndex(currentPhase);
                    const done = index < currentIndex;
                    const active = index === currentIndex;
                    return (
                      <div key={phase} className="flex flex-1 items-start gap-2">
                        {index > 0 ? <div className="mt-4 hidden h-px flex-1 bg-zinc-200 sm:block" /> : null}
                        <TimelineStep
                          done={done}
                          active={active}
                          label={brandUserPhaseLabels[locale][phase]}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {studio ? (
                <div className="flex items-start gap-4 rounded-2xl border border-violet-200/60 bg-violet-50/40 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-zinc-900">{studio.name}</p>
                    <p className="mt-1 text-sm text-zinc-600">{studio.headline}</p>
                    <p className="mt-2 text-xs text-violet-700">
                      {deliverDone ? t.productionReady : t.productionWaiting}
                    </p>
                  </div>
                </div>
              ) : null}

              {deliverables.length ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                  <p className="font-medium text-emerald-900">{t.deliverable(deliverables.length)}</p>
                  {openComments ? (
                    <p className="mt-1 text-sm text-emerald-800">{t.openIssues(openComments)}</p>
                  ) : null}
                  <Button asChild className="mt-4 rounded-xl">
                    <Link href={withLocale(`/brand/projects/${project.id}/review`, locale)}>
                      <Play className="h-4 w-4" />
                      {t.openReview}
                    </Link>
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === "review" ? (
            <div className="space-y-6">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
                  <Play className="h-5 w-5 text-zinc-400" />
                  {t.reviewTitle}
                </h2>
                {deliverables.length ? (
                  <>
                    <p className="mt-2 text-sm text-zinc-600">{t.reviewReady}</p>
                    <Button asChild size="lg" className="mt-4 rounded-xl">
                      <Link href={withLocale(`/brand/projects/${project.id}/review`, locale)}>
                        {t.openReview}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-zinc-500">{t.reviewEmpty}</p>
                )}
              </div>
              {linkedOrder ? (
                <BrandReviewWorkflowPanel
                  locale={locale}
                  projectId={project.id}
                  order={linkedOrder}
                  deliverables={deliverables}
                  comments={reviewComments}
                />
              ) : null}
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          {latestDeliverable ? (
            <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
              <div className="aspect-video bg-zinc-900">
                <video
                  src={latestDeliverable.file_url}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-medium text-zinc-500">Latest · V{latestDeliverable.version}</p>
                <Button asChild size="sm" className="mt-3 w-full rounded-lg">
                  <Link href={withLocale(`/brand/projects/${project.id}/review`, locale)}>
                    {t.openReview}
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}

          {studio ? (
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.studio}</p>
              <p className="mt-2 font-semibold text-zinc-900">{studio.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{studio.specialties.join(" · ")}</p>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
