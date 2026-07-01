import Link from "next/link";
import { redirect } from "next/navigation";
import { FrameioReviewCenter } from "@/components/studioos/review-engine/frameio-review-center";
import { DeliverableVideoPolicyNotice } from "@/components/studioos/deliverable-video-policy-notice";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getDeliverables, getOrder } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { deliveryService } from "@/features/delivery/delivery.service";
import { resolveReviewPortalUiState } from "@/features/review/review-portal-ui-state";
import { listReviewComments } from "@/lib/studioos/review-store";

export default async function StudioReviewOrderPage({
  params,
  searchParams
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ orderId }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const creator = await getCurrentCreator();
  if (!creator) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const order = await getOrder(orderId);
  if (!order || order.creator_id !== creator.id) {
    redirect(withLocale(creatorPortalRoutes.reviewHub, locale));
  }

  const project = order.project_id ? await getProject(order.project_id) : null;
  const legacyProjectId = order.project_id ?? order.id;
  const [deliverables, comments, delivery] = await Promise.all([
    getDeliverables(order.id),
    listReviewComments(order.id),
    deliveryService.getForLegacyProject(legacyProjectId)
  ]);

  const reviewUi = await resolveReviewPortalUiState({
    legacyProjectId,
    order,
    deliverableCount: deliverables.length
  });

  const title =
    project?.title || project?.product_name || order.title || order.company_name || creator.name;

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {reviewUi.orderApproved ? <DeliverableVideoPolicyNotice locale={locale} /> : null}
      <FrameioReviewCenter
        locale={locale}
        order={order}
        campaignTitle={title}
        deliverables={deliverables}
        initialComments={comments}
        initialVersion={deliverables[deliverables.length - 1]?.version ?? 1}
        role="creator"
        variant="embedded"
        backHref={withLocale(creatorPortalRoutes.reviewHub, locale)}
        backLabel={locale === "zh" ? "返回审片中心" : "Back to review center"}
        delivery={delivery}
        reviewUi={reviewUi}
      />
    </div>
  );
}
