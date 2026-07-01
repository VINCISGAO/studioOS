import { redirect } from "next/navigation";
import { CreatorProjectsBoard } from "@/components/studioos/creator-projects-board";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { listOrdersForCreator } from "@/lib/order-service";

export default async function StudioProjectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const creator = await getCurrentCreator();
  if (!creator) redirect(withLocale("/login?role=creator", locale));

  const orders = await listOrdersForCreator(creator.id);
  return <CreatorProjectsBoard locale={locale} orders={orders} />;
}
