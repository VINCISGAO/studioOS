import { redirect } from "next/navigation";
import { BrandCommercialTimeline } from "@/components/studioos/commercial-lifecycle-timeline";
import { BrandProjectHub } from "@/components/studioos/brand-project-hub";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getDeliverables, getOrder, getOrderForProject } from "@/lib/order-service";
import { isOrderPaymentEscrowed } from "@/lib/order-types";
import { getProject } from "@/lib/project-service";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { enforceBrandPaymentDeadlineForProject } from "@/lib/studioos/brand-payment-expiry.service";
import { isBrandAwaitingPayment, resolveBrandCommercialStep } from "@/lib/studioos/commercial-lifecycle";
import {
  enrichStoredCreatorInvitations,
  ensureCampaignInvitationsForProject,
  listAcceptedInvitationsForProject,
  listInvitationsForProject
} from "@/lib/studioos/creator-invitation-store";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import { countUnreadBrandNotifications } from "@/lib/studioos/brand-notification-service";
import { getAiMatchReportStatisticsForProject } from "@/lib/studioos/ai-match-report-statistics";
import { listReviewComments } from "@/lib/studioos/review-store";
import { isReviewCommentUnresolved } from "@/lib/studioos/review-comment-status";

type HubTab = "brief" | "match" | "proposal" | "production" | "review";

const validTabs = new Set<HubTab>(["brief", "match", "proposal", "production", "review"]);

function defaultTab(status: string): HubTab {
  if (status === "matching" || status === "studio_selected") return "match";
  if (["proposal", "contract_pending", "payment_pending"].includes(status)) return "proposal";
  if (["production", "in_review", "delivered", "completed"].includes(status)) return "production";
  return "brief";
}

function parseBudgetAmount(raw: string, fallback: number) {
  const match = raw.replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : fallback;
}

function selectedCreatorInvitation(input: {
  project: NonNullable<Awaited<ReturnType<typeof getProject>>>;
  creatorId: string;
  amount: number;
}): StoredCreatorInvitation {
  const now = input.project.updated_at || input.project.created_at || new Date().toISOString();
  return {
    id: `selected_${input.project.id}_${input.creatorId}`,
    campaignId: input.project.id,
    projectId: input.project.id,
    creatorId: input.creatorId,
    brandEmail: input.project.client_email,
    title: input.project.title || input.project.product_name || input.project.company_name,
    brandName: input.project.company_name || input.project.client_name,
    budget: input.amount,
    currency: "USD",
    deadline: input.project.deadline,
    platform: input.project.target_platform || null,
    matchScore: 100,
    status: "accepted",
    expiresAt: null,
    createdAt: now
  };
}

function ensureSelectedCreatorInInvitations(input: {
  invitations: StoredCreatorInvitation[];
  accepted: StoredCreatorInvitation[];
  project: NonNullable<Awaited<ReturnType<typeof getProject>>>;
  linkedOrder: Awaited<ReturnType<typeof getOrderForProject>>;
}) {
  const creatorId = input.linkedOrder?.creator_id || input.project.selected_studio_id;
  if (!creatorId) {
    return { invitations: input.invitations, accepted: input.accepted, selectedCreatorId: null as string | null };
  }

  const existing =
    input.invitations.find((item) => item.creatorId === creatorId) ??
    input.accepted.find((item) => item.creatorId === creatorId);
  const selected: StoredCreatorInvitation =
    existing
      ? { ...existing, status: "accepted" }
      : selectedCreatorInvitation({
          project: input.project,
          creatorId,
          amount:
            input.linkedOrder?.amount ??
            parseBudgetAmount(input.project.budget_range, input.project.budget_max ?? input.project.budget_min ?? 0)
        });

  const mergeByCreator = (items: StoredCreatorInvitation[]) => [
    selected,
    ...items.filter((item) => item.creatorId !== creatorId)
  ];

  return {
    invitations: mergeByCreator(input.invitations),
    accepted: mergeByCreator(input.accepted.filter((item) => item.status === "accepted")),
    selectedCreatorId: creatorId
  };
}

