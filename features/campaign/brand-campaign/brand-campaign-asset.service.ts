import type { AssetType } from "@prisma/client";
import { detectReferenceType } from "@/lib/campaign-store";
import type { ProjectAssetType, ReferenceType, StoredProjectAsset } from "@/lib/campaign-types";
import { brandCampaignActivityService } from "@/features/campaign/brand-campaign/brand-campaign-activity.service";
import {
  mapCampaignAssetToStoredProjectAsset,
  mapReferenceAssetToStoredProjectReference
} from "@/features/campaign/brand-campaign/brand-campaign.mapper";
import { brandCampaignRepository } from "@/features/campaign/brand-campaign/brand-campaign.repository";
import {
  REFERENCE_ASSET_META_KIND,
  type ReferenceAssetMetadata
} from "@/features/campaign/brand-campaign/brand-campaign.types";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

function projectAssetTypeToPrisma(type: ProjectAssetType): AssetType {
  if (type === "logo") return "LOGO";
  if (type === "brand_guide") return "BRAND_GUIDE";
  if (type === "product_image_original") return "PRODUCT_IMAGE";
  return "PRODUCT_IMAGE";
}

function referenceTypeToAssetType(type: ReferenceType): AssetType {
  if (type === "youtube" || type === "tiktok" || type === "mp4") return "REFERENCE_VIDEO";
  if (type === "image" || type === "instagram" || type === "pinterest") return "REFERENCE_IMAGE";
  return "OTHER";
}

export class BrandCampaignAssetService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  private async requireCampaign(legacyProjectId: string) {
    const campaign = await brandCampaignRepository.findByLegacyProjectId(legacyProjectId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    return campaign;
  }

  async addProjectAsset(input: {
    legacyProjectId: string;
    type: ProjectAssetType;
    file_url: string;
    file_name?: string;
    mime_type?: string;
    size_bytes?: number;
    actorEmail?: string;
  }): Promise<StoredProjectAsset | null> {
    if (!this.isEnabled()) return null;

    const campaign = await this.requireCampaign(input.legacyProjectId);
    const assetType = projectAssetTypeToPrisma(input.type);

    if (input.type === "logo") {
      await brandCampaignRepository.softDeleteAssetsByType(campaign.id, "LOGO");
    }
    if (input.type === "brand_guide") {
      await brandCampaignRepository.softDeleteAssetsByType(campaign.id, "BRAND_GUIDE");
    }
    if (input.type === "product_image" || input.type === "product_image_original") {
      await brandCampaignRepository.softDeleteAssetsByType(campaign.id, "PRODUCT_IMAGE");
    }

    const fileName = input.file_name ?? input.file_url.split("/").pop() ?? "asset";
    const asset = await brandCampaignRepository.createAsset({
      campaignId: campaign.id,
      uploadedBy: campaign.brandId,
      assetType,
      fileName,
      fileKey: input.file_url,
      mimeType: input.mime_type ?? "image/jpeg",
      fileSize: input.size_bytes ?? 0,
      previewUrl: input.file_url,
      metadataJson: {
        legacy_asset_id: undefined,
        role: input.type === "product_image_original" ? "original" : undefined
      }
    });

    await brandCampaignActivityService.log(
      campaign.id,
      "brand_campaign.asset_added",
      { userId: campaign.brandId, email: input.actorEmail ?? "", role: "brand" },
      { legacy_project_id: input.legacyProjectId, asset_type: input.type }
    );

    return mapCampaignAssetToStoredProjectAsset(asset, input.legacyProjectId);
  }

  async removeProjectAsset(assetId: string, legacyProjectId: string, actorEmail?: string) {
    if (!this.isEnabled()) return;
    const campaign = await this.requireCampaign(legacyProjectId);
    await brandCampaignRepository.softDeleteAsset(assetId, campaign.id);
    await brandCampaignActivityService.log(
      campaign.id,
      "brand_campaign.asset_removed",
      { userId: campaign.brandId, email: actorEmail ?? "", role: "brand" },
      { legacy_project_id: legacyProjectId, asset_id: assetId }
    );
  }

  async addProjectReference(input: {
    legacyProjectId: string;
    source_url: string;
    note?: string;
    actorEmail?: string;
  }) {
    if (!this.isEnabled()) return null;

    const url = input.source_url.trim();
    if (!url) return null;

    const campaign = await this.requireCampaign(input.legacyProjectId);
    const existingRefs = (campaign.assets ?? []).filter((asset) => {
      const meta = asset.metadataJson as ReferenceAssetMetadata | null;
      return meta?.kind === REFERENCE_ASSET_META_KIND && meta.source_url === url;
    });
    if (existingRefs[0]) {
      return mapReferenceAssetToStoredProjectReference(existingRefs[0]);
    }

    const referenceType = detectReferenceType(url);
    const sortOrder = (campaign.assets ?? []).filter((asset) => {
      const meta = asset.metadataJson as ReferenceAssetMetadata | null;
      return meta?.kind === REFERENCE_ASSET_META_KIND;
    }).length;

    const metadata: ReferenceAssetMetadata = {
      kind: REFERENCE_ASSET_META_KIND,
      source_url: url,
      note: input.note?.trim() ?? "",
      sort_order: sortOrder,
      platform: referenceType,
      reference_type: referenceType
    };

    const asset = await brandCampaignRepository.createAsset({
      campaignId: campaign.id,
      uploadedBy: campaign.brandId,
      assetType: referenceTypeToAssetType(referenceType),
      fileName: url.split("/").pop() ?? "reference",
      fileKey: url,
      mimeType: "text/uri-list",
      fileSize: 0,
      previewUrl: url,
      metadataJson: metadata
    });

    await brandCampaignActivityService.log(
      campaign.id,
      "brand_campaign.reference_added",
      { userId: campaign.brandId, email: input.actorEmail ?? "", role: "brand" },
      { legacy_project_id: input.legacyProjectId, source_url: url }
    );

    return {
      ...mapReferenceAssetToStoredProjectReference(asset),
      project_id: input.legacyProjectId
    };
  }

  async removeProjectReference(refId: string, legacyProjectId: string, actorEmail?: string) {
    if (!this.isEnabled()) return;
    const campaign = await this.requireCampaign(legacyProjectId);
    await brandCampaignRepository.softDeleteAsset(refId, campaign.id);
    await brandCampaignActivityService.log(
      campaign.id,
      "brand_campaign.reference_removed",
      { userId: campaign.brandId, email: actorEmail ?? "", role: "brand" },
      { legacy_project_id: legacyProjectId, reference_id: refId }
    );
  }

  async hasProductVisual(legacyProjectId: string) {
    if (!this.isEnabled()) return false;
    const campaign = await this.requireCampaign(legacyProjectId);
    return (campaign.assets ?? []).some(
      (asset) => asset.assetType === "PRODUCT_IMAGE" && !asset.deletedAt
    );
  }
}

export const brandCampaignAssetService = new BrandCampaignAssetService();
