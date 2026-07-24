import type { Locale } from "@/lib/i18n";
import type { StoredProject } from "@/lib/project-types";
import { activityService } from "@/features/campaign/activity.service";
import { aiLearningEventRepository } from "@/features/ai/ai-learning-event.repository";
import { aiLearningWorkerService } from "@/features/ai/ai-learning-worker.service";
import { buildCreatorLearningMemoryMap } from "@/features/ai/creator-matching-memory.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { campaignService } from "@/features/campaign/campaign.service";
import { CampaignEvent } from "@/features/campaign/campaign.state-machine";
import { resolveCreatorProfileIdForLegacyId, resolveLegacyCreatorIdForProfile } from "@/features/matching/invitation-creator-bridge";
import {
  mapInvitationToPortalView,
  mapInvitationToStored,
  prismaInvitationStatusToPortal,
  resolveLegacyProjectId
} from "@/features/matching/invitation.mapper";
import { InvitationEvent } from "@/features/shared/state-machines/invitation.state-machine";
import { invitationRepository } from "@/features/matching/invitation.repository";
import { notificationService } from "@/features/notification/notification.service";
import { userRepository } from "@/features/auth/user.repository";
import { assertCreatorEligibility } from "@/features/creator/creator-eligibility.service";
import { listCreatorsForMatching } from "@/lib/creator-service";
import { creators } from "@/lib/data";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { getProject } from "@/lib/project-service";
import { createCreatorNotification, findNotificationByProject } from "@/lib/notification-service";
import { matchCreatorsForProject } from "@/lib/matching-engine";
import { getConfirmedBriefText } from "@/lib/studioos/confirmed-brief";
import { resolveCreatorDisplayName } from "@/lib/studioos/creator-display-name.server";
import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";
import type { InvitationDeclineFeedback } from "@/features/matching/invitation-decline-feedback";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import type { BrandCampaignMemory } from "@/features/campaign/brand-campaign/brand-campaign.types";
import { brandCampaignRepository } from "@/features/campaign/brand-campaign/brand-campaign.repository";
import { readCampaignMemory } from "@/features/campaign/brand-campaign/brand-campaign.utils";
import {
  isInvitationRecruitmentClosed,
  MAX_CAMPAIGN_INVITATIONS
} from "@/lib/studioos/invitation-lifecycle";
import { getWorksForCreator } from "@/lib/works-catalog-core";
import { getOrderForProject } from "@/lib/order-service";
import { isBrandProjectFunded } from "@/lib/studioos/brand-payment-funding";

function invitationMatchCopy(locale: Locale, brandName: string, projectTitle: string) {
  if (locale === "zh") {
    return {
      title: "你收到一个新的合作邀请",
      body: `${brandName} 邀请你参与「${projectTitle}」。接受邀请表示你有合作意向，最终是否合作由品牌方决定。`
    };
  }
  return {
    title: "You received a new collaboration invitation",
    body: `${brandName} invited you to "${projectTitle}". Accepting shows interest — the brand makes the final selection.`
  };
}

function brandResponseCopy(
  locale: Locale,
  action: "accepted" | "declined",
  creatorName: string,
  projectTitle: string
) {
  if (locale === "zh") {
    if (action === "accepted") {
      return {
        title: `${creatorName} 接受了合作邀请`,
        body: `「${projectTitle}」— ${creatorName} 已进入候选名单，你可以在匹配页最终选定 1 位 Creator。`
      };
    }
    return {
      title: `${creatorName} 拒绝了意向发单`,
      body: `「${projectTitle}」— ${creatorName} 已拒绝本次邀请。`
    };
  }

  if (action === "accepted") {
    return {
      title: `${creatorName} accepted your invitation`,
      body: `"${projectTitle}" — ${creatorName} is in your shortlist. Select them from the match tab when ready.`
    };
  }
  return {
    title: `${creatorName} declined your invitation`,
    body: `"${projectTitle}" — ${creatorName} declined this invitation.`
  };
}

