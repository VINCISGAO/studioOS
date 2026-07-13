import type { CreatorProjectPortalDetail } from "@/features/portal/portal.types";
import { buildCreativeCollaborationView, readCreativeCollaboration } from "@/features/creative-collaboration/creative-collaboration.repository";
import { getCreativeBrief, listPackItems, listReferencesForProject } from "@/lib/campaign-store";
import { isOrderPaymentEscrowed } from "@/lib/order-types";
import { getDeliverables, getOrder, repairSelectedCreatorCampaignOrders } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { resolveCreatorCommercialStep } from "@/lib/studioos/commercial-lifecycle";
import { isCreatorUploadActionable } from "@/lib/studioos/creator-order-lifecycle";
import { listReviewComments } from "@/lib/studioos/review-store";
import type { Locale } from "@/lib/i18n";
import { appError } from "@/lib/core/errors";

export const creatorProjectPortalService = {
  async getDetail(input: {
    orderId: string;
    locale: Locale;
    creatorId: string;
  }): Promise<CreatorProjectPortalDetail> {
    const { orderId, locale, creatorId } = input;

    await repairSelectedCreatorCampaignOrders(creatorId);
    const order = await getOrder(orderId);
    if (!order || order.creator_id !== creatorId) {
      throw appError("FORBIDDEN", "Access denied", 403);
    }

    const project = order.project_id ? await getProject(order.project_id) : null;
    const [deliverables, comments, brief, pack, references] = await Promise.all([
      getDeliverables(order.id),
      listReviewComments(order.id),
      order.project_id ? getCreativeBrief(order.project_id) : Promise.resolve(null),
      order.project_id ? listPackItems(order.project_id) : Promise.resolve([]),
      order.project_id ? listReferencesForProject(order.project_id) : Promise.resolve([])
    ]);

    const canUpload = isCreatorUploadActionable(order, deliverables.length);
    const collaborationView = project
      ? buildCreativeCollaborationView(readCreativeCollaboration(project))
      : null;
    const aiEnabled = isOrderPaymentEscrowed(order.payment_status);
    const creatorCommercialStep = resolveCreatorCommercialStep({
      invitationStatus: "selected",
      order,
      deliverableCount: deliverables.length
    });

    return {
      locale,
      orderId,
      order,
      project,
      pack,
      deliverables,
      comments,
      brief,
      references,
      canUpload,
      collaborationView,
      aiEnabled,
      creatorCommercialStep,
      commercialContext: { order }
    };
  }
};
