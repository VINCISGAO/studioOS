import { getDeliverables, listOrdersForClient } from "@/lib/order-service";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import {
  getInsightsForOrg,
  listPerformanceForOrg,
  orgIdFromEmail
} from "@/lib/studioos/creative-performance-store";
import type {
  CreativePerformanceRecord,
  StoredCreativeInsight
} from "@/lib/studioos/creative-performance-types";

const ATTRIBUTION_ELIGIBLE_STATUSES = new Set<StoredOrder["status"]>([
  "review",
  "revision",
  "completed"
]);

export type AttributionDeliverableRow = {
  order: StoredOrder;
  deliverables: StoredDeliverable[];
  records: CreativePerformanceRecord[];
  reviewHref: string;
  attributed: boolean;
};

export async function getBrandAttributionWorkspace(clientEmail: string) {
  const orgId = orgIdFromEmail(clientEmail);
  const [orders, allRecords, insights] = await Promise.all([
    listOrdersForClient(clientEmail),
    listPerformanceForOrg(orgId),
    getInsightsForOrg(orgId)
  ]);

  const eligible = orders.filter((order) => ATTRIBUTION_ELIGIBLE_STATUSES.has(order.status));

  const rows: AttributionDeliverableRow[] = await Promise.all(
    eligible.map(async (order) => {
      const deliverables = await getDeliverables(order.id);
      const records = allRecords.filter((item) => item.order_id === order.id);
      const projectSegment = order.project_id ?? order.id;
      return {
        order,
        deliverables,
        records,
        reviewHref: `/brand/projects/${projectSegment}/review`,
        attributed: records.length > 0
      };
    })
  );

  const withDeliverables = rows.filter((row) => row.deliverables.length > 0);
  const pendingCount = withDeliverables.filter((row) => !row.attributed).length;

  return {
    orgId,
    rows: withDeliverables,
    records: allRecords,
    insights,
    pendingCount,
    attributedCount: withDeliverables.filter((row) => row.attributed).length
  };
}
