import { redirect } from "next/navigation";
import { CreatorCommercialTimeline } from "@/components/studioos/commercial-lifecycle-timeline";
import { CertificationWelcomeBanner } from "@/components/studioos/certification/certification-welcome-banner";
import { CreatorHomeDashboard } from "@/components/studioos/creator-home-dashboard";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getDeliverables, listOrdersForCreator } from "@/lib/order-service";
import { resolveCreatorCommercialStep } from "@/lib/studioos/commercial-lifecycle";
import {
  countAwaitingBrandSelection,
  countInvitationsByTab
} from "@/lib/studioos/creator-invitation-utils";
import { listInvitationsForCreator } from "@/lib/studioos/creator-invitation-store";
import { deriveCreatorTodayTasks } from "@/lib/studioos/creator-order-lifecycle";
import {
  hasDismissedCertificationWelcomeBanner,
  hasSeenCertificationLevelUp
} from "@/lib/studioos/creator-settings-service";
import { isCreatorVerified } from "@/lib/studioos/deposit-guard";
import { getCreatorIncomeSnapshot } from "@/lib/studioos/withdrawal-service";

export default async function StudioHomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const creator = await getCurrentCreator();

  if (!creator) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const [orders, invitations, income, levelUpSeen, welcomeDismissed] = await Promise.all([
    listOrdersForCreator(creator.id),
    listInvitationsForCreator(creator.id),
    getCreatorIncomeSnapshot(creator.id),
    hasSeenCertificationLevelUp(creator.id),
    hasDismissedCertificationWelcomeBanner(creator.id)
  ]);

  const showWelcomeBanner =
    isCreatorVerified(creator) && levelUpSeen && !welcomeDismissed;

  const invitationCounts = countInvitationsByTab(invitations);
  const deliverableCounts: Record<string, number> = {};
  await Promise.all(
    orders.map(async (order) => {
      deliverableCounts[order.id] = (await getDeliverables(order.id)).length;
    })
  );

  const tasks = deriveCreatorTodayTasks({
    pendingInvitations: invitationCounts.pending,
    awaitingBrandSelection: countAwaitingBrandSelection(invitations),
    orders,
    deliverableCounts
  });

  const completed = orders.filter((order) => order.status === "completed").length;
  const responded =
    invitationCounts.accepted + invitationCounts.declined + invitationCounts.expired;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIncome = orders
    .filter(
      (order) =>
        order.completed_at &&
        new Date(order.completed_at) >= todayStart &&
        order.payout_status === "paid"
    )
    .reduce((sum, order) => sum + order.creator_payout, 0);

  const primaryOrder = orders[0] ?? null;
  const primaryDeliverables = primaryOrder ? deliverableCounts[primaryOrder.id] ?? 0 : 0;
  const focusInvitation =
    invitations.find((item) => item.status === "selected") ??
    invitations.find((item) => item.status === "accepted") ??
    invitations.find((item) => item.status === "pending") ??
    null;
  const creatorCommercialStep = resolveCreatorCommercialStep({
    invitationStatus: focusInvitation?.status ?? null,
    order: primaryOrder,
    deliverableCount: primaryDeliverables
  });

  return (
    <div className="space-y-6">
      {showWelcomeBanner ? <CertificationWelcomeBanner locale={locale} /> : null}
      <CreatorCommercialTimeline
        locale={locale}
        currentStep={creatorCommercialStep}
        orderStatus={primaryOrder?.status ?? null}
        compact
      />
      <CreatorHomeDashboard
        locale={locale}
        creatorName={creator.name}
        tasks={tasks}
        stats={{
          todayIncome,
          pendingSettlement: income.held_usd,
          completionRate: orders.length ? Math.round((completed / orders.length) * 100) : 0,
          responseRate: invitations.length ? Math.round((responded / invitations.length) * 100) : 100,
          pendingInvitations: invitationCounts.pending
        }}
      />
    </div>
  );
}
