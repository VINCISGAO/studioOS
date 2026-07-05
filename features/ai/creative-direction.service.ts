import type { CreativeDirection, FrozenProductionBrief } from "@/features/ai/creative-direction.types";
import { aiWorkerService } from "@/features/ai/ai-worker.service";
import { aiJobRepository } from "@/features/ai/ai-job.repository";
import { aiLearningEventRepository } from "@/features/ai/ai-learning-event.repository";
import { activityService } from "@/features/campaign/activity.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { campaignService } from "@/features/campaign/campaign.service";
import { CampaignEvent, CampaignState } from "@/features/campaign/campaign.state-machine";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import type { WizardBriefSnapshot } from "@/lib/studioos/brand-wizard-brief-snapshot";
import { memoryRepository } from "@/features/memory/memory.repository";
import { notificationService } from "@/features/notification/notification.service";
import { appError } from "@/lib/core/errors";
import { getAppBaseUrl } from "@/lib/app-url";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";
import type { Campaign } from "@prisma/client";

function buildFrozenProductionBrief(campaign: Campaign, direction: CreativeDirection): FrozenProductionBrief {
  const brief = (campaign.productionBrief ?? {}) as {
    product?: FrozenProductionBrief["product"];
    audience?: string;
    budget?: { range?: string };
    delivery?: Record<string, unknown>;
  };
  const shotList = direction.shotList.length ? direction.shotList : ["Hero hook", "Story setup", "Product proof", "CTA"];
  const fullText = [
    `Title: ${direction.title}`,
    `Core idea: ${direction.coreIdea}`,
    `Hook: ${direction.hook}`,
    `Story: ${direction.story}`,
    `Tone: ${direction.tone}`,
    `Visual style: ${direction.visualStyle}`,
    `Shot list:\n${shotList.map((shot, index) => `${index + 1}. ${shot}`).join("\n")}`,
    `CTA: ${direction.cta}`,
    `Recommended creator type: ${direction.recommendedCreatorType}`,
    `Recommended budget: ${direction.recommendedBudget}`,
    `Expected outcome: ${direction.expectedOutcome}`
  ].join("\n\n");

  return {
    frozen_at: new Date().toISOString(),
    source_direction_id: direction.id,
    title: direction.title,
    core_idea: direction.coreIdea,
    hook: direction.hook,
    story: direction.story,
    tone: direction.tone,
    visual_style: direction.visualStyle,
    shot_list: shotList,
    cta: direction.cta,
    recommended_creator_type: direction.recommendedCreatorType,
    recommended_budget: direction.recommendedBudget,
    expected_outcome: direction.expectedOutcome,
    ...(brief.product ? { product: brief.product } : {}),
    ...(brief.audience ? { audience: brief.audience } : {}),
    ...(campaign.platform ? { platforms: campaign.platform } : {}),
    budget_range: brief.budget?.range ?? `$${Number(campaign.budget)}`,
    ...(brief.delivery ? { delivery: brief.delivery } : {}),
    full_text: fullText
  };
}

async function recordCampaignAiEvidence(input: {
  campaign: Campaign;
  eventType: string;
  learningType: string;
  payload: Record<string, unknown>;
  after: Record<string, unknown>;
  memoryKey: string;
  memoryValue: string;
}) {
  const learningEvent = await aiLearningEventRepository.append({
    eventType: input.eventType,
    entityType: "Campaign",
    entityId: input.campaign.id,
    payload: input.payload,
    learningType: input.learningType,
    after: input.after,
    confidence: 0.9
  });

  await memoryRepository.upsertFact({
    ownerType: "CAMPAIGN",
    campaignId: input.campaign.id,
    category: "creative_direction",
    factKey: input.memoryKey,
    factValue: input.memoryValue,
    confidence: 0.9,
    sourceType: "AIEvent",
    sourceRefId: learningEvent?.eventId ?? undefined
  });

  return learningEvent;
}

