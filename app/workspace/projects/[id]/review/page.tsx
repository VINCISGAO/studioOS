import { notFound, redirect } from "next/navigation";
import { ReviewWorkspace } from "@/components/mvp/review-workspace";
import { getSessionUser } from "@/features/auth/session.service";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import {
  ensureMvpReviewProjectForCampaign,
  findCampaignIdForMvpProject,
  getUnifiedReviewBundleForCampaign
} from "@/lib/mvp/campaign-review-bridge";
import { getReviewBundle } from "@/lib/mvp/store";
import { getMvpProfile } from "@/lib/mvp/session";
import type { MvpRole, ProjectStatus, ReviewBundle, VideoComment } from "@/lib/mvp/types";
import { getDeliverables, getOrderForProject } from "@/lib/order-service";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import type { ReviewAnnotation, ReviewComment } from "@/features/review/review.types";
import { REVIEW_ANNOTATION_COLOR } from "@/features/review/review.constants";

function mapMvpRole(role: MvpRole): "brand" | "creator" {
  return role === "studio" ? "creator" : "brand";
}

function mapProjectStatus(status: ProjectStatus): "review" | "revision" | "completed" | "in_production" {
  if (status === "revision") return "revision";
  if (status === "settled" || status === "approved" || status === "delivered" || status === "pending_settlement") {
    return "completed";
  }
  return "review";
}

function mapCommentAnnotation(comment: VideoComment): ReviewAnnotation[] {
  const type = comment.annotation_type;
  if (type !== "circle" && type !== "rect" && type !== "arrow") return [];
  if (comment.pos_x == null || comment.pos_y == null) return [];

  return [
    {
      id: `${comment.id}_annotation`,
      type,
      time: comment.timestamp_seconds,
      x: comment.pos_x,
      y: comment.pos_y,
      width: comment.width ?? undefined,
      height: comment.height ?? undefined,
      endX: type === "arrow" ? comment.pos_x + (comment.width ?? 0.12) : undefined,
      endY: type === "arrow" ? comment.pos_y + (comment.height ?? 0.08) : undefined,
      color: comment.color ?? REVIEW_ANNOTATION_COLOR
    }
  ];
}

function mapReviewComments(bundle: ReviewBundle): ReviewComment[] {
  const versionNumberById = new Map(bundle.versions.map((version) => [version.id, version.version_number]));

  return bundle.comments.map((comment) => ({
    id: comment.id,
    time: comment.timestamp_seconds,
    content: comment.comment_text,
    createdBy: bundle.profiles[comment.user_id]?.name ?? bundle.profiles[comment.user_id]?.email ?? "Reviewer",
    createdAt: comment.created_at,
    version: versionNumberById.get(comment.video_version_id) ?? 1,
    annotations: mapCommentAnnotation(comment)
  }));
}

export default async function ProjectReviewPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams & { approved?: string; revision?: string; settled?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const profile = await getMvpProfile();
  if (!profile) redirect(withLocale("/login", locale));

  const campaignId = await findCampaignIdForMvpProject(id);
  const order = campaignId ? await getOrderForProject(campaignId) : null;

  if (campaignId && order) {
    if (profile.role === "brand") {
      redirect(withLocale(brandPortalRoutes.projectReview(campaignId), locale));
    }
    if (profile.role === "studio") {
      redirect(withLocale(`/studio/review/${order.id}`, locale));
    }
  }

  const deliverables = order ? await getDeliverables(order.id) : [];

  if (campaignId && deliverables.length) {
    await ensureMvpReviewProjectForCampaign(campaignId, { order, deliverables });
  }

  const sessionUser = await getSessionUser();
  const bundle = campaignId
    ? (
        await getUnifiedReviewBundleForCampaign(campaignId, {
          order,
          deliverables,
          viewerUserId: sessionUser?.id
        })
      ).bundle
    : await getReviewBundle(id);

  if (!bundle) notFound();

  const isParticipant =
    profile.role === "admin" ||
    bundle.project.created_by === profile.id ||
    bundle.project.assigned_studio_id === profile.id;

  if (!isParticipant) redirect(withLocale("/workspace", locale));

  const flash =
    query.approved === "1"
      ? ("approved" as const)
      : query.revision === "1"
        ? ("revision" as const)
        : query.settled === "1"
          ? ("settled" as const)
          : undefined;

  const sortedVersions = [...bundle.versions].sort((a, b) => a.version_number - b.version_number);
  const latestVersion = sortedVersions[sortedVersions.length - 1];
  const reviewVersions = sortedVersions.map((version) => ({
    version: version.version_number,
    label: `Version ${version.version_number}`,
    uploadedAt: version.created_at
  }));
  const reviewComments = mapReviewComments(bundle);

  return (
    <div className="min-h-screen bg-zinc-50">
      {flash === "approved" ? (
        <div className="bg-emerald-50 px-4 py-2 text-center text-sm text-emerald-800">
          {locale === "zh" ? "审片已通过" : "Review approved"}
        </div>
      ) : null}
      {flash === "revision" ? (
        <div className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          {locale === "zh" ? "已请求修改" : "Revision requested"}
        </div>
      ) : null}
      {flash === "settled" ? (
        <div className="bg-emerald-50 px-4 py-2 text-center text-sm text-emerald-800">
          {locale === "zh" ? "结算已完成" : "Settlement completed"}
        </div>
      ) : null}
      <ReviewWorkspace
        locale={locale}
        role={mapMvpRole(profile.role)}
        videoUrl={latestVersion?.file_url ?? ""}
        projectTitle={bundle.project.title}
        orderId={bundle.project.id}
        orderStatus={mapProjectStatus(bundle.project.status)}
        createdAt={bundle.project.created_at}
        versions={reviewVersions}
        initialComments={reviewComments}
        backHref={withLocale("/workspace", locale)}
        variant="full"
      />
    </div>
  );
}
