import type { Locale } from "@/lib/i18n";
import { activityService } from "@/features/campaign/activity.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { campaignService } from "@/features/campaign/campaign.service";
import { CampaignEvent, CampaignState } from "@/features/campaign/campaign.state-machine";
import type {
  BrandCampaignMemory,
  BrandProductionBrief
} from "@/features/campaign/brand-campaign/brand-campaign.types";
import {
  readCampaignMemory,
  readProductionBrief
} from "@/features/campaign/brand-campaign/brand-campaign.utils";
import { resolveCreatorProfileIdForLegacyId, resolveLegacyCreatorIdForProfile } from "@/features/matching/invitation-creator-bridge";
import {
  mapInvitationToStored,
  resolveLegacyProjectId
} from "@/features/matching/invitation.mapper";
import { invitationRepository } from "@/features/matching/invitation.repository";
import { notificationService } from "@/features/notification/notification.service";
import { userRepository } from "@/features/auth/user.repository";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { reviewBridgeService } from "@/features/review/review-bridge.service";
import { paymentRepository } from "@/features/payment/payment.repository";
import { aiLearningEventRepository } from "@/features/ai/ai-learning-event.repository";
import { aiLearningWorkerService } from "@/features/ai/ai-learning-worker.service";
import { EscrowState } from "@/features/shared/state-machines/escrow.state-machine";
import { getProject } from "@/lib/project-service";
import { setupBrandCheckout } from "@/lib/studioos/brand-checkout-service";
import { notifyCreatorsInvitationExpired } from "@/lib/studioos/commercial-interaction-notify";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import { isInvitationRecruitmentClosed } from "@/lib/studioos/invitation-lifecycle";

function selectedCreatorCopy(locale: Locale, brandName: string, projectTitle: string) {
  if (locale === "zh") {
    return {
      title: `🎉 恭喜，你已被品牌选中`,
      body: `「${projectTitle}」— 品牌已确认与你合作，项目表单已生成。现在可以进入审片中心上传 V1 初稿。`
    };
  }
  return {
    title: `${brandName} selected you for this project`,
    body: `"${projectTitle}" — the brand confirmed you as their creator. Your project is ready; open the review center and upload V1.`
  };
}

const SELECTION_ALLOWED_STATUSES = new Set<string>([
  CampaignState.MATCHING,
  CampaignState.INVITATION_SENT,
  CampaignState.CREATOR_ACCEPTED
]);

