import { campaignRepository } from "@/features/campaign/campaign.repository";
import { campaignService } from "@/features/campaign/campaign.service";
import { CampaignEvent } from "@/features/campaign/campaign.state-machine";
import { getSessionUser } from "@/features/auth/session.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { getProject, updateProject } from "@/lib/project-service";
import type { StoredProject } from "@/lib/project-types";
import { logger } from "@/lib/core/logger";

export const PRISMA_CAMPAIGN_KEY = "prisma_campaign_id";

export function readPrismaCampaignId(project: StoredProject): string | null {
  const linked = project.settings_json?.[PRISMA_CAMPAIGN_KEY];
  return typeof linked === "string" && linked.trim() ? linked : null;
}

function parseBudget(raw?: string | null): number {
  if (!raw) return 1800;
  const digits = raw.replace(/[^\d.]/g, "");
  const value = Number.parseFloat(digits);
  return Number.isFinite(value) && value > 0 ? value : 1800;
}

function parseDeadline(raw?: string | null): Date {
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 14);
  return fallback;
}

export class CampaignBridgeService {
  async resolvePrismaCampaignId(legacyProjectId: string): Promise<string | null> {
    if (!hasDatabaseUrl()) return null;

    const project = await getProject(legacyProjectId);
    if (!project) return null;

    const linked = readPrismaCampaignId(project);
    if (linked) return linked;

    const byLegacy = await campaignRepository.findByLegacyProjectId(legacyProjectId);
    if (byLegacy) {
      await this.linkLegacyProject(legacyProjectId, byLegacy.id, project);
      return byLegacy.id;
    }

    return null;
  }

  async linkLegacyProject(legacyProjectId: string, prismaCampaignId: string, project?: StoredProject | null) {
    const current = project ?? (await getProject(legacyProjectId));
    if (!current) return;

    if (readPrismaCampaignId(current) === prismaCampaignId) return;

    await updateProject(legacyProjectId, {
      settings_json: {
        ...current.settings_json,
        [PRISMA_CAMPAIGN_KEY]: prismaCampaignId
      }
    });
  }

  async ensurePrismaCampaignOnDraft(legacyProjectId: string): Promise<string | null> {
    if (!hasDatabaseUrl()) return null;

    const sessionUser = await getSessionUser();
    if (!sessionUser?.id || sessionUser.id.startsWith("demo_")) return null;

    const project = await getProject(legacyProjectId);
    if (!project) return null;

    const existing = readPrismaCampaignId(project) ?? (await campaignRepository.findByLegacyProjectId(legacyProjectId))?.id;
    if (existing) {
      await this.linkLegacyProject(legacyProjectId, existing, project);
      return existing;
    }

    const campaign = await campaignRepository.createDraft({
      brandId: sessionUser.id,
      title: project.title || `${project.company_name} Campaign`,
      description: project.campaign_goal || project.notes || undefined,
      budget: parseBudget(project.budget_range),
      deadline: parseDeadline(project.deadline),
      platform: project.target_platform?.split(",")[0]?.trim(),
      aspectRatio: project.video_format || project.aspect_ratios?.[0],
      legacyProjectId: legacyProjectId,
      productionBrief: {
        objective: project.campaign_goal,
        legacy_project_id: legacyProjectId
      }
    });

    await this.linkLegacyProject(legacyProjectId, campaign.id, project);
    logger.info("Linked legacy project to Prisma campaign", {
      legacyProjectId,
      campaignId: campaign.id,
      service: "CampaignBridgeService"
    });
    return campaign.id;
  }

  async syncPublishToPrisma(legacyProjectId: string): Promise<void> {
    if (!hasDatabaseUrl()) return;

    const prismaId = await this.ensurePrismaCampaignOnDraft(legacyProjectId);
    if (!prismaId) return;

    const campaign = await campaignService.findById(prismaId);
    if (!campaign) return;

    const publishChain: Array<typeof CampaignEvent[keyof typeof CampaignEvent]> = [
      CampaignEvent.START_AI,
      CampaignEvent.AI_SUCCESS,
      CampaignEvent.APPROVE_CREATIVE,
      CampaignEvent.START_MATCHING
    ];

    for (const event of publishChain) {
      try {
        await campaignService.transition(prismaId, event);
      } catch (error) {
        logger.warn("Prisma publish transition skipped", {
          campaignId: prismaId,
          event,
          error: error instanceof Error ? error.message : String(error),
          service: "CampaignBridgeService"
        });
      }
    }
  }
}

export const campaignBridgeService = new CampaignBridgeService();
