import type { AssetType, CampaignAsset } from "@prisma/client";
import { activityService } from "@/features/campaign/activity.service";
import { assetRepository } from "@/features/campaign/asset.repository";
import {
  mapCampaignAssetToStoredProjectAsset,
  mapReferenceAssetToStoredProjectReference
} from "@/features/campaign/brand-campaign/brand-campaign.mapper";
import {
  REFERENCE_ASSET_META_KIND,
  type ReferenceAssetMetadata
} from "@/features/campaign/brand-campaign/brand-campaign.types";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { PermissionService, type AuthUser } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";
import { referenceAnalysisService } from "@/features/campaign/reference-analysis.service";
import { detectReferenceType } from "@/lib/campaign/reference-type";
import { detectReferenceInputKind } from "@/lib/studioos/reference-platform";
import type { ProjectAssetType, ReferenceType, StoredProjectAsset } from "@/lib/campaign-types";
import { saveCampaignAssetUpload } from "@/lib/studioos/campaign-asset-upload";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

function projectAssetTypeToPrisma(type: ProjectAssetType): AssetType {
  if (type === "logo") return "LOGO";
  if (type === "brand_guide") return "BRAND_GUIDE";
  return "PRODUCT_IMAGE";
}

function referenceTypeToAssetType(type: ReferenceType): AssetType {
  if (type === "youtube" || type === "tiktok" || type === "mp4") return "REFERENCE_VIDEO";
  if (type === "image" || type === "instagram" || type === "pinterest") return "REFERENCE_IMAGE";
  return "OTHER";
}

export class CampaignAssetService {
  private async assertBrandAccess(user: AuthUser, campaignId: string) {
    PermissionService.assert(user, "asset.upload");
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    if (!PermissionService.canAccessCampaign(user, campaign)) {
      throw appError("FORBIDDEN", "Not allowed for this campaign");
    }
    return campaign;
  }

  async uploadLogo(campaignId: string, user: AuthUser, file: File): Promise<CampaignAsset> {
    await this.assertBrandAccess(user, campaignId);

    const saved = await saveCampaignAssetUpload(campaignId, file, "logo");
    if (!saved.ok) {
      throw appError("VALIDATION_ERROR", saved.error);
    }

    await campaignRepository.softDeleteLogoAssets(campaignId);
    const asset = await campaignRepository.createAsset({
      campaignId,
      uploadedBy: user.id,
      assetType: "LOGO",
      fileName: saved.file_name,
      fileKey: saved.file_key,
      mimeType: saved.mime_type,
      fileSize: saved.size_bytes,
      storageProvider: saved.storage_provider,
      previewUrl: saved.url
    });

    await prisma.brandProfile.updateMany({
      where: { userId: user.id },
      data: { logoUrl: saved.url }
    });

    return asset;
  }

  async listAssets(campaignId: string, user: AuthUser, assetType?: AssetType) {
    await this.assertBrandAccess(user, campaignId);
    const assets = await campaignRepository.listAssets(campaignId);
    return assetType ? assets.filter((a) => a.assetType === assetType) : assets;
  }

