import type { CreativeDirection } from "@/features/ai/creative-direction.types";
import { aiWorkerService } from "@/features/ai/ai-worker.service";
import { aiJobRepository } from "@/features/ai/ai-job.repository";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { campaignService } from "@/features/campaign/campaign.service";
import { CampaignEvent, CampaignState } from "@/features/campaign/campaign.state-machine";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { Campaign } from "@prisma/client";

export class CreativeDirectionService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  private async getCampaignForBrand(campaignId: string, user: AuthUser) {
    this.assertDb();
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    if (!PermissionService.canAccessCampaign(user, campaign)) {
      throw appError("FORBIDDEN", "Not allowed for this campaign");
    }
    return campaign;
  }

  readDirections(campaign: Campaign): CreativeDirection[] {
    const brief = (campaign.productionBrief ?? {}) as { creative_directions?: CreativeDirection[] };
    return Array.isArray(brief.creative_directions) ? brief.creative_directions : [];
  }

  async generate(campaignId: string, user: AuthUser) {
    const campaign = await this.getCampaignForBrand(campaignId, user);
    PermissionService.assert(user, "campaign.update");

    const actor = { id: user.id, role: user.role };
    if (campaign.status === CampaignState.DRAFT) {
      await campaignService.transition(campaignId, CampaignEvent.START_AI, actor);
    }

    const refreshed = await campaignRepository.findById(campaignId);
    if (!refreshed) throw appError("NOT_FOUND", "Campaign not found");

    if (refreshed.status !== CampaignState.AI_PROCESSING && refreshed.status !== CampaignState.CREATIVE_READY) {
      const existing = this.readDirections(refreshed);
      if (existing.length >= 3) return existing;
      throw appError("INVALID_TRANSITION", `Cannot generate creative in status ${refreshed.status}`);
    }

    const existingDirections = this.readDirections(refreshed);
    if (existingDirections.length >= 3 && refreshed.status === CampaignState.CREATIVE_READY) {
      return existingDirections;
    }

    const job = await aiWorkerService.enqueueCreativeDirection(campaignId, user.id);
    const processed = await aiWorkerService.processJob(job.id);
    if (!processed.ok && !processed.skipped) {
      throw appError("SYSTEM_ERROR", processed.error ?? "AI job failed");
    }

    const finalCampaign = await campaignRepository.findById(campaignId);
    if (!finalCampaign) throw appError("NOT_FOUND", "Campaign not found");
    return this.readDirections(finalCampaign);
  }

  async generateAsync(campaignId: string, user: AuthUser) {
    const campaign = await this.getCampaignForBrand(campaignId, user);
    PermissionService.assert(user, "campaign.update");

    const actor = { id: user.id, role: user.role };
    if (campaign.status === CampaignState.DRAFT) {
      await campaignService.transition(campaignId, CampaignEvent.START_AI, actor);
    }

    const job = await aiWorkerService.enqueueCreativeDirection(campaignId, user.id);
    aiWorkerService.scheduleProcess(job.id);

    return {
      jobId: job.id,
      status: job.status,
      type: job.type
    };
  }

  async approve(campaignId: string, user: AuthUser, directionId: string) {
    const campaign = await this.getCampaignForBrand(campaignId, user);
    PermissionService.assert(user, "campaign.approve");

    const directions = this.readDirections(campaign);
    const selected = directions.find((d) => d.id === directionId);
    if (!selected) throw appError("VALIDATION_ERROR", "Creative direction not found");

    const brief = {
      ...((campaign.productionBrief as Record<string, unknown> | null) ?? {}),
      creative_directions: directions,
      selected_direction_id: directionId,
      approved_at: new Date().toISOString()
    };

    await campaignRepository.updateCreativeBrief(campaignId, brief, selected.title);

    const actor = { id: user.id, role: user.role };
    if (campaign.status === CampaignState.CREATIVE_READY) {
      await campaignService.transition(campaignId, CampaignEvent.APPROVE_CREATIVE, actor);
    }

    const updated = await campaignRepository.findById(campaignId);
    if (updated?.status === CampaignState.CREATIVE_APPROVED) {
      await campaignService.transition(campaignId, CampaignEvent.START_MATCHING, actor);
    }

    if (campaign.creatorId) {
      const script = [selected.title, selected.hook, selected.visualStyle, selected.tone, selected.cta]
        .filter(Boolean)
        .join("\n\n");
      void import("@/features/communication/platform-localization.service")
        .then(({ platformLocalizationService }) =>
          platformLocalizationService.localizeText({
            content: script,
            sourceType: "CREATIVE_SCRIPT",
            sourceRefId: `${campaignId}:creative:${directionId}`,
            campaignId,
            senderId: user.id,
            viewerUserId: campaign.creatorId!,
            receiverId: campaign.creatorId ?? undefined,
            context: "approved AI creative direction / script",
            senderRole: "BRAND"
          })
        )
        .catch(() => undefined);
    }

    return selected;
  }

  async getCreativeBundle(campaignId: string, user: AuthUser) {
    const campaign = await this.getCampaignForBrand(campaignId, user);
    PermissionService.assert(user, "campaign.read");
    const brief = (campaign.productionBrief ?? {}) as Record<string, unknown>;
    const latestJob = await aiJobRepository.listForCampaign(campaignId, 1);
    return {
      status: campaign.status,
      directions: this.readDirections(campaign),
      selectedDirectionId: typeof brief.selected_direction_id === "string" ? brief.selected_direction_id : null,
      generatedAt: typeof brief.generated_at === "string" ? brief.generated_at : null,
      approvedAt: typeof brief.approved_at === "string" ? brief.approved_at : null,
      latestAiJob: latestJob[0]
        ? {
            id: latestJob[0].id,
            status: latestJob[0].status,
            provider: latestJob[0].provider,
            cost: Number(latestJob[0].cost),
            tokenInput: latestJob[0].tokenInput,
            tokenOutput: latestJob[0].tokenOutput
          }
        : null
    };
  }
}

export const creativeDirectionService = new CreativeDirectionService();
