"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveReviewCommentAction } from "@/app/review-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StoredCreativeBrief, StoredCreativePackItem } from "@/lib/campaign-types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import type { StoredProject } from "@/lib/project-types";
import type { ReviewComment } from "@/lib/studioos/review-comment-types";
import { buildProjectBriefFields } from "@/lib/studioos/project-brief-format";
import { tCertificationExperience } from "@/lib/studioos/certification-experience-copy";
import { getConfirmedBriefFields } from "@/lib/studioos/confirmed-brief";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { ClientBriefFormCard } from "@/components/studioos/client-brief-form-card";
import { CertifiedPartnerBadge } from "@/components/studioos/certification/certified-partner-badge";
import { formatTimestamp } from "@/lib/studioos/review-utils";
import { cn } from "@/lib/utils";
import { isReviewCommentUnresolved } from "@/lib/studioos/review-comment-status";
import { CheckCircle2, Clapperboard, Pause, Play } from "lucide-react";

type TabId = "brief" | "storyboard" | "versions" | "issues";

const copy = {
  en: {
    workspace: "Project workspace",
    brief: "Ad requirements",
    storyboard: "Asset files",
    versions: "Work versions",
    issues: "Review history",
    productionBanner:
      "You have been selected. Upload Version 1 from the review center to start brand review.",
    awaitingPaymentBanner:
      "You were selected — waiting for the brand to complete escrow payment. Production starts after payment is confirmed.",
    reviewCenterFirst: "Upload Version 1 in review center",
    reviewCenterRevision: "Upload new version in review center",
    resolve: "Resolve",
    publishRevision: "Publish Revision",
    revisionSummary: "Revision Summary",
    openIssues: "Open Issues",
    goal: "Goal",
    audience: "Audience",
    style: "Style",
    budget: "Budget",
    deadline: "Deadline",
    clientRequirements: "Client requirements",
    scene: (n: number) => `Scene ${n}`,
    current: "Current",
    draft: "Draft",
    waiting: "Waiting",
    rendering: "Rendering",
    completed: "Completed"
  },
  zh: {
    workspace: "项目工作台",
    brief: "广告需求",
    storyboard: "素材文件",
    versions: "作品版本",
    issues: "审核记录",
    productionBanner: "你已被品牌选中，请前往审片中心上传 Version 1。",
    awaitingPaymentBanner:
      "你已被品牌选中，请等待品牌完成托管付款。收到付款通知后再开始制作。",
    reviewCenterFirst: "前往审片中心上传 Version 1",
    reviewCenterRevision: "前往审片中心上传新版本",
    resolve: "标记已解决",
    publishRevision: "发布修改版",
    revisionSummary: "修改摘要",
    openIssues: "待处理 Issue",
    goal: "目标",
    audience: "受众",
    style: "风格",
    budget: "预算",
    deadline: "截止",
    clientRequirements: "客户需求",
    scene: (n: number) => `场景 ${n}`,
    current: "当前",
    draft: "草稿",
    waiting: "等待",
    rendering: "渲染中",
    completed: "已完成"
  }
};

function storyboardScenes(pack: StoredCreativePackItem[]) {
  const board = pack.find((p) => p.type === "storyboard");
  const scenes = (board?.content_json?.scenes as Array<{ title?: string; status?: string }>) ?? [];
  if (scenes.length) return scenes;
  return [
    { title: "Opening hook", status: "done" },
    { title: "Product hero", status: "rendering" },
    { title: "Feature montage", status: "waiting" },
    { title: "CTA end card", status: "done" }
  ];
}

function sceneStatusLabel(status: string | undefined, locale: Locale) {
  const t = copy[locale];
  if (status === "done" || status === "completed") return t.completed;
  if (status === "rendering") return t.rendering;
  return t.waiting;
}

