import { redirect } from "next/navigation";
import { CreatorProjectsBoard } from "@/components/studioos/creator-projects-board";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getDeliverables, listOrdersForCreator } from "@/lib/order-service";

export default async function StudioProjectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const creator = await getCurrentCreator();
  if (!creator) redirect(withLocale("/login?role=creator", locale));

  const orders = await listOrdersForCreator(creator.id);
  const deliverableCounts: Record<string, number> = {};
  await Promise.all(
    orders.map(async (order) => {
      deliverableCounts[order.id] = (await getDeliverables(order.id)).length;
    })
  );

  return <CreatorProjectsBoard locale={locale} orders={orders} deliverableCounts={deliverableCounts} />;
}
