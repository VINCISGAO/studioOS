import { redirect } from "next/navigation";
import { CreatorProjectsBoard } from "@/components/studioos/creator-projects-board";
import { getCurrentCreatorId } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getDeliverables, listOrdersForCreator, repairSelectedCreatorCampaignOrders } from "@/lib/order-service";

export default async function StudioProjectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) redirect(withLocale("/login?role=creator", locale));

  await repairSelectedCreatorCampaignOrders(creatorId);
  const orders = await listOrdersForCreator(creatorId);
  const deliverableCounts: Record<string, number> = {};
  await Promise.all(
    orders.map(async (order) => {
      deliverableCounts[order.id] = (await getDeliverables(order.id)).length;
    })
  );

  return <CreatorProjectsBoard locale={locale} orders={orders} deliverableCounts={deliverableCounts} />;
}
