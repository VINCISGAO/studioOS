import { redirect } from "next/navigation";
import { ReviewerTimestampWorkspace } from "@/components/studioos/reviewer-skeleton/reviewer-timestamp-workspace";
import { getCreatorById } from "@/lib/creator-service";
import { getCurrentCreatorId } from "@/features/auth/session-context";
import { getAppUiLocale } from "@/lib/app-language";
import { type SearchParams, withLocale } from "@/lib/i18n";
import {
  getDeliverables,
  getOrder,
  listDeliverablesForUpload,
  repairSelectedCreatorCampaignOrders
} from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { creatorRevertUploadService } from "@/features/delivery/creator-revert-upload.service";
import { resolveReviewPortalUiState } from "@/features/review/review-portal-ui-state";
import {
  latestSubmittedDeliverableVersion,
  normalizeReviewDeliverableCatalog,
  resolveActiveReviewPlaybackVersion,
  resolveCreatorReplaceUploadSlot
} from "@/lib/studioos/review-upload-version";
import { listReviewComments } from "@/lib/studioos/review-store";
import { hasBrandNotification } from "@/lib/studioos/brand-notification-service";

function hasConfirmedCreativeDirection(project: Awaited<ReturnType<typeof getProject>>): boolean {
  if (!project) return false;
  const settings = project.settings_json ?? {};
  const finalCreativeDirection = settings.final_creative_direction;
  const confirmedCreativeDirection = settings.confirmed_creative_direction;
  const frozenProductionBrief = settings.frozen_production_brief;
  return Boolean(finalCreativeDirection || confirmedCreativeDirection || frozenProductionBrief);
}

export default async function StudioReviewOrderPage({
  params,
  searchParams
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ orderId }, query] = await Promise.all([params, searchParams]);
  const locale = await getAppUiLocale();
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    redirect(withLocale("/login?role=creator", locale));
  }

  await repairSelectedCreatorCampaignOrders(creatorId);
  const [creator, order] = await Promise.all([getCreatorById(creatorId), getOrder(orderId)]);
  if (!order || order.creator_id !== creatorId) {
    redirect(withLocale(creatorPortalRoutes.reviewHub, locale));
  }

  const project = order.project_id ? await getProject(order.project_id) : null;
  const catalogDeliverables = await normalizeReviewDeliverableCatalog(
    order.id,
    await listDeliverablesForUpload(order.id)
  );
  const replaceUploadVersion = await resolveCreatorReplaceUploadSlot(order.id, catalogDeliverables);
  const [deliverables, comments] = await Promise.all([
    getDeliverables(order.id),
    listReviewComments(order.id)
  ]);
  const workspaceDeliverables = catalogDeliverables.length > 0 ? catalogDeliverables : deliverables;
  const submittedVersion = latestSubmittedDeliverableVersion(workspaceDeliverables);

  const portalUi = order.project_id
    ? await resolveReviewPortalUiState({
        legacyProjectId: order.project_id,
        order,
        deliverableCount: submittedVersion > 0 ? submittedVersion : workspaceDeliverables.length
      })
    : null;

  const effectiveOrder = portalUi ? { ...order, status: portalUi.derivedOrderStatus } : order;
  const reviewRequestSubmitted =
    submittedVersion > 0 && order.project_id
      ? await hasBrandNotification({
          brand_email: order.client_email,
          project_id: order.project_id,
          creator_id: order.creator_id,
          type: "deliverable_uploaded",
          order_id: order.id,
          deliverable_version: submittedVersion
        })
      : false;
  const revertGate =
    submittedVersion > 0 && effectiveOrder.status === "review" && !reviewRequestSubmitted
      ? await creatorRevertUploadService.resolveRevertGate({
          orderId: order.id,
          versionNumber: submittedVersion,
          projectId: order.project_id
        })
      : { canRevert: false };

  const title =
    project?.title || project?.product_name || order.title || order.company_name || creator?.name || "Creator";
  const creativeDirectionConfirmed = hasConfirmedCreativeDirection(project);

  return (
    <div className="min-h-screen bg-[#F7F7FA]">
      {!creativeDirectionConfirmed ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:px-6">
          <p className="font-semibold">
            {locale === "zh" ? "请先确认创意方向，再开始制作。" : "Confirm the creative direction before production."}
          </p>
          <p className="mt-1 text-amber-800">
            {locale === "zh"
              ? "未确认创意方向，仍可继续上传，但存在返工风险。"
              : "No creative direction is confirmed yet. Upload is still allowed, but rework risk is higher."}
          </p>
        </div>
      ) : null}
      <ReviewerTimestampWorkspace
        locale={locale}
        role="creator"
        order={effectiveOrder}
        campaignTitle={title}
        deliverables={workspaceDeliverables}
        initialComments={comments}
        initialVersion={await resolveActiveReviewPlaybackVersion(order.id, workspaceDeliverables)}
        portalUi={portalUi}
        backHref={withLocale(creatorPortalRoutes.reviewHub, locale)}
        backLabel={locale === "zh" ? "返回上一步" : "Back"}
        replaceUploadVersion={replaceUploadVersion}
        canRevertUpload={revertGate.canRevert}
      />
    </div>
  );
}