export class CampaignSelectionService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  async selectCreatorForLegacyProject(input: {
    projectId: string;
    creatorId: string;
    client: { client_name: string; client_email: string; company_name: string };
    locale: Locale;
  }): Promise<
    | { ok: true; invitation: StoredCreatorInvitation }
    | { ok: false; error: string }
  > {
    if (!this.isEnabled()) {
      return { ok: false, error: "project-not-found" };
    }

    const campaign = await campaignRepository.findByLegacyProjectIdWithRelations(input.projectId);
    if (!campaign) {
      return { ok: false, error: "project-not-found" };
    }

    const legacyProjectId = input.projectId;
    const memory = readCampaignMemory(campaign.campaignMemoryJson) as BrandCampaignMemory;
    const existingSelection = memory.selection;

    if (existingSelection) {
      if (existingSelection.legacy_creator_id === input.creatorId) {
        const invitation = await this.resolveStoredInvitation(
          campaign.id,
          input.creatorId,
          existingSelection
        );
        if (invitation) {
          return { ok: true, invitation };
        }
      }
      return { ok: false, error: "recruitment-closed" };
    }

    const creatorProfileId = await resolveCreatorProfileIdForLegacyId(input.creatorId);
    if (!creatorProfileId) {
      return { ok: false, error: "creator-not-accepted" };
    }

    const winnerRow = await invitationRepository.findByCampaignAndCreatorProfile(
      campaign.id,
      creatorProfileId
    );
    if (!winnerRow || winnerRow.status !== "ACCEPTED") {
      return { ok: false, error: "creator-not-accepted" };
    }

    const project = await getProject(legacyProjectId);
    const siblings = await invitationRepository.listForCampaign(campaign.id);
    const portalInvitations: StoredCreatorInvitation[] = [];
    for (const row of siblings) {
      const legacyCreatorId = await resolveLegacyCreatorIdForProfile(row.creator);
      if (!legacyCreatorId) continue;
      portalInvitations.push(mapInvitationToStored(row, legacyProjectId, legacyCreatorId));
    }

    if (isInvitationRecruitmentClosed(portalInvitations, legacyProjectId, project)) {
      return { ok: false, error: "recruitment-closed" };
    }

    if (!SELECTION_ALLOWED_STATUSES.has(campaign.status)) {
      return { ok: false, error: "recruitment-closed" };
    }

    const selectedAt = new Date().toISOString();
    const creatorUserId = winnerRow.creator.userId;
    const brief = readProductionBrief(campaign.productionBrief) as BrandProductionBrief;
    const updatedMemory: BrandCampaignMemory = {
      ...memory,
      selection: {
        legacy_creator_id: input.creatorId,
        invitation_id: winnerRow.id,
        creator_profile_id: creatorProfileId,
        creator_user_id: creatorUserId,
        selected_at: selectedAt,
        selected_by_email: input.client.client_email.toLowerCase()
      }
    };
    const updatedBrief: BrandProductionBrief = {
      ...brief,
      legacy_project_id: brief.legacy_project_id ?? legacyProjectId,
      studio_id: input.creatorId
    };

    const expiredCreatorIds = portalInvitations
      .filter((item) => item.creatorId !== input.creatorId && item.status !== "declined")
      .map((item) => item.creatorId);
    const topRecommended = [...portalInvitations]
      .filter((item) => item.status === "accepted")
      .sort((a, b) => b.matchScore - a.matchScore)[0];
    const selectedMatchScore = Number(winnerRow.matchScore ?? 0);
    const selectedNonRecommended = Boolean(
      topRecommended && topRecommended.creatorId !== input.creatorId
    );

    await invitationRepository.expireNonWinners(campaign.id, winnerRow.id);

    if (project && expiredCreatorIds.length) {
      await notifyCreatorsInvitationExpired({
        project,
        locale: input.locale,
        expiredCreatorIds
      }).catch(() => undefined);
    }

    if (
      campaign.status === CampaignState.MATCHING ||
      campaign.status === CampaignState.INVITATION_SENT
    ) {
      const brandUser = await userRepository.findByEmail(input.client.client_email.toLowerCase());
      await campaignService.transition(
        campaign.id,
        CampaignEvent.CREATOR_ACCEPT,
        brandUser ? { id: brandUser.id, role: brandUser.role } : undefined
      );
    }

    await campaignRepository.selectCreator({
      campaignId: campaign.id,
      creatorUserId,
      productionBrief: updatedBrief,
      campaignMemoryJson: updatedMemory
    });

    await activityService.write(
      campaign.id,
      "invitation.creator_selected",
      {
        userId: campaign.brandId,
        email: input.client.client_email.toLowerCase(),
        role: "brand"
      },
      {
        legacy_project_id: legacyProjectId,
        invitation_id: winnerRow.id,
        legacy_creator_id: input.creatorId,
        creator_profile_id: creatorProfileId,
        creator_user_id: creatorUserId
      }
    );
    const selectionLearningEvent = await aiLearningEventRepository.append({
      eventType: selectedNonRecommended ? "BrandSelectedNonRecommendedCreator" : "BrandSelectedCreator",
      entityType: "Campaign",
      entityId: campaign.id,
      payload: {
        legacy_project_id: legacyProjectId,
        campaignId: campaign.id,
        selected_legacy_creator_id: input.creatorId,
        selected_creator_profile_id: creatorProfileId,
        selected_creator_user_id: creatorUserId,
        selected_match_score: selectedMatchScore,
        recommended_legacy_creator_id: topRecommended?.creatorId ?? input.creatorId,
        recommended_match_score: topRecommended?.matchScore ?? selectedMatchScore,
        accepted_creator_count: portalInvitations.filter((item) => item.status === "accepted").length
      },
      learningType: "Preference",
      after: {
        selected_legacy_creator_id: input.creatorId,
        selected_creator_profile_id: creatorProfileId,
        selected_non_recommended: selectedNonRecommended,
        recommended_legacy_creator_id: topRecommended?.creatorId ?? input.creatorId
      },
      confidence: selectedNonRecommended ? 0.85 : 0.8
    });
    if (selectionLearningEvent?.eventId) {
      await aiLearningWorkerService.processEvent(selectionLearningEvent.eventId);
    }

    const brandName = input.client.company_name || input.client.client_name || "Brand";
    const projectTitle =
      project?.title || project?.product_name || campaign.title || brandName;
    const copy = selectedCreatorCopy(input.locale, brandName, projectTitle);

    const legacyProject = await getProject(legacyProjectId);
    let studioActionUrl = "/studio/projects";
    let checkoutOrder: Awaited<ReturnType<typeof setupBrandCheckout>>["order"] | null = null;
    if (legacyProject) {
      const checkout = await setupBrandCheckout({
        project: legacyProject,
        creatorId: input.creatorId,
        workId: null,
        client: input.client,
        locale: input.locale
      }).catch(() => null);
      if (checkout?.order.id) {
        checkoutOrder = checkout.order;
        studioActionUrl = `/studio/review/${checkout.order.id}`;
      }
    }

    if (legacyProject) {
      const { notifyCreatorProjectSelected } = await import("@/lib/studioos/creator-assignment-notify");
      await notifyCreatorProjectSelected({
        creatorId: input.creatorId,
        project: legacyProject,
        order: checkoutOrder,
        locale: input.locale
      }).catch(() => undefined);
    }

    await notificationService
      .notify({
        userId: creatorUserId,
        campaignId: campaign.id,
        title: copy.title,
        content: copy.body,
        actionUrl: studioActionUrl,
        template: "collaboration.selected",
        priority: "HIGH",
        email: false
      })
      .catch(() => undefined);

    await reviewBridgeService.syncLegacyOrderStatusAfterSelection(campaign.id, input.creatorId);

    const refreshedCampaign = await campaignRepository.findById(campaign.id);
    const escrow = await paymentRepository.findByCampaignId(campaign.id);
    const brandUser = await userRepository.findByEmail(input.client.client_email.toLowerCase());
    const actor = brandUser ? { id: brandUser.id, role: brandUser.role } : undefined;

    if (
      refreshedCampaign?.status === CampaignState.CREATOR_ACCEPTED &&
      escrow &&
      (escrow.status === EscrowState.HELD || escrow.status === EscrowState.PARTIAL_RELEASE)
    ) {
      await campaignService
        .transition(campaign.id, CampaignEvent.START_PRODUCTION, actor)
        .catch(() => undefined);
    }

    const invitation = mapInvitationToStored(
      winnerRow,
      legacyProjectId,
      input.creatorId,
      updatedMemory.selection
    );
    return { ok: true, invitation };
  }

  private async resolveStoredInvitation(
    _campaignId: string,
    legacyCreatorId: string,
    selection: NonNullable<BrandCampaignMemory["selection"]>
  ): Promise<StoredCreatorInvitation | null> {
    const row = await invitationRepository.findById(selection.invitation_id);
    if (!row) return null;
    const legacyProjectId = resolveLegacyProjectId(row.campaign);
    return mapInvitationToStored(row, legacyProjectId, legacyCreatorId, selection);
  }
}

export const campaignSelectionService = new CampaignSelectionService();
