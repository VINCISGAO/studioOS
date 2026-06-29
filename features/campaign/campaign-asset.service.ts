import type { AssetType, CampaignAsset } from "@prisma/client";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { PermissionService, type AuthUser } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";
import { saveCampaignAssetUpload } from "@/lib/studioos/campaign-asset-upload";
import { prisma } from "@/lib/core/database/prisma";

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
