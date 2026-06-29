import { invitationRepository } from "@/features/matching/invitation.repository";
import { matchingService } from "@/features/matching/matching.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { campaignService } from "@/features/campaign/campaign.service";
import { CampaignEvent, CampaignState } from "@/features/campaign/campaign.state-machine";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

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

export class InvitationService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  async list(campaignId: string, user: AuthUser) {
    this.assertDb();
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    if (!PermissionService.canAccessCampaign(user, campaign) && user.role.toUpperCase() !== "CREATOR") {
      throw appError("FORBIDDEN", "Not allowed");
    }
    const items = await invitationRepository.listForCampaign(campaignId);
    return items.map(serializeInvitation);
  }

  async send(campaignId: string, user: AuthUser, creatorProfileIds: string[]) {
    this.assertDb();
    PermissionService.assert(user, "campaign.update");

    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    if (!PermissionService.canAccessCampaign(user, campaign)) {
      throw appError("FORBIDDEN", "Not allowed for this campaign");
    }

    if (!["MATCHING", "INVITATION_SENT"].includes(campaign.status)) {
      throw appError("INVALID_TRANSITION", "Campaign must be in matching phase");
    }

    const matches = await matchingService.matchCreatorsForCampaign(campaignId, user, 20);
    const matchMap = new Map(matches.map((m) => [m.creatorProfileId, m.matchScore]));
    const actor = { id: user.id, role: user.role };

    for (const creatorProfileId of creatorProfileIds) {
      const existing = await invitationRepository.findExisting(campaignId, creatorProfileId);
      if (existing) continue;

      const profile = await prisma.creatorProfile.findUnique({ where: { id: creatorProfileId } });
      if (!profile) throw appError("NOT_FOUND", `Creator ${creatorProfileId} not found`);

      await invitationRepository.create({
        campaignId,
        creatorProfileId,
        matchScore: matchMap.get(creatorProfileId) ?? 50
      });
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

    const actor = { id: user.id, role: user.role };
    await campaignService.transition(invitation.campaignId, CampaignEvent.CREATOR_ACCEPT, actor);
    await campaignRepository.setCreator(invitation.campaignId, invitation.creator.userId);
    await invitationRepository.updateStatus(invitationId, "ACCEPTED");
    await invitationRepository.declineOthers(invitation.campaignId, invitationId);

    const updated = await invitationRepository.findById(invitationId);
    if (!updated) throw appError("NOT_FOUND", "Invitation not found");
    return serializeInvitation(updated);
  }

  async decline(invitationId: string, user: AuthUser) {
    this.assertDb();
    PermissionService.assert(user, "creator.reject");

    const invitation = await invitationRepository.findById(invitationId);
    if (!invitation) throw appError("NOT_FOUND", "Invitation not found");
    if (invitation.creator.userId !== user.id && user.role.toUpperCase() !== "ADMIN") {
      throw appError("FORBIDDEN", "Not your invitation");
    }

    await invitationRepository.updateStatus(invitationId, "DECLINED");
    return serializeInvitation(invitation);
  }
}

export const invitationService = new InvitationService();