async function notifyBrandAiProgress(campaign: Campaign, input: {
  title: string;
  content: string;
  template: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}) {
  await notificationService.notify({
    userId: campaign.brandId,
    campaignId: campaign.id,
    title: input.title,
    content: input.content,
    actionUrl: `${getAppBaseUrl()}/brand/projects/new?project=${encodeURIComponent(campaign.id)}`,
    template: input.template,
    priority: input.priority ?? "NORMAL"
  });
}

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

  async listDirections(campaignId: string, user: AuthUser) {
    const campaign = await this.getCampaignForBrand(campaignId, user);
    PermissionService.assert(user, "campaign.read");
    return this.readDirections(campaign);
  }

  async generate(campaignId: string, user: AuthUser) {
    const campaign = await this.getCampaignForBrand(campaignId, user);
    PermissionService.assert(user, "campaign.update");

    const actor = { id: user.id, role: user.role };
    if (campaign.status === CampaignState.DRAFT) {
      await campaignService.transition(campaignId, CampaignEvent.START_AI, actor);
      await activityService.write(campaignId, "ai.analysis_started", {
        userId: user.id,
        email: user.id,
        role: "brand"
      }, {
        campaignStatus: CampaignState.AI_PROCESSING
      });
      await recordCampaignAiEvidence({
        campaign,
        eventType: "AIAnalysisStarted",
        learningType: "creative_analysis_started",
        payload: { campaignId, title: campaign.title, platform: campaign.platform },
        after: { status: CampaignState.AI_PROCESSING },
        memoryKey: "analysis_status",
        memoryValue: "AI_ANALYZING"
      });
      await notifyBrandAiProgress(campaign, {
        title: "AI is analyzing your campaign",
        content: `StudioOS is analyzing "${campaign.title}" and preparing creative directions.`,
        template: "ai.analysis_started"
      });
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
    const directions = this.readDirections(finalCampaign);
    if (directions.length >= 3) {
      await activityService.write(campaignId, "ai.creative_directions_ready", {
        userId: user.id,
        email: user.id,
        role: "brand"
      }, {
        directionCount: directions.length,
        campaignStatus: finalCampaign.status
      });
      await recordCampaignAiEvidence({
        campaign: finalCampaign,
        eventType: "CreativeDirectionsReady",
        learningType: "creative_directions_generated",
        payload: { campaignId, directionCount: directions.length },
        after: { directions: directions.map((direction) => direction.title) },
        memoryKey: "latest_direction_titles",
        memoryValue: JSON.stringify(directions.map((direction) => direction.title))
      });
      await notifyBrandAiProgress(finalCampaign, {
        title: "Creative directions are ready",
        content: `StudioOS generated ${directions.length} creative directions for "${finalCampaign.title}".`,
        template: "ai.creative_directions_ready",
        priority: "HIGH"
      });
    }
    return directions;
  }

  async generateAsync(
    campaignId: string,
    user: AuthUser,
    options?: { wizardFastPath?: boolean; briefSnapshot?: WizardBriefSnapshot; language?: string }
  ) {
    const campaign = await this.getCampaignForBrand(campaignId, user);
    PermissionService.assert(user, "campaign.update");

    const actor = { id: user.id, role: user.role };
    if (campaign.status === CampaignState.DRAFT) {
      await campaignService.transition(campaignId, CampaignEvent.START_AI, actor);
      if (!options?.wizardFastPath) {
        await activityService.write(campaignId, "ai.analysis_started", {
          userId: user.id,
          email: user.id,
          role: "brand"
        }, {
          campaignStatus: CampaignState.AI_PROCESSING
        });
        await recordCampaignAiEvidence({
          campaign,
          eventType: "AIAnalysisStarted",
          learningType: "creative_analysis_started",
          payload: { campaignId, title: campaign.title, platform: campaign.platform },
          after: { status: CampaignState.AI_PROCESSING },
          memoryKey: "analysis_status",
          memoryValue: "AI_ANALYZING"
        });
        await notifyBrandAiProgress(campaign, {
          title: "AI is analyzing your campaign",
          content: `StudioOS is analyzing "${campaign.title}" and preparing creative directions.`,
          template: "ai.analysis_started"
        });
      }
    }

    const job = await aiWorkerService.enqueueCreativeDirection(campaignId, user.id, {
      briefSnapshot: options?.briefSnapshot,
      language: options?.language
    });
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
      approved_at: new Date().toISOString(),
      frozen_production_brief: buildFrozenProductionBrief(campaign, selected)
    };

    await campaignRepository.updateCreativeBrief(campaignId, asInputJson(brief)!, selected.title);

    const actor = { id: user.id, role: user.role };
    if (campaign.status === CampaignState.CREATIVE_READY) {
      await campaignService.transition(campaignId, CampaignEvent.APPROVE_CREATIVE, actor);
    }

    await activityService.write(campaignId, "ai.direction_selected", {
      userId: user.id,
      email: user.id,
      role: "brand"
    }, {
      directionId,
      title: selected.title,
      frozenBrief: true
    });
    await recordCampaignAiEvidence({
      campaign,
      eventType: "CreativeDirectionSelected",
      learningType: "creative_direction_selected",
      payload: { campaignId, directionId, title: selected.title },
      after: { selected_direction_id: directionId, frozen_production_brief: true },
      memoryKey: "selected_direction",
      memoryValue: selected.title
    });
    await notifyBrandAiProgress(campaign, {
      title: "Creative direction selected",
      content: `"${selected.title}" is now frozen as the Production Brief for matching and production.`,
      template: "ai.direction_selected",
      priority: "HIGH"
    });

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
