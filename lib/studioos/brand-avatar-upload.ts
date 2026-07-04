import path from "path";
import { putObject } from "@/lib/studioos/object-storage";

const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export function brandAvatarPublicUrl(brandId: string, fileName: string) {
  return `/api/brand-assets/${brandId}/${encodeURIComponent(fileName)}`;
}

export function brandAvatarFilePath(brandId: string, fileName: string) {
  return path.join(process.cwd(), ".data", "uploads", "brands", brandId, fileName);
}

export function brandAvatarObjectKey(brandId: string, fileName: string) {
  return `brands/${brandId}/${fileName}`;
}

type BrandUploadResult =
  | {
      ok: true;
      url: string;
      file_name: string;
      file_key: string;
      storage_provider: string;
      mime_type: string;
      size_bytes: number;
    }
  | { ok: false; error: string };

async function saveBrandImageUpload(
  brandId: string,
  file: File,
  fileNamePrefix: "logo" | "cover"
): Promise<BrandUploadResult> {
  if (!file.size) {
    return { ok: false, error: "Empty file" };
  }

  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File exceeds 5MB limit" };
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mime)) {
    return { ok: false, error: "Only JPEG, PNG, WebP, and GIF images are supported" };
  }

  const fileName = `${fileNamePrefix}_${Date.now()}.${extForMime(mime)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileKey = brandAvatarObjectKey(brandId, fileName);

  let stored: Awaited<ReturnType<typeof putObject>>;
  try {
    stored = await putObject(fileKey, buffer, mime);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown storage error";
    return {
      ok: false,
      error:
        message.includes("Durable object storage")
          ? "Production asset storage is not configured. Configure R2/S3 before uploading brand assets."
          : `Failed to store brand asset: ${message}`
    };
  }

  return {
    ok: true,
    url: brandAvatarPublicUrl(brandId, fileName),
    file_name: file.name || fileName,
    file_key: stored.key,
    storage_provider: stored.backend,
    mime_type: mime,
    size_bytes: file.size
  };
}

export async function saveBrandAvatarUpload(brandId: string, file: File): Promise<BrandUploadResult> {
  return saveBrandImageUpload(brandId, file, "logo");
}

export async function saveBrandCoverUpload(brandId: string, file: File): Promise<BrandUploadResult> {
  return saveBrandImageUpload(brandId, file, "cover");
}
