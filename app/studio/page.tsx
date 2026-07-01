import { redirect } from "next/navigation";
import { CertificationWelcomeBanner } from "@/components/studioos/certification/certification-welcome-banner";
import { CreatorHomeDashboard } from "@/components/studioos/creator-home-dashboard";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getDeliverables, listOrdersForCreator } from "@/lib/order-service";
import {
  buildCreatorHomeProjects,
  buildCreatorHomeStats,
  buildCreatorPendingTaskCards,
  buildCreatorPhaseCounts,
  buildDemoCreatorHomeMessages,
  buildDemoCreatorHomeProjects,
  buildDemoCreatorHomeStats,
  buildDemoCreatorPendingTaskCards,
  buildDemoCreatorPhaseCounts,
  isCreatorHomeDemoCreator
} from "@/lib/studioos/creator-home-ui";
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
import { getCreatorIncomeSnapshot } from "@/lib/studioos/withdrawal-service";

export default async function StudioHomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const creator = await getCurrentCreator();

  if (!creator) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const useDemoHome = isCreatorHomeDemoCreator(creator.id);

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

  const stats = useDemoHome
    ? buildDemoCreatorHomeStats(locale)
    : buildCreatorHomeStats({
        locale,
        orders,
        pendingTasks: tasks.length,
        isVerified: isCreatorVerified(creator),
        responseRate: invitations.length ? Math.round((responded / invitations.length) * 100) : 100,
        totalEarningsOverride: income.lifetime_withdrawn_usd + income.held_usd + income.available_usd
      });

  const pendingTasks = useDemoHome
    ? buildDemoCreatorPendingTaskCards(locale)
    : buildCreatorPendingTaskCards({
        locale,
        tasks,
        orders,
        invitations
      });

  const projects = useDemoHome
    ? buildDemoCreatorHomeProjects(locale)
    : buildCreatorHomeProjects({ locale, orders });

  const phases = useDemoHome
    ? buildDemoCreatorPhaseCounts()
    : buildCreatorPhaseCounts({ invitations, orders });

  const messages = useDemoHome
    ? buildDemoCreatorHomeMessages(locale)
    : orders.slice(0, 3).map((order, index) => ({
        id: order.id,
        brand: order.company_name || order.client_name,
        preview: order.requirements || order.title,
        time: index === 0 ? "10:30" : index === 1 ? (locale === "zh" ? "昨天 16:45" : "Yesterday") : "Jun 28",
        href: withLocale(creatorPortalRoutes.messages, locale)
      }));

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
        useDemoDate={useDemoHome}
      />
    </div>
  );
}
