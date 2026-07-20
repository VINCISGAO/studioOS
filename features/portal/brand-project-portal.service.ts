import type { BrandProjectDetailTab, BrandProjectPortalDetail } from "@/features/portal/portal.types";
import {
  ensureSelectedCreatorInInvitations
} from "@/features/portal/portal-invitation.helpers";
import type { Locale } from "@/lib/i18n";
import { getDeliverables, getOrder, getOrderForProject } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { isBrandAwaitingPayment, resolveBrandCommercialStep } from "@/lib/studioos/commercial-lifecycle";
import {
  isBrandProjectCancelled,
  isBrandProjectFunded,
  shouldBrandMatchTabRedirectToCheckout
} from "@/lib/studioos/brand-payment-funding";
import {
  enrichStoredCreatorInvitations,
  ensureCampaignInvitationsForProject,
  listAcceptedInvitationsForProject,
  listInvitationsForProject
} from "@/lib/studioos/creator-invitation-store";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import { countUnreadBrandNotifications } from "@/lib/studioos/brand-notification-service";
import { getAiMatchReportStatisticsForProject } from "@/lib/studioos/ai-match-report-statistics";
import { isResolvableCampaignCreatorId } from "@/lib/studioos/brand-checkout-utils";
import { listReviewComments } from "@/lib/studioos/review-store";
import { appError } from "@/lib/core/errors";

const legacyTabs = new Set<BrandProjectDetailTab>(["match", "proposal", "production", "review"]);
const detailTabs = new Set<BrandProjectDetailTab>(["brief", "assets", "versions", "audit"]);

function resolveActiveTab(tabParam?: string | null): BrandProjectDetailTab {
  if (tabParam && (detailTabs.has(tabParam as BrandProjectDetailTab) || legacyTabs.has(tabParam as BrandProjectDetailTab))) {
    return tabParam as BrandProjectDetailTab;
  }
  return "brief";
}

export const brandProjectPortalService = {
  async getDetail(input: {
    projectId: string;
    locale: Locale;
    clientEmail: string;
    tab?: string | null;
  }): Promise<BrandProjectPortalDetail> {
    const { projectId, locale, clientEmail, tab } = input;

    const project = await getProject(projectId);
    if (!project) {
      throw appError("NOT_FOUND", "Project not found", 404);
    }

    const normalizedEmail = clientEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      throw appError("FORBIDDEN", "Access denied", 403);
    }

    if (project.client_email !== normalizedEmail) {
      throw appError("FORBIDDEN", "Access denied", 403);
    }

    const linkedOrder = await getOrderForProject(projectId);
    const deliverables = linkedOrder ? await getDeliverables(linkedOrder.id) : [];
    const activeTab = resolveActiveTab(tab);

    const funded = await isBrandProjectFunded(projectId, linkedOrder);
    const cancelled = isBrandProjectCancelled(project, linkedOrder);
    const awaitingPayment =
      !funded && !cancelled && isBrandAwaitingPayment({ project, order: linkedOrder });
    const hasActiveProject = Boolean(
      isResolvableCampaignCreatorId(linkedOrder?.creator_id) || project.selected_studio_id
    );
    const shouldRedirectToCheckout = shouldBrandMatchTabRedirectToCheckout({
      activeTab,
      funded,
      hasActiveProject,
      cancelled
    }) && awaitingPayment;

    let projectInvitations = await listInvitationsForProject(projectId).catch(() => [] as StoredCreatorInvitation[]);
    if (
      (project.status === "matching" || project.status === "studio_selected") &&
      projectInvitations.length === 0
    ) {
      projectInvitations = await ensureCampaignInvitationsForProject(project, locale).catch(
        () => projectInvitations
      );
    }

    const acceptedInvitations = await listAcceptedInvitationsForProject(projectId).catch(
      () => [] as StoredCreatorInvitation[]
    );
    const selectedInvitationState = ensureSelectedCreatorInInvitations({
      invitations: projectInvitations,
      accepted: acceptedInvitations,
      project,
      linkedOrder
    });
    projectInvitations = await enrichStoredCreatorInvitations(selectedInvitationState.invitations);

    const reviewComments = linkedOrder ? await listReviewComments(linkedOrder.id) : [];
    const notificationCount = clientEmail ? await countUnreadBrandNotifications(clientEmail) : 0;
    const aiMatchStatistics = await getAiMatchReportStatisticsForProject(projectId).catch(() => null);
    const brandCommercialStep = resolveBrandCommercialStep({
      project,
      order: linkedOrder,
      invitations: projectInvitations,
      deliverableCount: deliverables.length
    });

    return {
      locale,
      projectId,
      activeTab,
      project,
      linkedOrder,
      deliverables,
      reviewComments,
      projectInvitations,
      selectedCreatorId: selectedInvitationState.selectedCreatorId,
      brandCommercialStep,
      commercialContext: { project, order: linkedOrder },
      notificationCount,
      aiMatchStatistics,
      flags: {
        isDraft: project.status === "draft",
        awaitingPayment,
        hasActiveProject,
        matchingRequiresPayment: shouldRedirectToCheckout,
        shouldRedirectToCheckout
      }
    };
  },

  async resolveProjectIdFromOrderOrReview(orderOrProjectId: string) {
    const project = await getProject(orderOrProjectId);
    if (project) return { kind: "project" as const, projectId: project.id };

    const order = await getOrder(orderOrProjectId);
    if (order?.project_id) {
      return { kind: "redirect_project" as const, projectId: order.project_id };
    }
    if (order) {
      return { kind: "redirect_review" as const, orderId: order.id };
    }
    return { kind: "not_found" as const };
  }
};
