import { redirect } from "next/navigation";
import { StudioWorkspaceDashboard } from "@/components/studioos/studio-workspace-dashboard";
import { CreatorPortalSections } from "@/components/studioos/creator-portal-sections";
import { creatorPortalService } from "@/features/creator/creator-portal.service";
import { getSessionUser } from "@/features/auth/session.service";
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

  const [orders, notifications, sessionUser] = await Promise.all([
    listOrdersForCreator(creator.id),
    listNotificationsForCreator(creator.id, locale),
    getSessionUser()
  ]);

  const assigned = orders.filter((o) => ["in_production", "waiting_payment"].includes(o.status)).length;
  const inReview = orders.filter((o) => o.status === "review" || o.status === "revision").length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const revenue = orders
    .filter((o) => o.payout_status === "held" || o.payout_status === "approved" || o.payout_status === "paid")
    .reduce((sum, o) => sum + o.creator_payout, 0);

  const portal =
    sessionUser && !sessionUser.id.startsWith("demo_")
      ? await creatorPortalService.getDashboard({ id: sessionUser.id, role: sessionUser.role }, orders)
      : {
          invitations: [],
          campaigns: [],
          stats: { pendingInvitations: 0, activeOrders: assigned, inReview, completed, revenue }
        };

  return (
    <div className="space-y-8">
      <StudioWorkspaceDashboard
        locale={locale}
        creator={creator}
        orders={orders}
        notifications={notifications}
        stats={{ assigned, inReview, completed, revenue }}
      />
      <CreatorPortalSections
        locale={locale}
        invitations={portal.invitations}
        campaigns={portal.campaigns}
        orders={orders}
        stats={portal.stats}
      />
    </div>
  );
}