  /** Brand wizard portal — legacy `proj_*` asset operations via CampaignAsset. */
  private async requireLegacyCampaign(legacyProjectId: string) {
    const campaign = await campaignRepository.findByLegacyProjectIdWithRelations(legacyProjectId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    return campaign;
  }

  async addLegacyProjectAsset(input: {
    legacyProjectId: string;
    type: ProjectAssetType;
    file_url: string;
    file_name?: string;
    file_key?: string;
    mime_type?: string;
    size_bytes?: number;
    storage_provider?: string;
    actorEmail?: string;
  }): Promise<StoredProjectAsset | null> {
    if (!hasDatabaseUrl()) return null;

    const campaign = await this.requireLegacyCampaign(input.legacyProjectId);
    const assetType = projectAssetTypeToPrisma(input.type);

    if (input.type === "logo") {
      await assetRepository.softDeleteByType(campaign.id, "LOGO");
    }
    if (input.type === "brand_guide") {
      await assetRepository.softDeleteByType(campaign.id, "BRAND_GUIDE");
    }
    if (input.type === "product_image" || input.type === "product_image_original") {
      await assetRepository.softDeleteByType(campaign.id, "PRODUCT_IMAGE");
    }

    const fileName = input.file_name ?? input.file_url.split("/").pop() ?? "asset";
    const metadata: Record<string, string> = {};
    if (input.file_key) metadata.object_key = input.file_key;
    if (input.storage_provider) metadata.storage_provider = input.storage_provider;
    if (input.type === "product_image_original") metadata.role = "original";
    const asset = await assetRepository.create({
      campaignId: campaign.id,
      uploadedBy: campaign.brandId,
      assetType,
      fileName,
      fileKey: input.file_key ?? input.file_url,
      mimeType: input.mime_type ?? "image/jpeg",
      fileSize: input.size_bytes ?? 0,
      storageProvider: input.storage_provider,
      previewUrl: input.file_url,
      metadataJson: metadata
    });

    await activityService.write(
      campaign.id,
      "brand_campaign.asset_added",
      { userId: campaign.brandId, email: input.actorEmail ?? "", role: "brand" },
      { legacy_project_id: input.legacyProjectId, asset_type: input.type }
    );

    return mapCampaignAssetToStoredProjectAsset(asset, input.legacyProjectId);
  }

  async removeLegacyProjectAsset(assetId: string, legacyProjectId: string, actorEmail?: string) {
    if (!hasDatabaseUrl()) return;
    const campaign = await this.requireLegacyCampaign(legacyProjectId);
    await assetRepository.softDeleteById(assetId, campaign.id);
    await activityService.write(
      campaign.id,
      "brand_campaign.asset_removed",
      { userId: campaign.brandId, email: actorEmail ?? "", role: "brand" },
      { legacy_project_id: legacyProjectId, asset_id: assetId }
    );
  }

  async addLegacyProjectReference(input: {
    legacyProjectId: string;
    source_url: string;
    note?: string;
    actorEmail?: string;
    input_kind?: ReferenceAssetMetadata["input_kind"];
    locale?: "zh" | "en";
  }) {
    if (!hasDatabaseUrl()) return null;

    const url = input.source_url.trim();
    if (!url) return null;

    const campaign = await this.requireLegacyCampaign(input.legacyProjectId);
    const existingRefs = (campaign.assets ?? []).filter((asset) => {
      const meta = asset.metadataJson as ReferenceAssetMetadata | null;
      return meta?.kind === REFERENCE_ASSET_META_KIND && meta.source_url === url;
    });
    if (existingRefs[0]) {
      return mapReferenceAssetToStoredProjectReference(existingRefs[0]);
    }

    const referenceType = detectReferenceType(url);
    const inputKind = input.input_kind ?? detectReferenceInputKind(url, referenceType);
    const sortOrder = (campaign.assets ?? []).filter((asset) => {
      const meta = asset.metadataJson as ReferenceAssetMetadata | null;
      return meta?.kind === REFERENCE_ASSET_META_KIND;
    }).length;

    const baseMetadata: ReferenceAssetMetadata = {
      kind: REFERENCE_ASSET_META_KIND,
      source_url: url,
      note: input.note?.trim() ?? "",
      sort_order: sortOrder,
      platform: referenceType,
      reference_type: referenceType,
      input_kind: inputKind
    };

    const metadata = referenceAnalysisService.createPendingMetadata({
      metadata: baseMetadata,
      referenceType,
      locale: input.locale === "en" ? "en" : "zh"
    });

    const asset = await assetRepository.create({
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

    await activityService.write(
      campaign.id,
      "brand_campaign.reference_added",
      { userId: campaign.brandId, email: input.actorEmail ?? "", role: "brand" },
      { legacy_project_id: input.legacyProjectId, source_url: url }
    );

    referenceAnalysisService.scheduleAnalysis(asset.id, input.legacyProjectId, input.locale === "en" ? "en" : "zh");

    return {
      ...mapReferenceAssetToStoredProjectReference(asset),
      project_id: input.legacyProjectId
    };
  }

  async removeLegacyProjectReference(refId: string, legacyProjectId: string, actorEmail?: string) {
    if (!hasDatabaseUrl()) return;
    const campaign = await this.requireLegacyCampaign(legacyProjectId);
    await assetRepository.softDeleteById(refId, campaign.id);
    await activityService.write(
      campaign.id,
      "brand_campaign.reference_removed",
      { userId: campaign.brandId, email: actorEmail ?? "", role: "brand" },
      { legacy_project_id: legacyProjectId, reference_id: refId }
    );
  }

  async hasLegacyProductVisual(legacyProjectId: string) {
    if (!hasDatabaseUrl()) return false;
    const campaign = await this.requireLegacyCampaign(legacyProjectId);
    return (campaign.assets ?? []).some(
      (asset) => asset.assetType === "PRODUCT_IMAGE" && !asset.deletedAt
    );
  }

  /** @deprecated Use addLegacyProjectAsset */
  addProjectAsset(input: Parameters<CampaignAssetService["addLegacyProjectAsset"]>[0]) {
    return this.addLegacyProjectAsset(input);
  }

  /** @deprecated Use removeLegacyProjectAsset */
  removeProjectAsset(assetId: string, legacyProjectId: string, actorEmail?: string) {
    return this.removeLegacyProjectAsset(assetId, legacyProjectId, actorEmail);
  }

  /** @deprecated Use addLegacyProjectReference */
  addProjectReference(input: Parameters<CampaignAssetService["addLegacyProjectReference"]>[0]) {
    return this.addLegacyProjectReference(input);
  }

  /** @deprecated Use removeLegacyProjectReference */
  removeProjectReference(refId: string, legacyProjectId: string, actorEmail?: string) {
    return this.removeLegacyProjectReference(refId, legacyProjectId, actorEmail);
  }

  /** @deprecated Use hasLegacyProductVisual */
  hasProductVisual(legacyProjectId: string) {
    return this.hasLegacyProductVisual(legacyProjectId);
  }
}

export const campaignAssetService = new CampaignAssetService();

export function serializeCampaignAsset(asset: CampaignAsset) {
  return {
    id: asset.id,
    campaignId: asset.campaignId,
    assetType: asset.assetType,
    fileName: asset.fileName,
    fileKey: asset.fileKey,
    mimeType: asset.mimeType,
    fileSize: Number(asset.fileSize),
    previewUrl: asset.previewUrl,
    status: asset.status,
    createdAt: asset.createdAt.toISOString()
  };
}
