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
import { getDeliverables, getOrderForProject } from "@/lib/order-service";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";

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
  if (profile.role === "brand" && campaignId) {
    redirect(withLocale(brandPortalRoutes.projectReview(campaignId), locale));
  }

  const order = campaignId ? await getOrderForProject(campaignId) : null;
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

  return (
    <ReviewWorkspace
      locale={locale}
      project={bundle.project}
      versions={bundle.versions}
      comments={bundle.comments}
      profiles={bundle.profiles}
      role={profile.role}
      flash={flash}
    />
  );
}
