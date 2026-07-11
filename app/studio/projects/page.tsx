import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { CreatorProjectsBoard } from "@/components/studioos/creator-projects-board";
import { getCurrentCreatorId } from "@/features/auth/session-context";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { getDeliverables, listOrdersForCreator, repairSelectedCreatorCampaignOrders } from "@/lib/order-service";
import { latestSubmittedDeliverableVersion } from "@/lib/studioos/review-upload-version";

export default async function StudioProjectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) redirect(withLocale("/login?role=creator", locale));

  await repairSelectedCreatorCampaignOrders(creatorId);
  const orders = await listOrdersForCreator(creatorId);
  const deliverableCounts: Record<string, number> = {};
  const lastUploadAtByOrderId: Record<string, string | null> = {};
  await Promise.all(
    orders.map(async (order) => {
      const deliverables = await getDeliverables(order.id);
      const version = latestSubmittedDeliverableVersion(deliverables);
      deliverableCounts[order.id] = version;
      const latestDeliverable =
        version > 0
          ? deliverables
              .filter((item) => item.version === version)
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ??
            null
          : null;
      lastUploadAtByOrderId[order.id] = latestDeliverable?.created_at ?? null;
    })
  );

  return (
    <CreatorProjectsBoard
      locale={locale}
      orders={orders}
      deliverableCounts={deliverableCounts}
      lastUploadAtByOrderId={lastUploadAtByOrderId}
    />
  );
}
