import { invitationPortalService } from "@/features/matching/invitation-portal.service";
import { campaignSelectionService } from "@/features/matching/campaign-selection.service";
import { invitationRepository } from "@/features/matching/invitation.repository";
import { matchingService } from "@/features/matching/matching.service";
import { activityService } from "@/features/campaign/activity.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { campaignService } from "@/features/campaign/campaign.service";
import { CampaignEvent, CampaignState } from "@/features/campaign/campaign.state-machine";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { aiLearningEventRepository } from "@/features/ai/ai-learning-event.repository";
import { aiLearningWorkerService } from "@/features/ai/ai-learning-worker.service";
import type { InvitationDeclineFeedback } from "@/features/matching/invitation-decline-feedback";
import { appError } from "@/lib/core/errors";
import type { Locale } from "@/lib/i18n";
import type { StoredProject } from "@/lib/project-types";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { notificationService } from "@/features/notification/notification.service";
import { paymentRepository } from "@/features/payment/payment.repository";
import { EscrowState } from "@/features/shared/state-machines/escrow.state-machine";
import { getAppBaseUrl } from "@/lib/app-url";
import { resolveLegacyProjectId } from "@/features/matching/invitation.mapper";
import {
  createCreatorNotification,
  findNotificationByProject
} from "@/lib/notification-service";
import { resolveLegacyCreatorIdForProfile } from "@/features/matching/invitation-creator-bridge";

export function serializeInvitation(
  invitation: Awaited<ReturnType<typeof invitationRepository.listForCampaign>>[number]
) {
  return {
    id: invitation.id,
    campaignId: invitation.campaignId,
    creatorProfileId: invitation.creatorId,
    creatorUserId: invitation.creator.userId,
    displayName: invitation.creator.displayName,
    email: invitation.creator.user.email,
    matchScore: Number(invitation.matchScore),
    status: invitation.status,
    expiresAt: invitation.expiresAt?.toISOString() ?? null,
    respondedAt: invitation.respondedAt?.toISOString() ?? null,
    createdAt: invitation.createdAt.toISOString()
  };
}

function throwPortalInvitationError(error: string): never {
  if (error === "not-found") throw appError("NOT_FOUND", "Invitation not found");
  if (error === "not-pending" || error === "recruitment-closed") {
    throw appError("CAMPAIGN_LOCKED", "Invitation already responded");
  }
  throw appError("VALIDATION_ERROR", error);
}

export class InvitationService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  async list(campaignId: string, user: AuthUser) {
    this.assertDb();
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    const items = await invitationRepository.listForCampaign(campaignId);
    if (PermissionService.canAccessCampaign(user, campaign) || user.role.toUpperCase() === "ADMIN") {
      return items.map(serializeInvitation);
    }

    if (user.hasCreatorProfile || user.role.toUpperCase() === "CREATOR") {
      const ownInvitations = items.filter((item) => item.creator.userId === user.id);
      if (ownInvitations.length > 0) {
        return ownInvitations.map(serializeInvitation);
      }
    }

