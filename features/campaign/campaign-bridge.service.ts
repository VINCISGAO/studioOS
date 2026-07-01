import { campaignService } from "@/features/campaign/campaign.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { getProject, updateProject } from "@/lib/project-service";
import type { StoredProject } from "@/lib/project-types";

export const PRISMA_CAMPAIGN_KEY = "prisma_campaign_id";

export function readPrismaCampaignId(project: StoredProject): string | null {
  const linked = project.settings_json?.[PRISMA_CAMPAIGN_KEY];
  return typeof linked === "string" && linked.trim() ? linked : null;
}

export class CampaignBridgeService {
  async resolvePrismaCampaignId(legacyProjectId: string): Promise<string | null> {
    if (!hasDatabaseUrl()) return null;
    return campaignService.resolveLegacyCampaignId(legacyProjectId);
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

    const project = await getProject(legacyProjectId);
    if (!project) return null;

    const existing = readPrismaCampaignId(project) ?? (await this.resolvePrismaCampaignId(legacyProjectId));
    if (!existing) return null;

    await this.linkLegacyProject(legacyProjectId, existing, project);
    return existing;
  }

  async syncPublishToPrisma(_legacyProjectId: string): Promise<void> {
    return;
  }
}

export const campaignBridgeService = new CampaignBridgeService();
