import { campaignRepository } from "@/features/campaign/campaign.repository";
import { readProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.utils";
import type { BrandProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.types";
import { getDeliverables, getOrder } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import type { StoredProject } from "@/lib/project-types";

export const ADMIN_ORDER_STATUSES = [
  "submitted",
  "approved",
  "waiting_payment",
  "paid",
  "matching",
  "assigned",
  "matched",
  "in_production",
  "review",
  "revision",
  "delivered",
  "completed",
  "cancelled",
  "disputed"
] as const;

export type AdminOrderDetail = {
  order: StoredOrder;
  project: StoredProject | null;
  deliverables: StoredDeliverable[];
  campaignId: string | null;
  legacyProjectId: string | null;
};

export class AdminOrderRepository {
  async getOrderDetail(orderId: string): Promise<AdminOrderDetail | null> {
    const order = await getOrder(orderId);
    if (!order) return null;

    const project = order.project_id ? await getProject(order.project_id) : null;
    const deliverables = await getDeliverables(orderId);
    const campaign = order.project_id
      ? await campaignRepository.findByLegacyProjectId(order.project_id)
      : null;

    const brief = campaign
      ? (readProductionBrief(campaign.productionBrief) as BrandProductionBrief)
      : null;

    return {
      order,
      project,
      deliverables,
      campaignId: campaign?.id ?? null,
      legacyProjectId: brief?.legacy_project_id ?? order.project_id ?? null
    };
  }
}

export const adminOrderRepository = new AdminOrderRepository();