    throw appError("FORBIDDEN", "Not allowed");
  }

  async send(campaignId: string, user: AuthUser, creatorProfileIds: string[]) {
    this.assertDb();
    PermissionService.assert(user, "campaign.update");

    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    if (!PermissionService.canAccessCampaign(user, campaign)) {
      throw appError("FORBIDDEN", "Not allowed for this campaign");
    }

    const invitationAllowedStatuses = new Set<string>([
      CampaignState.MATCHING,
      CampaignState.INVITATION_SENT
    ]);
    if (!invitationAllowedStatuses.has(campaign.status)) {
      throw appError("INVALID_TRANSITION", "Invitations can only be sent after escrow-funded matching starts");
    }
    const escrow = await paymentRepository.findByCampaignId(campaignId);
    const escrowFunded =
      escrow?.status === EscrowState.HELD ||
      escrow?.status === EscrowState.PARTIAL_RELEASE ||
      escrow?.status === EscrowState.FULL_RELEASE;
    if (!escrowFunded) {
      throw appError("INVALID_TRANSITION", "Escrow must be funded before sending invitations");
    }

    const matches = await matchingService.matchCreatorsForCampaign(campaignId, user, 20);
    const matchMap = new Map(matches.map((m) => [m.creatorProfileId, m.matchScore]));
    const brand = await prisma.user.findUnique({
      where: { id: campaign.brandId },
      include: { brandProfile: true }
    });
    const brandName = brand?.brandProfile?.companyName ?? brand?.fullName ?? "Brand";
    const budgetLabel = `${campaign.currency} ${campaign.budget.toFixed(2)}`;
    const deliveryTime = campaign.deadline.toISOString();
    const actor = { id: user.id, role: user.role };

    for (const creatorProfileId of creatorProfileIds) {
      const existing = await invitationRepository.findExisting(campaignId, creatorProfileId);
      if (existing) continue;

      const profile = await prisma.creatorProfile.findUnique({ where: { id: creatorProfileId } });
      if (!profile) throw appError("NOT_FOUND", `Creator ${creatorProfileId} not found`);

      const created = await invitationRepository.create({
        campaignId,
        creatorProfileId,
        matchScore: matchMap.get(creatorProfileId) ?? 50
      });
      await activityService.write(campaignId, "invitation.sent", {
        userId: user.id,
        email: user.id,
        role: user.role.toUpperCase() === "ADMIN" ? "admin" : "brand"
      }, {
        creatorProfileId,
        creatorUserId: created.creator.userId,
        matchScore: Number(created.matchScore)
      });
      await notificationService.notify({
        userId: created.creator.userId,
        campaignId,
        title: "New collaboration invitation",
        content: `You received a creator invitation for "${campaign.title}". Review the brief and respond.`,
        actionUrl: `${getAppBaseUrl()}/studio/invitations`,
        template: "invitation.received",
        priority: "HIGH",
        metadata: {
          brand: brandName,
          project: campaign.title,
          budget: budgetLabel,
          deliveryTime
        }
      });
      const legacyCreatorId = await resolveLegacyCreatorIdForProfile(created.creator);
      if (legacyCreatorId) {
        const notificationProjectId = resolveLegacyProjectId(campaign);
        const existingCreatorNotification = await findNotificationByProject(
          legacyCreatorId,
          notificationProjectId,
          "invitation_match"
        );
        if (!existingCreatorNotification) {
          await createCreatorNotification({
            creator_id: legacyCreatorId,
            type: "invitation_match",
            title: "New collaboration invitation",
            body: `You received a creator invitation for "${campaign.title}". Review the brief and respond.`,
            project_id: notificationProjectId,
            order_id: null,
            client_name: campaign.title,
            company_name: campaign.title,
            requirements_text: ""
          });
        }
      }
    }

    if (campaign.status === CampaignState.MATCHING) {
      await campaignService.transition(campaignId, CampaignEvent.SEND_INVITATION, actor);
    }

    const all = await invitationRepository.listForCampaign(campaignId);
    return all.filter((item) => creatorProfileIds.includes(item.creatorId)).map(serializeInvitation);
  }

  async accept(invitationId: string, user: AuthUser) {
    this.assertDb();
    PermissionService.assert(user, "creator.accept");

    const invitation = await invitationRepository.findById(invitationId);
    if (!invitation) throw appError("NOT_FOUND", "Invitation not found");
    if (invitation.creator.userId !== user.id && user.role.toUpperCase() !== "ADMIN") {
      throw appError("FORBIDDEN", "Not your invitation");
    }
    if (invitation.status !== "SENT" && invitation.status !== "VIEWED") {
      throw appError("CAMPAIGN_LOCKED", "Invitation already responded");
    }

    const legacyCreatorId = await resolveLegacyCreatorIdForProfile(invitation.creator);
    if (legacyCreatorId) {
      const result = await invitationPortalService.acceptForCreator(invitationId, legacyCreatorId);
      if (!result.ok) throwPortalInvitationError(result.error);
      const updated = await invitationRepository.findById(invitationId);
      if (!updated) throw appError("NOT_FOUND", "Invitation not found");
      return serializeInvitation(updated);
    }

    await invitationRepository.updateStatus(invitationId, "ACCEPTED");
    await notificationService.notify({
      userId: invitation.campaign.brandId,
      campaignId: invitation.campaignId,
      title: "Creator accepted your invitation",
      content: `${invitation.creator.displayName} accepted the invitation for "${invitation.campaign.title}". Review accepted creators and make the final selection.`,
      actionUrl: `${getAppBaseUrl()}/brand/projects/${resolveLegacyProjectId(invitation.campaign)}`,
      template: "invitation.accepted",
      priority: "HIGH",
      metadata: {
        creator: invitation.creator.displayName,
        project: invitation.campaign.title
      }
    });

    const updated = await invitationRepository.findById(invitationId);
    if (!updated) throw appError("NOT_FOUND", "Invitation not found");
    return serializeInvitation(updated);
  }

  async decline(invitationId: string, user: AuthUser, feedback: InvitationDeclineFeedback) {
    this.assertDb();
    PermissionService.assert(user, "creator.reject");

    const invitation = await invitationRepository.findById(invitationId);
    if (!invitation) throw appError("NOT_FOUND", "Invitation not found");
    if (invitation.creator.userId !== user.id && user.role.toUpperCase() !== "ADMIN") {
      throw appError("FORBIDDEN", "Not your invitation");
    }

    if (invitation.status !== "SENT" && invitation.status !== "VIEWED") {
      throw appError("CAMPAIGN_LOCKED", "Invitation already responded");
    }

    const legacyCreatorId = await resolveLegacyCreatorIdForProfile(invitation.creator);
    if (legacyCreatorId) {
      const result = await invitationPortalService.declineForCreator(invitationId, legacyCreatorId, "en", feedback);
      if (!result.ok) throwPortalInvitationError(result.error);
      const updated = await invitationRepository.findById(invitationId);
      if (!updated) throw appError("NOT_FOUND", "Invitation not found");
      return serializeInvitation(updated);
    }

    await invitationRepository.declineWithFeedback(invitationId, feedback);
    await notificationService.notify({
      userId: invitation.campaign.brandId,
      campaignId: invitation.campaignId,
      title: "Creator declined your invitation",
      content: `${invitation.creator.displayName} declined the invitation for "${invitation.campaign.title}". Reason: ${feedback.reason}.`,
      actionUrl: `${getAppBaseUrl()}/brand/projects/${resolveLegacyProjectId(invitation.campaign)}`,
      template: "invitation.declined",
      priority: "NORMAL",
      metadata: {
        creator: invitation.creator.displayName,
        project: invitation.campaign.title,
        rejectReason: feedback.reason
      }
    });
    const learningEvent = await aiLearningEventRepository.append({
      eventType: "CreatorRejected",
      entityType: "CreatorInvitation",
      entityId: invitationId,
      payload: {
        campaignId: invitation.campaignId,
        creatorProfileId: invitation.creatorId,
        creatorUserId: invitation.creator.userId,
        matchScore: Number(invitation.matchScore),
        feedback
      },
      learningType: "Preference",
      after: {
        creatorProfileId: invitation.creatorId,
        campaignId: invitation.campaignId,
        declineReason: feedback.reason,
        feedback
      },
      confidence: 0.75
    });
    if (learningEvent?.eventId) {
      await aiLearningWorkerService.processEvent(learningEvent.eventId);
    }

    const updated = await invitationRepository.findById(invitationId);
    if (!updated) throw appError("NOT_FOUND", "Invitation not found");
    return serializeInvitation(updated);
  }

  // Brand portal — legacy proj_* flow (Prisma primary, JSON fallback in store)
  ensureForProject(project: StoredProject, locale?: Locale) {
    return invitationPortalService.ensureForProject(project, locale);
  }

  listForLegacyProject(legacyProjectId: string) {
    return invitationPortalService.listForProject(legacyProjectId);
  }

  listAcceptedForLegacyProject(legacyProjectId: string) {
    return invitationPortalService.listAcceptedForProject(legacyProjectId);
  }

  listForLegacyCreator(legacyCreatorId: string) {
    return invitationPortalService.listForCreator(legacyCreatorId);
  }

  getPortalInvitationById(id: string) {
    return invitationPortalService.getById(id);
  }

  acceptForLegacyCreator(invitationId: string, legacyCreatorId: string, locale?: Locale) {
    return invitationPortalService.acceptForCreator(invitationId, legacyCreatorId, locale);
  }

  declineForLegacyCreator(
    invitationId: string,
    legacyCreatorId: string,
    locale: Locale | undefined,
    feedback: InvitationDeclineFeedback
  ) {
    return invitationPortalService.declineForCreator(invitationId, legacyCreatorId, locale, feedback);
  }

  selectCreatorForLegacyProject(input: {
    projectId: string;
    creatorId: string;
    client: { client_name: string; client_email: string; company_name: string };
    locale: Locale;
  }) {
    return campaignSelectionService.selectCreatorForLegacyProject(input);
  }
}

export const invitationService = new InvitationService();