export function StudioCreativeWorkspace({
  locale,
  studioName,
  isVerified = false,
  order,
  project,
  brief: _brief,
  pack,
  deliverables,
  comments: initialComments,
  canUpload
}: {
  locale: Locale;
  studioName: string;
  isVerified?: boolean;
  order: StoredOrder;
  project: StoredProject | null;
  brief: StoredCreativeBrief | null;
  pack: StoredCreativePackItem[];
  deliverables: StoredDeliverable[];
  comments: ReviewComment[];
  canUpload: boolean;
}) {
  const t = copy[locale];
  const partnerBadge = tCertificationExperience(locale).partnerBadge;
  const router = useRouter();
  const briefFields = useMemo(() => {
    const confirmed = project ? getConfirmedBriefFields(project, locale) : [];
    if (confirmed.length) {
      return confirmed.map((field) => ({ label: field.label, value: field.value }));
    }
    return project ? buildProjectBriefFields(project, locale) : [];
  }, [project, locale]);
  const confirmedBriefFields = useMemo(
    () => (project ? getConfirmedBriefFields(project, locale) : []),
    [project, locale]
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const [tab, setTab] = useState<TabId>("brief");
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState(initialComments);
  const sortedVersions = useMemo(
    () => [...deliverables].sort((a, b) => a.version - b.version),
    [deliverables]
  );
  const [activeVersion, setActiveVersion] = useState(
    sortedVersions[sortedVersions.length - 1]?.version ?? 1
  );
  const [currentSec, setCurrentSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const scenes = storyboardScenes(pack);
  const versionComments = comments.filter((c) => c.version === activeVersion);
  const openIssues = versionComments.filter((c) => isReviewCommentUnresolved(c.status));
  const resolvedIssues = versionComments.filter((c) => c.status === "resolved");
  const activeDeliverable = sortedVersions.find((v) => v.version === activeVersion);
  const videoUrl = activeDeliverable?.file_url ?? sortedVersions[0]?.file_url ?? "";

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => undefined);
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  }

  function handleResolve(commentId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", order.id);
      fd.set("comment_id", commentId);
      const result = await resolveReviewCommentAction(fd);
      if (result.ok) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, status: "resolved", resolved_at: result.comment.resolved_at } : c
          )
        );
        router.refresh();
      }
    });
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "brief", label: t.brief },
    { id: "storyboard", label: t.storyboard },
    { id: "versions", label: t.versions },
    { id: "issues", label: t.issues }
  ];

  const reviewHref = withLocale(creatorPortalRoutes.review(order.id), locale);
  const awaitingPayment = order.status === "waiting_payment" || order.payment_status === "unpaid";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{t.workspace}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{studioName}</h1>
          {isVerified ? <CertifiedPartnerBadge label={partnerBadge} /> : null}
        </div>
        <p className="mt-1 text-lg font-medium text-zinc-800">{order.title || project?.title}</p>
      </div>

      {awaitingPayment ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4 text-sm text-amber-950">
          <p>{t.awaitingPaymentBanner}</p>
        </div>
      ) : null}

      {canUpload && sortedVersions.length === 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-5 py-4 text-sm text-emerald-900">
          <p>{t.productionBanner}</p>
          <Link
            href={reviewHref}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            <Clapperboard className="h-4 w-4" />
            {t.reviewCenterFirst}
          </Link>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1 border-b border-zinc-200">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition",
              tab === id
                ? "border-b-2 border-zinc-900 text-zinc-900"
                : "text-zinc-500 hover:text-zinc-800"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "grid gap-6",
          tab === "brief" ? "grid-cols-1" : "xl:grid-cols-[240px_minmax(0,1fr)_300px]"
        )}
      >
        {tab === "brief" && confirmedBriefFields.length ? (
          <ClientBriefFormCard
            locale={locale}
            fields={confirmedBriefFields}
            projectTitle={project?.title || order.title}
            formId={project?.id ? project.id.slice(-10).toUpperCase() : undefined}
          />
        ) : null}

        {tab === "brief" && confirmedBriefFields.length ? null : (
        <aside className="space-y-4">
          {tab === "brief" || tab === "storyboard" ? (
            <div className="space-y-4">
              {tab === "brief" && confirmedBriefFields.length ? null : (
              <div className="rounded-xl border bg-white p-4 text-sm">
                <p className="text-xs uppercase tracking-wide text-zinc-400">{t.brief}</p>
                <dl className="mt-3 space-y-2">
                  {briefFields.length ? (
                    briefFields.map((field) => (
                      <div key={field.label}>
                        <dt className="text-zinc-500">{field.label}</dt>
                        <dd className="font-medium">{field.value}</dd>
                      </div>
                    ))
                  ) : (
                    <>
                      <div>
                        <dt className="text-zinc-500">{locale === "zh" ? "品牌" : "Brand"}</dt>
                        <dd className="font-medium">{order.company_name}</dd>
                      </div>
                      <div>
                        <dt className="text-zinc-500">{t.budget}</dt>
                        <dd className="font-medium">{order.budget_range || "$1200"}</dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
              )}

              {order.requirements && !confirmedBriefFields.length ? (
                <div className="rounded-xl border bg-white p-4 text-sm">
                  <p className="text-xs uppercase tracking-wide text-zinc-400">{t.clientRequirements}</p>
                  <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{order.requirements}</pre>
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "storyboard" ? (
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-400">{t.storyboard}</p>
              <ul className="mt-3 space-y-2">
                {scenes.map((scene, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <span>{t.scene(i + 1)}</span>
                    <Badge variant="secondary">{sceneStatusLabel(scene.status, locale)}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
        )}

        {tab === "brief" ? null : (
        <section className="space-y-4">
          {videoUrl ? (
            <div className="overflow-hidden rounded-2xl bg-zinc-950 ring-1 ring-zinc-900/10">
              <video
                ref={videoRef}
                key={videoUrl}
                src={videoUrl}
                className="aspect-video w-full object-contain"
                onTimeUpdate={() => setCurrentSec(videoRef.current?.currentTime ?? 0)}
                onClick={togglePlay}
              />
              <div className="flex items-center gap-2 border-t border-white/10 px-4 py-2">
                <Button type="button" size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={togglePlay}>
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </Button>
                <span className="font-mono text-xs text-zinc-400">{formatTimestamp(currentSec)}</span>
              </div>
            </div>
          ) : canUpload ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center shadow-sm">
              <p className="text-sm text-blue-900">
                {locale === "zh"
                  ? "审片版统一在审片中心上传，第一版与后续修改版都在同一页面提交。"
                  : "Upload every review version from the review center — starting with Version 1."}
              </p>
              <Link
                href={reviewHref}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Clapperboard className="h-4 w-4" />
                {t.reviewCenterFirst}
              </Link>
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-2xl border bg-zinc-100 px-6 text-center text-sm text-zinc-500">
              {awaitingPayment
                ? locale === "zh"
                  ? "等待品牌完成托管付款后再开始制作"
                  : "Waiting for brand escrow payment before production"
                : locale === "zh"
                  ? "等待品牌选中后开始制作"
                  : "Waiting for brand selection to start production"}
            </div>
          )}

          {(tab === "versions") && sortedVersions.length ? (
            <div className="flex flex-wrap gap-2">
              {sortedVersions.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setActiveVersion(v.version)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium ring-1",
                    v.version === activeVersion
                      ? "bg-zinc-900 text-white ring-zinc-900"
                      : "bg-white text-zinc-600 ring-zinc-200"
                  )}
                >
                  V{v.version}
                  {i === sortedVersions.length - 1 ? ` · ${t.current}` : ""}
                </button>
              ))}
            </div>
          ) : null}

          {canUpload && order.status === "revision" ? (
            <Link
              href={reviewHref}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 hover:bg-amber-100"
            >
              <span>
                {locale === "zh"
                  ? "品牌要求修改 — 前往审片中心上传新版本"
                  : "Revision requested — upload a new version in the review center"}
              </span>
              <span>→</span>
            </Link>
          ) : null}
        </section>
        )}

        {tab === "brief" ? null : (
        <aside className="space-y-4">
          <div className="rounded-xl border bg-white p-4">
            <h2 className="font-semibold">{t.openIssues}</h2>
            <ul className="mt-3 space-y-3">
              {openIssues.length ? (
                openIssues.map((c) => (
                  <li key={c.id} className="rounded-lg border border-amber-100 bg-amber-50/60 p-3 text-sm">
                    <p className="text-xs text-zinc-500">
                      {locale === "zh" ? "时间" : "Timestamp"} {formatTimestamp(c.timestamp_sec)}
                    </p>
                    <p className="mt-1 font-medium">{c.issue_type ?? "Issue"}</p>
                    <p className="mt-1 text-zinc-600">{c.body}</p>
                    <Badge className="mt-2" variant="outline">
                      {locale === "zh" ? "高优先级" : "High"}
                    </Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full rounded-full"
                      disabled={isPending}
                      onClick={() => handleResolve(c.id)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> {t.resolve}
                    </Button>
                  </li>
                ))
              ) : (
                <li className="text-sm text-zinc-400">{locale === "zh" ? "暂无 Issue" : "No open issues"}</li>
              )}
            </ul>
          </div>

          {resolvedIssues.length ? (
            <div className="rounded-xl border bg-white p-4">
              <h2 className="font-semibold">{t.revisionSummary}</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                {resolvedIssues.map((c) => (
                  <li key={c.id}>
                    ✓ {c.issue_type ?? "Update"}{" "}
                    {locale === "zh" ? "已更新" : "updated"}
                  </li>
                ))}
              </ul>
              {canUpload ? (
                <Link href={reviewHref} className="mt-4 inline-flex text-sm font-medium text-blue-700 hover:underline">
                  {t.reviewCenterRevision}
                </Link>
              ) : null}
            </div>
          ) : null}
        </aside>
        )}
      </div>
    </div>
  );
}
