import { addProjectAsset } from "@/lib/campaign-store";
import { getProject } from "@/lib/project-service";
import { saveProjectAssetUpload } from "@/lib/studioos/project-asset-upload";
import type { StoredProjectAsset } from "@/lib/campaign-types";

export async function uploadBrandProductImage(input: {
  projectId: string;
  clientEmail: string;
  file: File;
  locale: "en" | "zh";
}): Promise<
  | { ok: true; original: StoredProjectAsset; preview_url: string }
  | { ok: false; error: string; status?: number }
> {
  const project = await getProject(input.projectId);
  if (!project || project.client_email !== input.clientEmail.toLowerCase()) {
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