async function mapRowsForCampaign(campaignId: string): Promise<StoredCreatorInvitation[]> {
  const rows = await invitationRepository.listForCampaign(campaignId);
  const campaignRow = rows[0]?.campaign ?? (await campaignRepository.findById(campaignId));
  const memory = campaignRow
    ? (readCampaignMemory(campaignRow.campaignMemoryJson) as BrandCampaignMemory)
    : {};
  const selection = memory.selection;
  const mapped: StoredCreatorInvitation[] = [];

  for (const row of rows) {
    const legacyProjectId = resolveLegacyProjectId(row.campaign);
    const legacyCreatorId = await resolveLegacyCreatorIdForProfile(row.creator);
    if (!legacyCreatorId) continue;
    mapped.push(mapInvitationToStored(row, legacyProjectId, legacyCreatorId, selection));
  }

  return mapped;
}

async function mapRowsForCreator(creatorProfileId: string): Promise<StoredCreatorInvitation[]> {
  const rows = await invitationRepository.listForCreatorProfile(creatorProfileId);
  const mapped: StoredCreatorInvitation[] = [];

  for (const row of rows) {
    const legacyProjectId = resolveLegacyProjectId(row.campaign);
    const legacyCreatorId = await resolveLegacyCreatorIdForProfile(row.creator);
    if (!legacyCreatorId) continue;
    const memory = readCampaignMemory(row.campaign.campaignMemoryJson) as BrandCampaignMemory;
    mapped.push(mapInvitationToStored(row, legacyProjectId, legacyCreatorId, memory.selection));
  }

  return mapped;
}

