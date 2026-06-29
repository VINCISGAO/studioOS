import type { CommunicationSourceType } from "@prisma/client";
import { communicationService } from "@/features/communication/communication.service";
import { campaignBridgeService } from "@/features/campaign/campaign-bridge.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { prisma } from "@/lib/core/database/prisma";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

/** Platform-wide text localization — any text entering StudioOS gets AI Communication treatment. */
export class PlatformLocalizationService {
  async localizeText(input: {
    content: string;
    sourceType: CommunicationSourceType;
    sourceRefId?: string;
    campaignId?: string;
    senderId: string;
    viewerUserId: string;
    receiverId?: string;
    context?: string;
    senderRole?: string;
  }) {
    if (!hasDatabaseUrl() || !input.content.trim()) {
      return { displayContent: input.content, autoLocalized: false };
    }

    const localized = await communicationService.getLocalizedContentForSource({
      sourceType: input.sourceType,
      sourceRefId: input.sourceRefId ?? `ephemeral_${input.sourceType}_${input.senderId}_${Date.now()}`,
      originalContent: input.content,
      viewerUserId: input.viewerUserId,
      campaignId: input.campaignId,
      senderId: input.senderId,
      receiverId: input.receiverId,
      context: input.context,
      senderRole: input.senderRole
    });

    return {
      messageId: localized.id,
      displayContent: localized.displayContent,
      originalContent: localized.originalContent,
      summary: localized.summary,
      todos: localized.todos,
      autoLocalized: localized.autoLocalized
    };
  }

  async localizeCampaignBrief(campaignId: string, viewerUserId: string) {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign?.description) return null;

    return this.localizeText({
      content: campaign.description,
      sourceType: "CAMPAIGN_BRIEF",
      sourceRefId: `${campaignId}:brief`,
      campaignId,
      senderId: campaign.brandId,
      viewerUserId,
      receiverId: campaign.creatorId ?? undefined,
      context: "campaign brief / requirements",
      senderRole: "BRAND"
    });
  }

  async localizeReviewComment(input: {
    commentId: string;
    campaignId: string;
    versionId: string;
    authorId: string;
    viewerUserId: string;
    originalContent: string;
  }) {
    const campaign = await campaignRepository.findById(input.campaignId);
    const receiverId =
      input.authorId === campaign?.brandId ? campaign?.creatorId ?? undefined : campaign?.brandId;

    return this.localizeText({
      content: input.originalContent,
      sourceType: "REVIEW_COMMENT",
      sourceRefId: input.commentId,
      campaignId: input.campaignId,
      senderId: input.authorId,
      viewerUserId: input.viewerUserId,
      receiverId,
      context: `review comment on version ${input.versionId}`,
      senderRole: input.authorId === campaign?.brandId ? "BRAND" : "CREATOR"
    });
  }

  async localizeNotification(input: {
    notificationId: string;
    userId: string;
    title: string;
    content: string;
    campaignId?: string;
  }) {
    return this.localizeText({
      content: `${input.title}\n\n${input.content}`,
      sourceType: "NOTIFICATION",
      sourceRefId: input.notificationId,
      campaignId: input.campaignId,
      senderId: input.userId,
      viewerUserId: input.userId,
      context: "system notification"
    });
  }

  async resolveCampaignIdFromLegacyProject(legacyProjectId: string) {
    return campaignBridgeService.resolvePrismaCampaignId(legacyProjectId);
  }

  async resolvePrismaUserIdFromEmail(email: string) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    return user?.id ?? null;
  }
}

export const platformLocalizationService = new PlatformLocalizationService();
