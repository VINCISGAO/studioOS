import { redirect } from "next/navigation";
import { StudioWorkspaceDashboard } from "@/components/studioos/studio-workspace-dashboard";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { listOrdersForCreator } from "@/lib/order-service";
import { listNotificationsForCreator } from "@/lib/notification-service";

export default async function StudioDashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const creator = await getCurrentCreator();

  if (!creator) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const orders = await listOrdersForCreator(creator.id);
  const notifications = await listNotificationsForCreator(creator.id, locale);
  const assigned = orders.filter((o) => ["in_production", "waiting_payment"].includes(o.status)).length;
  const inReview = orders.filter((o) => o.status === "review" || o.status === "revision").length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const revenue = orders
    .filter((o) => o.payout_status === "held" || o.payout_status === "approved" || o.payout_status === "paid")
    .reduce((sum, o) => sum + o.creator_payout, 0);

  return (
    <StudioWorkspaceDashboard
      locale={locale}
      creator={creator}
      orders={orders}
      notifications={notifications}
      stats={{ assigned, inReview, completed, revenue }}
    />
  );
}
