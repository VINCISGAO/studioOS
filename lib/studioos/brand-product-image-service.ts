import { addProjectAsset } from "@/lib/campaign-store";
import { brandCampaignRepository } from "@/features/campaign/brand-campaign/brand-campaign.repository";
import { getProject } from "@/lib/project-service";
import { saveProjectAssetUpload } from "@/lib/studioos/project-asset-upload";
import type { StoredProjectAsset } from "@/lib/campaign-types";

async function canAccessProject(projectId: string, clientEmail: string) {
  const normalizedEmail = clientEmail.toLowerCase();
  const project = await getProject(projectId);
  if (project?.client_email.toLowerCase() === normalizedEmail) {
    return true;
  }

  try {
    const campaign = await brandCampaignRepository.findByLegacyProjectId(projectId);
    return campaign?.brand?.email?.toLowerCase() === normalizedEmail;
  } catch {
    return false;
  }
}

export async function uploadBrandProductImage(input: {
  projectId: string;
  clientEmail: string;
  file: File;
  locale: "en" | "zh";
}): Promise<
  | { ok: true; original: StoredProjectAsset; preview_url: string }
  | { ok: false; error: string; status?: number }
> {
  if (!(await canAccessProject(input.projectId, input.clientEmail))) {
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

  const saved = await saveProjectAssetUpload(input.projectId, input.file, "product_original");
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

  const original = await addProjectAsset({
    project_id: input.projectId,
    type: "product_image_original",
    file_url: saved.url,
    file_name: saved.file_name,
    file_key: saved.file_key,
    mime_type: saved.mime_type,
    size_bytes: saved.size_bytes,
    storage_provider: saved.storage_provider
  });

  return { ok: true, original, preview_url: saved.url };
}