export default async function BrandProjectHubPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams & { matching?: string; tab?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const clientEmail = await getCurrentClientEmail();
  let project = await getProject(id);

  if (!project) {
    const order = await getOrder(id);
    if (order?.project_id) {
      redirect(withLocale(brandPortalRoutes.project(order.project_id), locale));
    }
    if (order) {
      redirect(withLocale(brandPortalRoutes.projectReview(id), locale));
    }
    redirect(withLocale(brandPortalRoutes.dashboard, locale));
  }

  if (clientEmail && project.client_email !== clientEmail.toLowerCase()) {
    redirect(withLocale("/brand", locale));
  }

  await enforceBrandPaymentDeadlineForProject(id).catch(() => false);
  project = (await getProject(id)) ?? project;

  const linkedOrder = await getOrderForProject(id);
  const deliverables = linkedOrder ? await getDeliverables(linkedOrder.id) : [];

  const tabParam = query.tab;
  const activeTab: HubTab =
    tabParam && validTabs.has(tabParam as HubTab)
      ? (tabParam as HubTab)
      : defaultTab(project.status);

  if (activeTab === "review") {
    redirect(withLocale(`/brand/projects/${id}/review`, locale));
  }

  const awaitingPayment = isBrandAwaitingPayment({ project, order: linkedOrder });
  const matchingRequiresPayment =
    activeTab === "match" &&
    (!linkedOrder || !isOrderPaymentEscrowed(linkedOrder.payment_status));

  if (((activeTab === "match" || activeTab === "production") && awaitingPayment) || matchingRequiresPayment) {
    redirect(withLocale(brandPortalRoutes.projectCheckout(id), locale));
  }

  const reviewComments = linkedOrder ? await listReviewComments(linkedOrder.id) : [];
  let projectInvitations = await listInvitationsForProject(id).catch(() => [] as Awaited<
    ReturnType<typeof listInvitationsForProject>
  >);
  if (
    activeTab === "match" &&
    (project.status === "matching" || project.status === "studio_selected") &&
    projectInvitations.length === 0
  ) {
    projectInvitations = await ensureCampaignInvitationsForProject(project, locale).catch(
      () => projectInvitations
    );
  }
  let acceptedInvitations = await listAcceptedInvitationsForProject(id).catch(() => [] as Awaited<
    ReturnType<typeof listAcceptedInvitationsForProject>
  >);
  const selectedInvitationState = ensureSelectedCreatorInInvitations({
    invitations: projectInvitations,
    accepted: acceptedInvitations,
    project,
    linkedOrder
  });
  projectInvitations = await enrichStoredCreatorInvitations(selectedInvitationState.invitations);
  acceptedInvitations = await enrichStoredCreatorInvitations(selectedInvitationState.accepted);
  const notificationCount = clientEmail ? await countUnreadBrandNotifications(clientEmail) : 0;
  const aiMatchStatistics = await getAiMatchReportStatisticsForProject(id).catch(() => null);
  const brandCommercialStep = resolveBrandCommercialStep({
    project,
    order: linkedOrder,
    invitations: projectInvitations,
    deliverableCount: deliverables.length
  });

  return (
    <div className="space-y-6">
      <BrandCommercialTimeline
        locale={locale}
        currentStep={brandCommercialStep}
        orderStatus={linkedOrder?.status ?? null}
        paymentStatus={linkedOrder?.payment_status ?? null}
        projectStatus={project.status}
        hasOpenComments={reviewComments.some((item) => isReviewCommentUnresolved(item.status))}
        pendingInvitationCount={projectInvitations.filter((item) => item.status === "pending").length}
        compact
      />
      <BrandProjectHub
        locale={locale}
        project={project}
        activeTab={activeTab}
        linkedOrder={linkedOrder}
        deliverables={deliverables}
        reviewComments={reviewComments}
        acceptedInvitations={acceptedInvitations}
        projectInvitations={projectInvitations}
        selectedCreatorId={selectedInvitationState.selectedCreatorId}
        brandCommercialStep={brandCommercialStep}
        notificationCount={notificationCount}
        aiMatchStatistics={aiMatchStatistics}
        showPaymentSuccessMatching={activeTab === "match" && query.matching === "1"}
      />
    </div>
  );
}
