import { addProjectAsset } from "@/lib/campaign-store";
import { mapCampaignAssetToStoredProjectAsset } from "@/features/campaign/brand-campaign/brand-campaign.mapper";
import { brandCampaignRepository } from "@/features/campaign/brand-campaign/brand-campaign.repository";
import { campaignAssetService } from "@/features/campaign/campaign-asset.service";
import { campaignBridgeService } from "@/features/campaign/campaign-bridge.service";
import { getSessionUser } from "@/features/auth/session.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { getProject } from "@/lib/project-service";
import { saveProjectAssetUpload } from "@/lib/studioos/project-asset-upload";
import type { StoredProjectAsset } from "@/lib/campaign-types";

type UploadCampaignContext = {
  id: string;
  brandId: string;
  brand: { email: string | null };
};

async function resolveAccessibleProject(projectId: string, clientEmail: string) {
  const normalizedEmail = clientEmail.toLowerCase();

  const projectPromise = getProject(projectId);
  const campaignPromise = hasDatabaseUrl()
    ? brandCampaignRepository.findUploadContextByLegacyProjectId(projectId).catch(() => null)
    : Promise.resolve(null);

  const [project, campaign] = await Promise.all([projectPromise, campaignPromise]);

  if (project?.client_email.toLowerCase() === normalizedEmail) {
    return { ok: true as const, campaign: campaign as UploadCampaignContext | null };
  }

  if (campaign?.brand?.email?.toLowerCase() === normalizedEmail) {
    return { ok: true as const, campaign: campaign as UploadCampaignContext };
  }

  return { ok: false as const, campaign: null };
}

export async function uploadBrandLogoImage(input: {
  projectId: string;
  clientEmail: string;
  file: File;
  locale: "en" | "zh";
}): Promise<
  | { ok: true; asset: StoredProjectAsset; preview_url: string }
  | { ok: false; error: string; status?: number }
> {
  const access = await resolveAccessibleProject(input.projectId, input.clientEmail);
  if (!access.ok) {
    return {
      ok: false,
      status: 403,
      error: input.locale === "zh" ? "无权操作此 Campaign" : "Not allowed for this campaign"
    };
  }

  if (!input.file.size) {
    return {
      ok: false,
      status: 400,
      error: input.locale === "zh" ? "请选择图片" : "Choose an image file"
    };
  }

  const saved = await saveProjectAssetUpload(input.projectId, input.file, "logo");
  if (!saved.ok) {
    const error =
      saved.error.includes("HEIC") && input.locale === "zh"
        ? "不支持 HEIC 格式，请先导出为 JPG 或 PNG"
        : saved.error.includes("Only JPEG") && input.locale === "zh"
          ? "仅支持 JPG、PNG、WebP、GIF 格式"
          : saved.error.includes("10MB") && input.locale === "zh"
            ? "图片不能超过 10MB"
            : saved.error;
    return { ok: false, status: 400, error };
  }

  if (access.campaign) {
    await brandCampaignRepository.softDeleteAssetsByType(access.campaign.id, "LOGO");
    const asset = await brandCampaignRepository.createAsset({
      campaignId: access.campaign.id,
      uploadedBy: access.campaign.brandId,
      assetType: "LOGO",
      fileName: saved.file_name,
      fileKey: saved.file_key ?? saved.url,
      mimeType: saved.mime_type,
      fileSize: saved.size_bytes,
      storageProvider: saved.storage_provider,
      previewUrl: saved.url,
      metadataJson: {
        ...(saved.file_key ? { object_key: saved.file_key } : {}),
        ...(saved.storage_provider ? { storage_provider: saved.storage_provider } : {})
      }
    });

    const sessionUser = await getSessionUser();
    const prismaCampaignId = await campaignBridgeService.ensurePrismaCampaignOnDraft(input.projectId);
    if (prismaCampaignId && sessionUser && !sessionUser.id.startsWith("demo_")) {
      try {
        await campaignAssetService.uploadLogo(
          prismaCampaignId,
          { id: sessionUser.id, role: sessionUser.role },
          input.file
        );
      } catch {
        // Legacy store + CampaignAsset already saved; Prisma logo sync is best-effort.
      }
    }

    const stored = mapCampaignAssetToStoredProjectAsset(asset, input.projectId);
    return { ok: true, asset: stored, preview_url: saved.url };
  }

  const asset = await addProjectAsset({
    project_id: input.projectId,
    type: "logo",
    file_url: saved.url,
    file_name: saved.file_name,
    file_key: saved.file_key,
    mime_type: saved.mime_type,
    size_bytes: saved.size_bytes,
    storage_provider: saved.storage_provider
  });

  return { ok: true, asset, preview_url: saved.url };
}
