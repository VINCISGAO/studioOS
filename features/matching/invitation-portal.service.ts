import type { Locale } from "@/lib/i18n";
import type { StoredProject } from "@/lib/project-types";
import { activityService } from "@/features/campaign/activity.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { resolveCreatorProfileIdForLegacyId, resolveLegacyCreatorIdForProfile } from "@/features/matching/invitation-creator-bridge";
import {
  mapInvitationToPortalView,
  mapInvitationToStored,
  prismaInvitationStatusToPortal,
  resolveLegacyProjectId
} from "@/features/matching/invitation.mapper";
import { invitationRepository } from "@/features/matching/invitation.repository";
import { notificationService } from "@/features/notification/notification.service";
import { userRepository } from "@/features/auth/user.repository";
import { listCreatorsForMatching } from "@/lib/creator-service";
import { creators } from "@/lib/data";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { getProject } from "@/lib/project-service";
import { matchCreatorsForProjectWithDemoFallback } from "@/lib/matching-engine";
import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import type { BrandCampaignMemory } from "@/features/campaign/brand-campaign/brand-campaign.types";
import { readCampaignMemory } from "@/features/campaign/brand-campaign/brand-campaign.utils";
import {
  isInvitationRecruitmentClosed,
  MAX_CAMPAIGN_INVITATIONS
} from "@/lib/studioos/invitation-lifecycle";
import { getWorksForCreator } from "@/lib/works-catalog";

function resolveCreatorName(creatorId: string): string {
  return creators.find((item) => item.id === creatorId)?.name ?? creatorId;
}

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

    const enrichedCreators = await listCreatorsForMatching();
    const allWorks = (
      await Promise.all(enrichedCreators.map((creator) => getWorksForCreator(creator.id)))
    ).flat();
    const matches = matchCreatorsForProjectWithDemoFallback(project, enrichedCreators, allWorks).slice(
      0,
      MAX_CAMPAIGN_INVITATIONS
    );

    const brandName = project.company_name || project.client_name || "Brand";
    const projectTitle = project.title || project.product_name || brandName;

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
    }

    if (campaign.status === "MATCHING") {
      await campaignRepository.updateBrandCampaign(campaign.id, {
        status: "INVITATION_SENT"
      });
    }

    return mapRowsForCampaign(campaign.id);
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

    await invitationRepository.updateStatus(invitationId, "ACCEPTED");

    if (row.campaign.status === "MATCHING") {
      await campaignRepository.updateBrandCampaign(row.campaignId, {
        status: "INVITATION_SENT"
      });
    }

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
      const creatorName = resolveCreatorName(legacyCreatorId);
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

    const updated = await this.getById(invitationId);
    if (!updated) return { ok: false, error: "not-found" };
    return { ok: true, invitation: updated };
  }

  async declineForCreator(
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

    await invitationRepository.updateStatus(invitationId, "DECLINED");

    await activityService.write(
      row.campaignId,
      "invitation.declined",
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
      const creatorName = resolveCreatorName(legacyCreatorId);
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
