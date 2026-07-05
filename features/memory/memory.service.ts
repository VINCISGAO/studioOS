import { campaignRepository } from "@/features/campaign/campaign.repository";
import { aiPreferenceService } from "@/features/memory/ai-preference.service";
import { brandDnaService } from "@/features/memory/brand-dna.service";
import { campaignMemoryService } from "@/features/memory/campaign-memory.service";
import { creatorDnaService } from "@/features/memory/creator-dna.service";
import { memoryExtractionService } from "@/features/memory/memory-extraction.service";
import { memoryResolutionService } from "@/features/memory/memory-resolution.service";
import { relationshipDnaService } from "@/features/memory/relationship-dna.service";
import type { MemoryContextBundle } from "@/features/memory/memory.types";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

export class MemoryService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  async buildContext(input: {
    campaignId?: string | null;
    brandId?: string | null;
    creatorId?: string | null;
    viewerUserId: string;
    messageContent?: string;
  }): Promise<MemoryContextBundle> {
    const pref = await aiPreferenceService.getForUser(input.viewerUserId);

    let brandId = input.brandId;
    let creatorId = input.creatorId;
    if (input.campaignId) {
      const campaign = await campaignRepository.findById(input.campaignId);
      brandId = campaign?.brandId ?? brandId;
      creatorId = campaign?.creatorId ?? creatorId;
    }

    let resolvedMessage = input.messageContent;
    if (input.messageContent && brandId && memoryResolutionService.isReferenceToPriorWork(input.messageContent)) {
      const resolved = await memoryResolutionService.resolveMessage(input.messageContent, brandId);
      resolvedMessage = resolved.resolved;
    }

    const [brandDna, creatorDna, relationshipDna, campaignMemory] = await Promise.all([
      brandId ? brandDnaService.buildSnapshot(brandId) : null,
      creatorId ? creatorDnaService.buildSnapshot(creatorId) : null,
      brandId && creatorId ? relationshipDnaService.buildSnapshot(brandId, creatorId) : null,
      input.campaignId ? campaignMemoryService.getCampaignMemory(input.campaignId) : null
    ]);

    return {
      brandDna,
      creatorDna,
      relationshipDna,
      campaignMemory,
      resolvedMessage,
      tone: pref.tone,
      neverUseEmojis: pref.neverUseEmojis
    };
  }

  formatContextForPrompt(ctx: MemoryContextBundle) {
    const sections = [
      brandDnaService.formatForPrompt(ctx.brandDna),
      creatorDnaService.formatForPrompt(ctx.creatorDna),
      relationshipDnaService.formatForPrompt(ctx.relationshipDna),
      campaignMemoryService.formatForPrompt(ctx.campaignMemory)
    ].filter(Boolean);

    const toneLine = `Tone preference: ${ctx.tone}${ctx.neverUseEmojis ? " — no emojis" : ""}`;
    return [toneLine, ...sections].join("\n\n");
  }

  async processMessageMemory(input: {
    content: string;
    senderId: string;
    senderRole: string;
    campaignId?: string | null;
    sourceRefId?: string;
  }) {
    this.assertDb();
    let brandId: string | undefined;
    let creatorId: string | undefined;

    if (input.campaignId) {
      const campaign = await campaignRepository.findById(input.campaignId);
      brandId = campaign?.brandId;
      creatorId = campaign?.creatorId ?? undefined;
      if (input.senderRole === "CREATOR") creatorId = input.senderId;
      if (input.senderRole === "BRAND") brandId = input.senderId;
    }

    return memoryExtractionService.extractFromMessage({
      content: input.content,
      senderRole: input.senderRole,
      brandId,
      creatorId,
      campaignId: input.campaignId,
      sourceRefId: input.sourceRefId
    });
  }

  async inheritCampaignMemory(campaignId: string, brandUserId: string) {
    return campaignMemoryService.inheritForNewCampaign(campaignId, brandUserId);
  }

  async getBrandDna(user: AuthUser) {
    PermissionService.assert(user, "campaign.read");
    if (!user.hasBrandProfile && user.role !== "BRAND" && user.role !== "ADMIN") {
      throw appError("FORBIDDEN", "Brand DNA is for brand accounts");
    }
    return brandDnaService.buildSnapshot(user.id);
  }

  async getCreatorDna(user: AuthUser) {
    PermissionService.assert(user, "campaign.read");
    if (!user.hasCreatorProfile && user.role !== "CREATOR" && user.role !== "ADMIN") {
      throw appError("FORBIDDEN", "Creator DNA is for creator accounts");
    }
    return creatorDnaService.buildSnapshot(user.id);
  }

  async getRelationshipDna(brandId: string, creatorId: string, user: AuthUser) {
    PermissionService.assert(user, "campaign.read");
    return relationshipDnaService.buildSnapshot(brandId, creatorId);
  }
}

export const memoryService = new MemoryService();
