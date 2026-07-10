"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveReviewCommentAction } from "@/app/review-actions";
import { ClientBriefFormCard } from "@/components/studioos/client-brief-form-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StoredCreativePackItem } from "@/lib/campaign-types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import type { StoredProject } from "@/lib/project-types";
import { getConfirmedBriefFields } from "@/lib/studioos/confirmed-brief";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import type { ReviewComment } from "@/lib/studioos/review-comment-types";
import { isReviewCommentUnresolved } from "@/lib/studioos/review-comment-status";
import { formatTimestamp } from "@/lib/studioos/review-utils";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clapperboard, FileText, FolderOpen, History, Pause, Play } from "lucide-react";

export type CreatorDetailTab = "brief" | "storyboard" | "versions" | "issues";

const tabs: { id: CreatorDetailTab; label: { en: string; zh: string }; icon: typeof FileText }[] = [
  { id: "brief", label: { en: "Ad requirements", zh: "广告需求" }, icon: FileText },
  { id: "storyboard", label: { en: "Assets", zh: "素材文件" }, icon: FolderOpen },
  { id: "versions", label: { en: "Versions", zh: "作品版本" }, icon: Play },
  { id: "issues", label: { en: "Review log", zh: "审核记录" }, icon: History }
];

const copy = {
  en: {
    scene: (n: number) => `Scene ${n}`,
    completed: "Completed",
    rendering: "Rendering",
    waiting: "Waiting",
    openIssues: "Open issues",
    resolve: "Mark resolved",
    revisionSummary: "Revision summary",
    reviewCenter: "Upload in review center",
    noIssues: "No open issues",
    noVideo: "Upload Version 1 from the review center",
    referenceStyle: "Reference style"
  },
  zh: {
    scene: (n: number) => `场景 ${n}`,
    completed: "已完成",
    rendering: "渲染中",
    waiting: "等待",
    openIssues: "待处理 Issue",
    resolve: "标记已解决",
    revisionSummary: "修改摘要",
    reviewCenter: "前往审片中心上传",
    noIssues: "暂无 Issue",
    noVideo: "请前往审片中心上传 Version 1",
    referenceStyle: "参考风格"
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

export function CreatorProjectDetailTabs({
  locale,
  order,
  project,
  pack,
  deliverables,
  initialComments,
  canUpload,
  activeTab,
  onTabChange,
  briefSlot,
  referenceUrls = []
}: {
  locale: Locale;
  order: StoredOrder;
  project: StoredProject | null;
  pack: StoredCreativePackItem[];
  deliverables: StoredDeliverable[];
  initialComments: ReviewComment[];
  canUpload: boolean;
  activeTab: CreatorDetailTab;
  onTabChange: (tab: CreatorDetailTab) => void;
  briefSlot?: React.ReactNode;
  referenceUrls?: string[];
}) {
  const t = copy[locale];
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [isPending, startTransition] = useTransition();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);

  const confirmedBriefFields = useMemo(
    () => (project ? getConfirmedBriefFields(project, locale) : []),
    [project, locale]
  );
  const sortedVersions = useMemo(() => [...deliverables].sort((a, b) => a.version - b.version), [deliverables]);
  const [activeVersion, setActiveVersion] = useState(sortedVersions[sortedVersions.length - 1]?.version ?? 1);
  const scenes = storyboardScenes(pack);
  const versionComments = comments.filter((c) => c.version === activeVersion);
  const openIssues = versionComments.filter((c) => isReviewCommentUnresolved(c.status));
  const resolvedIssues = versionComments.filter((c) => c.status === "resolved");
  const activeDeliverable = sortedVersions.find((v) => v.version === activeVersion);
  const videoUrl = activeDeliverable?.file_url ?? sortedVersions[0]?.file_url ?? "";
  const reviewHref = withLocale(creatorPortalRoutes.review(order.id), locale);
  const formId = project?.id ? project.id.slice(-10).toUpperCase() : undefined;

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

  return (
    <section id="brief-content" className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <nav className="flex gap-1 overflow-x-auto border-b border-zinc-100 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex shrink-0 items-center gap-2 px-4 py-3.5 text-sm font-medium transition",
                active ? "text-violet-700" : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label[locale]}
              {active ? <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-violet-600" /> : null}
            </button>
          );
        })}
      </nav>

      <div className="space-y-5 p-5 sm:p-6">
        {activeTab === "brief" ? (
          <>
            {briefSlot}
            {confirmedBriefFields.length ? (
              <ClientBriefFormCard
                locale={locale}
                fields={confirmedBriefFields}
                projectTitle={project?.title || order.title}
                formId={formId}
              />
            ) : null}
            {referenceUrls.length || confirmedBriefFields.length ? (
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.referenceStyle}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(referenceUrls.length ? referenceUrls : [1, 2, 3, 4, 5]).slice(0, 5).map((item, i) => (
                    <div
                      key={typeof item === "string" ? item : i}
                      className="h-14 w-20 overflow-hidden rounded-lg border border-zinc-200 bg-gradient-to-br from-violet-100 to-zinc-100"
                    >
                      {typeof item === "string" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                  ))}
                  <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-zinc-200 text-xs text-zinc-400">
                    +5
                  </span>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {activeTab === "storyboard" ? (
          <ul className="space-y-2">
            {scenes.map((scene, i) => (
              <li key={i} className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 text-sm">
                <span>{t.scene(i + 1)} — {scene.title}</span>
                <Badge variant="secondary">{sceneStatusLabel(scene.status, locale)}</Badge>
              </li>
            ))}
          </ul>
        ) : null}

        {activeTab === "versions" ? (
          <div className="space-y-4">
            {videoUrl ? (
              <div className="overflow-hidden rounded-2xl bg-zinc-950">
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
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 px-6 py-10 text-center text-sm text-zinc-500">
                {t.noVideo}
                {canUpload ? (
                  <Link href={reviewHref} className="mt-3 inline-flex items-center gap-2 text-violet-700 hover:underline">
                    <Clapperboard className="h-4 w-4" />
                    {t.reviewCenter}
                  </Link>
                ) : null}
              </div>
            )}
            {sortedVersions.length ? (
              <div className="flex flex-wrap gap-2">
                {sortedVersions.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setActiveVersion(v.version)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium ring-1",
                      v.version === activeVersion ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-zinc-600 ring-zinc-200"
                    )}
                  >
                    V{v.version}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === "issues" ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-zinc-900">{t.openIssues}</h3>
              <ul className="mt-3 space-y-3">
                {openIssues.length ? (
                  openIssues.map((c) => (
                    <li key={c.id} className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-sm">
                      <p className="text-xs text-zinc-500">{formatTimestamp(c.timestamp_sec)}</p>
                      <p className="mt-1 font-medium">{c.issue_type ?? "Issue"}</p>
                      <p className="mt-1 text-zinc-600">{c.body}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-3 rounded-full"
                        disabled={isPending}
                        onClick={() => handleResolve(c.id)}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        {t.resolve}
                      </Button>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-zinc-400">{t.noIssues}</li>
                )}
              </ul>
            </div>
            {resolvedIssues.length ? (
              <div>
                <h3 className="font-semibold text-zinc-900">{t.revisionSummary}</h3>
                <ul className="mt-2 space-y-1 text-sm text-zinc-600">
                  {resolvedIssues.map((c) => (
                    <li key={c.id}>✓ {c.issue_type ?? "Update"}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
