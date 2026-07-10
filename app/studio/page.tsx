import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { CertificationWelcomeBanner } from "@/components/studioos/certification/certification-welcome-banner";
import { CreatorHomeDashboard } from "@/components/studioos/creator-home-dashboard";
import { CreatorMembershipPanel } from "@/components/studioos/creator-membership-panel";
import type {
  CreatorMembershipStatusView,
  MembershipPlanView
} from "@/features/membership/membership.types";
import { membershipService } from "@/features/membership/membership.service";
import { getCurrentCreator } from "@/lib/creator-session";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { listNotificationsForCreator } from "@/lib/notification-service";
import { getCurrentSession } from "@/lib/session-user";
import { getDeliverables, listOrdersForCreator } from "@/lib/order-service";
import {
  buildCreatorHomeProjects,
  buildCreatorHomeStats,
  buildCreatorPendingTaskCards,
  buildCreatorPhaseCounts
} from "@/lib/studioos/creator-home-ui";
import { latestSubmittedDeliverableVersion } from "@/lib/studioos/review-upload-version";
import { buildCreatorAiMatchHealth } from "@/lib/studioos/creator-ai-match-health";
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
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { formatMessageListTime } from "@/lib/studioos/creator-messages-ui";
import { getCreatorIncomeSnapshot } from "@/lib/studioos/withdrawal-service";

export default async function StudioHomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const [creator, session] = await Promise.all([getCurrentCreator(), getCurrentSession()]);

  if (!creator) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const membershipPromise =
    session?.role === "creator" && session.userId
      ? Promise.all([
          membershipService.getCreatorMembershipStatus(session.userId),
          membershipService.requireVerifiedPlan()
        ])
          .then(([status, verifiedPlan]) => ({ status, verifiedPlan }))
          .catch((error) => {
            console.error("[studio.membership]", error);
            return null;
          })
      : Promise.resolve<{
          status: CreatorMembershipStatusView;
          verifiedPlan: MembershipPlanView;
        } | null>(null);

  const [
    orders,
    income,
    levelUpSeen,
    welcomeDismissed,
    membership,
    invitations
  ] = await Promise.all([
    listOrdersForCreator(creator.id),
    getCreatorIncomeSnapshot(creator.id),
    hasSeenCertificationLevelUp(creator.id),
    hasDismissedCertificationWelcomeBanner(creator.id),
    membershipPromise,
    listInvitationsForCreator(creator.id, locale)
  ]);
  const notifications = await listNotificationsForCreator(creator.id, locale);

  const showWelcomeBanner =
    isCreatorVerified(creator) && levelUpSeen && !welcomeDismissed;

  const invitationCounts = countInvitationsByTab(invitations);
  const deliverableCounts: Record<string, number> = {};
  await Promise.all(
    orders.map(async (order) => {
      deliverableCounts[order.id] = latestSubmittedDeliverableVersion(await getDeliverables(order.id));
    })
  );

  const tasks = deriveCreatorTodayTasks({
    pendingInvitations: invitationCounts.pending,
    awaitingBrandSelection: countAwaitingBrandSelection(invitations, orders),
    orders,
    deliverableCounts
  });

  const responded =
    invitationCounts.accepted + invitationCounts.declined + invitationCounts.expired;

  const stats = buildCreatorHomeStats({
    locale,
    orders,
    pendingTasks: tasks.length,
    isVerified: isCreatorVerified(creator),
    responseRate: invitations.length ? Math.round((responded / invitations.length) * 100) : 100,
    totalEarningsOverride: income.lifetime_withdrawn_usd + income.available_usd
  });

  const pendingTasks = buildCreatorPendingTaskCards({
    locale,
    tasks,
    orders,
    invitations,
    deliverableCounts
  });

  const projects = buildCreatorHomeProjects({ locale, orders, deliverableCounts });

  const phases = buildCreatorPhaseCounts({ invitations, orders });

  const messages = notifications.slice(0, 3).map((notification) => ({
    id: notification.id,
    brand: notification.company_name || notification.client_name,
    preview: notification.body,
    time: formatMessageListTime(notification.created_at, locale),
    href: withLocale(`${creatorPortalRoutes.messages}?id=${notification.id}`, locale)
  }));
  const aiMatchHealth = buildCreatorAiMatchHealth({ locale, invitations });

  return (
    <div className="space-y-6">
      {showWelcomeBanner ? <CertificationWelcomeBanner locale={locale} /> : null}
      <CreatorHomeDashboard
        locale={locale}
        creatorName={creator.name}
        stats={stats}
        pendingTasks={pendingTasks}
        projects={projects}
        phases={phases}
        messages={messages}
        aiMatchHealth={aiMatchHealth}
      />
      {membership ? (
        <CreatorMembershipPanel
          locale={locale}
          status={membership.status}
          verifiedPlan={membership.verifiedPlan}
          stripeConfigured={Boolean(process.env.STRIPE_SECRET_KEY?.trim())}
        />
      ) : null}
    </div>
  );
}