export class InvitationPortalService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  private async requireCampaignForProject(project: StoredProject) {
    const campaign = await campaignRepository.findByLegacyProjectIdWithRelations(project.id);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    return campaign;
  }

  async ensureForProject(project: StoredProject, locale: Locale = "en"): Promise<StoredCreatorInvitation[]> {
    if (!this.isEnabled()) return [];

    const campaign = await this.requireCampaignForProject(project);
    const existing = await mapRowsForCampaign(campaign.id);
    if (existing.length > 0) {
      return existing;
    }
    const escrowOrder = await getOrderForProject(project.id);
    if (!(await isBrandProjectFunded(project.id, escrowOrder))) {
      return [];
    }

    const enrichedCreators = await listCreatorsForMatching();
    const allWorks = (
      await Promise.all(enrichedCreators.map((creator) => getWorksForCreator(creator.id)))
    ).flat();
    const creatorLearningMemory = await buildCreatorLearningMemoryMap(enrichedCreators.map((creator) => creator.id));
    const matches = matchCreatorsForProject(project, enrichedCreators, allWorks, {
      creatorLearningMemory,
      includeColdStartRegisteredCreators: true
    }).slice(
      0,
      MAX_CAMPAIGN_INVITATIONS
    );

    const brandName = project.company_name || project.client_name || "Brand";
    const projectTitle = project.title || project.product_name || brandName;
    const requirementsText = getConfirmedBriefText(project, locale);
    let createdCount = 0;

    for (const match of matches) {
      const creatorProfileId = await resolveCreatorProfileIdForLegacyId(match.creator_id);
      if (!creatorProfileId) continue;

      const duplicate = await invitationRepository.findExisting(campaign.id, creatorProfileId);
      if (duplicate) continue;

      const created = await invitationRepository.create({
        campaignId: campaign.id,
        creatorProfileId,
        matchScore: match.score
      });
      createdCount += 1;

      await activityService.write(
        campaign.id,
        "invitation.sent",
        { userId: campaign.brandId, email: project.client_email, role: "brand" },
        {
          legacy_project_id: project.id,
          creator_profile_id: creatorProfileId,
          legacy_creator_id: match.creator_id
        }
      );

      const creatorUserId = created.creator.userId;
      const copy = invitationMatchCopy(locale, brandName, projectTitle);
      await notificationService.notify({
        userId: creatorUserId,
        campaignId: campaign.id,
        title: copy.title,
        content: copy.body,
        actionUrl: "/studio/invitations",
        email: false
      }).catch(() => undefined);

      const existingCreatorNotification = await findNotificationByProject(
        match.creator_id,
        project.id,
        "invitation_match"
      );
      if (!existingCreatorNotification) {
        await createCreatorNotification({
          creator_id: match.creator_id,
          type: "invitation_match",
          title: copy.title,
          body: copy.body,
          project_id: project.id,
          order_id: null,
          client_name: brandName,
          company_name: brandName,
          requirements_text: requirementsText
        }).catch(() => undefined);
      }
    }

    if (createdCount > 0 && campaign.status === "MATCHING") {
      await campaignService.transition(campaign.id, CampaignEvent.SEND_INVITATION, {
        id: campaign.brandId,
        role: "BRAND"
      });
    }

    return mapRowsForCampaign(campaign.id);
  }

  async rerollForProject(
    legacyProjectId: string,
    locale: Locale = "en"
  ): Promise<
    | { ok: true; invitations: StoredCreatorInvitation[]; rerollCount: number }
    | { ok: false; error: string; refundAvailable?: boolean; rerollCount?: number }
  > {
    if (!this.isEnabled()) return { ok: false, error: "not-found" };

    const project = await getProject(legacyProjectId);
    if (!project) return { ok: false, error: "project-not-found" };

    const campaign = await this.requireCampaignForProject(project);
    const memory = readCampaignMemory(campaign.campaignMemoryJson) as BrandCampaignMemory & {
      matching?: { reroll_count?: number };
    };
    const rerollCount = memory.matching?.reroll_count ?? 0;
    if (rerollCount >= 3) {
      await aiLearningEventRepository.append({
        eventType: "CreatorRerollLimitReached",
        entityType: "Campaign",
        entityId: campaign.id,
        payload: {
          campaignId: campaign.id,
          legacy_project_id: legacyProjectId,
          reroll_count: rerollCount,
          refund_available: true
        },
        learningType: "matching_reroll",
        after: { refund_available: true, reroll_count: rerollCount },
        confidence: 0.9
      });
      await aiLearningEventRepository.append({
        eventType: "BrandRefundOptionShown",
        entityType: "Campaign",
        entityId: campaign.id,
        payload: {
          campaignId: campaign.id,
          legacy_project_id: legacyProjectId,
          reason: "reroll_limit",
          reroll_count: rerollCount
        },
        learningType: "matching_refund_option",
        after: {
          refund_available: true,
          reason: "reroll_limit"
        },
        confidence: 0.85
      });
      return { ok: false, error: "reroll-limit", refundAvailable: true, rerollCount };
    }

    const escrowOrder = await getOrderForProject(project.id);
    if (!(await isBrandProjectFunded(project.id, escrowOrder))) {
      return { ok: false, error: "payment-required" };
    }

    const existingRows = await invitationRepository.listForCampaign(campaign.id);
    const previouslyInvitedProfileIds = new Set(existingRows.map((row) => row.creatorId));
    await invitationRepository.expireOpenBatch(campaign.id);

    const enrichedCreators = await listCreatorsForMatching();
    const allWorks = (
      await Promise.all(enrichedCreators.map((creator) => getWorksForCreator(creator.id)))
    ).flat();
    const creatorLearningMemory = await buildCreatorLearningMemoryMap(enrichedCreators.map((creator) => creator.id));
    const matches = matchCreatorsForProject(project, enrichedCreators, allWorks, {
      creatorLearningMemory,
      includeColdStartRegisteredCreators: true
    });

    const brandName = project.company_name || project.client_name || "Brand";
    const projectTitle = project.title || project.product_name || brandName;
    const requirementsText = getConfirmedBriefText(project, locale);
    let createdCount = 0;

    for (const match of matches) {
      if (createdCount >= MAX_CAMPAIGN_INVITATIONS) break;
      const creatorProfileId = await resolveCreatorProfileIdForLegacyId(match.creator_id);
      if (!creatorProfileId || previouslyInvitedProfileIds.has(creatorProfileId)) continue;

      const created = await invitationRepository.create({
        campaignId: campaign.id,
        creatorProfileId,
        matchScore: match.score
      });
      createdCount += 1;

      await activityService.write(
        campaign.id,
        "invitation.rerolled",
        { userId: campaign.brandId, email: project.client_email, role: "brand" },
        {
          legacy_project_id: project.id,
          reroll_count: rerollCount + 1,
          creator_profile_id: creatorProfileId,
          legacy_creator_id: match.creator_id
        }
      );

      const copy = invitationMatchCopy(locale, brandName, projectTitle);
      await notificationService.notify({
        userId: created.creator.userId,
        campaignId: campaign.id,
        title: copy.title,
        content: copy.body,
        actionUrl: "/studio/invitations",
        email: false
      }).catch(() => undefined);

      const existingCreatorNotification = await findNotificationByProject(
        match.creator_id,
        project.id,
        "invitation_match"
      );
      if (!existingCreatorNotification) {
        await createCreatorNotification({
          creator_id: match.creator_id,
          type: "invitation_match",
          title: copy.title,
          body: copy.body,
          project_id: project.id,
          order_id: null,
          client_name: brandName,
          company_name: brandName,
          requirements_text: requirementsText
        }).catch(() => undefined);
      }
    }

    const nextRerollCount = rerollCount + 1;
    await brandCampaignRepository.updateCampaign(campaign.id, {
      campaignMemoryJson: {
        ...memory,
        matching: {
          ...(memory.matching ?? {}),
          reroll_count: nextRerollCount,
          last_reroll_at: new Date().toISOString()
        }
      } as BrandCampaignMemory
    });
    await aiLearningEventRepository.append({
      eventType: "BrandRequestedCreatorReroll",
      entityType: "Campaign",
      entityId: campaign.id,
      payload: {
        campaignId: campaign.id,
        legacy_project_id: legacyProjectId,
        reroll_count: nextRerollCount,
        created_count: createdCount
      },
      learningType: "matching_reroll",
      after: {
        reroll_count: nextRerollCount,
        created_count: createdCount,
        refund_available: nextRerollCount >= 3 && createdCount === 0
      },
      confidence: 0.85
    });

    if (createdCount === 0 && nextRerollCount >= 3) {
      await aiLearningEventRepository.append({
        eventType: "BrandRefundOptionShown",
        entityType: "Campaign",
        entityId: campaign.id,
        payload: {
          campaignId: campaign.id,
          legacy_project_id: legacyProjectId,
          reason: "no_more_creators",
          reroll_count: nextRerollCount
        },
        learningType: "matching_refund_option",
        after: {
          refund_available: true,
          reason: "no_more_creators"
        },
        confidence: 0.85
      });
      return { ok: false, error: "no-more-creators", refundAvailable: true, rerollCount: nextRerollCount };
    }

    return {
      ok: true,
      invitations: await mapRowsForCampaign(campaign.id),
      rerollCount: nextRerollCount
    };
  }

  async listForProject(legacyProjectId: string): Promise<StoredCreatorInvitation[]> {
    if (!this.isEnabled()) return [];
    const campaign = await campaignRepository.findByLegacyProjectId(legacyProjectId);
    if (!campaign) return [];
    return mapRowsForCampaign(campaign.id);
  }

  async listAcceptedForProject(legacyProjectId: string): Promise<StoredCreatorInvitation[]> {
    const items = await this.listForProject(legacyProjectId);
    return items.filter((item) => item.status === "accepted");
  }

  async listForCreator(legacyCreatorId: string): Promise<CreatorPortalInvitationView[]> {
    if (!this.isEnabled()) return [];
    const creatorProfileId = await resolveCreatorProfileIdForLegacyId(legacyCreatorId);
    if (!creatorProfileId) return [];
    const stored = await mapRowsForCreator(creatorProfileId);
    return stored.map(mapInvitationToPortalView);
  }

  async getById(id: string): Promise<StoredCreatorInvitation | null> {
    if (!this.isEnabled()) return null;
    const row = await invitationRepository.findById(id);
    if (!row) return null;
    const legacyProjectId = resolveLegacyProjectId(row.campaign);
    const legacyCreatorId = await resolveLegacyCreatorIdForProfile(row.creator);
    if (!legacyCreatorId) return null;
    const memory = readCampaignMemory(row.campaign.campaignMemoryJson) as BrandCampaignMemory;
    return mapInvitationToStored(row, legacyProjectId, legacyCreatorId, memory.selection);
  }

  async acceptForCreator(
    invitationId: string,
    legacyCreatorId: string,
    locale: Locale = "en"
  ): Promise<{ ok: true; invitation: StoredCreatorInvitation } | { ok: false; error: string }> {
    if (!this.isEnabled()) {
      return { ok: false, error: "not-found" };
    }

    const creatorProfileId = await resolveCreatorProfileIdForLegacyId(legacyCreatorId);
    if (!creatorProfileId) {
      return { ok: false, error: "not-found" };
    }

    const row = await invitationRepository.findById(invitationId);
    if (!row || row.creatorId !== creatorProfileId) {
      return { ok: false, error: "not-found" };
    }

    if (row.status === "ACCEPTED") {
      const existing = await this.getById(invitationId);
      if (existing) {
        return { ok: true, invitation: existing };
      }
      return { ok: false, error: "not-found" };
    }

    const portalStatus = prismaInvitationStatusToPortal(row.status);
    if (portalStatus !== "pending") {
      return { ok: false, error: "not-pending" };
    }

    const legacyProjectId = resolveLegacyProjectId(row.campaign);
    const project = await getProject(legacyProjectId);
    const siblings = await mapRowsForCampaign(row.campaignId);
    if (isInvitationRecruitmentClosed(siblings, legacyProjectId, project)) {
      return { ok: false, error: "recruitment-closed" };
    }

    try {
      await assertCreatorEligibility(creatorProfileId, "canAcceptProject");
    } catch {
      return { ok: false, error: "not-eligible" };
    }

    await invitationRepository.transitionInvitation(invitationId, InvitationEvent.ACCEPT);
    await aiLearningEventRepository.append({
      eventType: "CreatorAccepted",
      entityType: "CreatorInvitation",
      entityId: invitationId,
      payload: {
        legacy_project_id: legacyProjectId,
        campaignId: row.campaignId,
        legacy_creator_id: legacyCreatorId,
        creatorProfileId,
        creatorUserId: row.creator.userId,
        matchScore: Number(row.matchScore)
      },
      learningType: "Preference",
      after: {
        legacy_creator_id: legacyCreatorId,
        creatorProfileId,
        campaignId: row.campaignId,
        accepted: true,
        project_created: false
      },
      confidence: 0.8
    });

    await activityService.write(
      row.campaignId,
      "invitation.accepted",
      { userId: row.creator.userId, email: row.creator.user.email, role: "creator" },
      {
        legacy_project_id: legacyProjectId,
        invitation_id: invitationId,
        legacy_creator_id: legacyCreatorId
      }
    );

    const brandEmail = project?.client_email ?? row.campaign.brand?.email ?? "";
    const brandUser = brandEmail ? await userRepository.findByEmail(brandEmail.toLowerCase()) : null;
    if (brandUser) {
      const creatorName = await resolveCreatorDisplayName(legacyCreatorId, {
        hint: row.creator.displayName,
        locale
      });
      const projectTitle =
        project?.title || project?.product_name || row.campaign.title || row.campaign.brand?.fullName || "";
      const copy = brandResponseCopy(locale, "accepted", creatorName, projectTitle);
      await notificationService
        .notify({
          userId: brandUser.id,
          campaignId: row.campaignId,
          title: copy.title,
          content: copy.body,
          actionUrl: `/brand/projects/${legacyProjectId}?tab=match`,
          email: false
        })
        .catch(() => undefined);
    }

    const updatedInvitation = await this.getById(invitationId);
    if (updatedInvitation) {
      const { notifyBrandInvitationResponse } = await import("@/lib/studioos/campaign-invitation-notify");
      await notifyBrandInvitationResponse({
        invitation: updatedInvitation,
        project,
        action: "accepted",
        locale
      }).catch(() => undefined);
    }

    const updated = updatedInvitation ?? (await this.getById(invitationId));
    if (!updated) return { ok: false, error: "not-found" };
    return { ok: true, invitation: updated };
  }

  async declineForCreator(
    invitationId: string,
    legacyCreatorId: string,
    locale: Locale = "en",
    feedback: InvitationDeclineFeedback
  ): Promise<{ ok: true; invitation: StoredCreatorInvitation } | { ok: false; error: string }> {
    if (!this.isEnabled()) {
      return { ok: false, error: "not-found" };
    }

    const creatorProfileId = await resolveCreatorProfileIdForLegacyId(legacyCreatorId);
    if (!creatorProfileId) {
      return { ok: false, error: "not-found" };
    }

    const row = await invitationRepository.findById(invitationId);
    if (!row || row.creatorId !== creatorProfileId) {
      return { ok: false, error: "not-found" };
    }

    const portalStatus = prismaInvitationStatusToPortal(row.status);
    if (portalStatus !== "pending") {
      return { ok: false, error: "not-pending" };
    }

    const legacyProjectId = resolveLegacyProjectId(row.campaign);
    const project = await getProject(legacyProjectId);
    const siblings = await mapRowsForCampaign(row.campaignId);
    if (isInvitationRecruitmentClosed(siblings, legacyProjectId, project)) {
      return { ok: false, error: "recruitment-closed" };
    }

    await invitationRepository.declineWithFeedback(invitationId, feedback);
    const learningEvent = await aiLearningEventRepository.append({
      eventType: "CreatorRejected",
      entityType: "CreatorInvitation",
      entityId: invitationId,
      payload: {
        legacy_project_id: legacyProjectId,
        campaignId: row.campaignId,
        legacy_creator_id: legacyCreatorId,
        creatorProfileId,
        creatorUserId: row.creator.userId,
        matchScore: Number(row.matchScore),
        feedback
      },
      learningType: "Preference",
      after: {
        legacy_creator_id: legacyCreatorId,
        creatorProfileId,
        campaignId: row.campaignId,
        declineReason: feedback.reason,
        feedback
      },
      confidence: 0.75
    });
    if (learningEvent?.eventId) {
      await aiLearningWorkerService.processEvent(learningEvent.eventId);
    }

    await activityService.write(
      row.campaignId,
      "invitation.declined",
      { userId: row.creator.userId, email: row.creator.user.email, role: "creator" },
      {
        legacy_project_id: legacyProjectId,
        invitation_id: invitationId,
        legacy_creator_id: legacyCreatorId,
        decline_reason: feedback.reason,
        decline_feedback: feedback
      }
    );

    const brandEmail = project?.client_email ?? row.campaign.brand?.email ?? "";
    const brandUser = brandEmail ? await userRepository.findByEmail(brandEmail.toLowerCase()) : null;
    if (brandUser) {
      const creatorName = await resolveCreatorDisplayName(legacyCreatorId, {
        hint: row.creator.displayName,
        locale
      });
      const projectTitle =
        project?.title || project?.product_name || row.campaign.title || row.campaign.brand?.fullName || "";
      const copy = brandResponseCopy(locale, "declined", creatorName, projectTitle);
      await notificationService
        .notify({
          userId: brandUser.id,
          campaignId: row.campaignId,
          title: copy.title,
          content: copy.body,
          actionUrl: `/brand/projects/${legacyProjectId}?tab=match`,
          email: false
        })
        .catch(() => undefined);
    }

    const updated = await this.getById(invitationId);
    if (!updated) return { ok: false, error: "not-found" };
    return { ok: true, invitation: updated };
  }
}

export const invitationPortalService = new InvitationPortalService();
