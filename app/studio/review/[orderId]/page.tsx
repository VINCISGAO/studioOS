import { redirect } from "next/navigation";
import { ReviewerTimestampWorkspace } from "@/components/studioos/reviewer-skeleton/reviewer-timestamp-workspace";
import { getCreatorById } from "@/lib/creator-service";
import { getCurrentCreatorId } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
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

export default async function StudioReviewOrderPage({
  params,
  searchParams
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ orderId }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
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

  return (
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
      backLabel={locale === "zh" ? "返回审片中心" : "Back to review center"}
      replaceUploadVersion={replaceUploadVersion}
      canRevertUpload={revertGate.canRevert}
    />
  );
}
