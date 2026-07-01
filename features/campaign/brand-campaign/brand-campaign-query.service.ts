import type { StoredCreativeBrief, StoredProjectAsset, StoredProjectReference } from "@/lib/campaign-types";
import type { StoredProject } from "@/lib/project-types";
import {
  listStoredAssets,
  listStoredReferences,
  mapCampaignToStoredProject,
  readStoredCreativeBrief
} from "@/features/campaign/brand-campaign/brand-campaign.mapper";
import { brandCampaignRepository } from "@/features/campaign/brand-campaign/brand-campaign.repository";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

export class BrandCampaignQueryService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  async getByLegacyProjectId(legacyProjectId: string): Promise<StoredProject | null> {
    if (!this.isEnabled()) return null;
    const campaign = await brandCampaignRepository.findByLegacyProjectId(legacyProjectId);
    if (!campaign) return null;
    return mapCampaignToStoredProject(campaign);
  }

  async listForClientEmail(clientEmail: string): Promise<StoredProject[]> {
    if (!this.isEnabled()) return [];
    const campaigns = await brandCampaignRepository.listByBrandEmail(clientEmail);
    return campaigns.map(mapCampaignToStoredProject);
  }

  async listAssets(legacyProjectId: string): Promise<StoredProjectAsset[]> {
    if (!this.isEnabled()) return [];
    const campaign = await brandCampaignRepository.findByLegacyProjectId(legacyProjectId);
    if (!campaign) return [];
    return listStoredAssets(campaign);
  }

  async listReferences(legacyProjectId: string): Promise<StoredProjectReference[]> {
    if (!this.isEnabled()) return [];
    const campaign = await brandCampaignRepository.findByLegacyProjectId(legacyProjectId);
    if (!campaign) return [];
    return listStoredReferences(campaign);
  }

  async getCreativeBrief(legacyProjectId: string): Promise<StoredCreativeBrief | null> {
    if (!this.isEnabled()) return null;
    const campaign = await brandCampaignRepository.findByLegacyProjectId(legacyProjectId);
    if (!campaign) return null;
    return readStoredCreativeBrief(campaign);
  }

  async resolvePrismaCampaignId(legacyProjectId: string): Promise<string | null> {
    if (!this.isEnabled()) return null;
    const campaign = await brandCampaignRepository.findByLegacyProjectId(legacyProjectId);
    return campaign?.id ?? null;
  }
}

export const brandCampaignQueryService = new BrandCampaignQueryService();
