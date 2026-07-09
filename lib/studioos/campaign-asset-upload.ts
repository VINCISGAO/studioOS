import { promises as fs } from "fs";
import path from "path";
import { putObject } from "@/lib/studioos/object-storage";
import { detectImageMimeFromMagicBytes } from "@/lib/studioos/upload-magic-bytes";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads", "campaigns");
const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function resolveImageMime(file: File): string | null {
  if (file.type && ALLOWED_MIME.has(file.type)) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return null;
}

function extForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export function campaignAssetPublicUrl(campaignId: string, fileName: string) {
  return `/api/campaign-assets/${campaignId}/${encodeURIComponent(fileName)}`;
}

export function campaignAssetFilePath(campaignId: string, fileName: string) {
  return path.join(UPLOAD_DIR, campaignId, fileName);
}

export function campaignAssetObjectKey(campaignId: string, fileName: string) {
  return `campaigns/${campaignId}/${fileName}`;
}

export async function saveCampaignAssetUpload(
  campaignId: string,
  file: File,
  prefix: string
): Promise<
  | {
      ok: true;
      url: string;
      file_name: string;
      file_key: string;
      storage_provider: string;
      mime_type: string;
      size_bytes: number;
    }
  | { ok: false; error: string }
> {
  if (!file.size) return { ok: false, error: "Empty file" };
  if (file.size > MAX_BYTES) return { ok: false, error: "File exceeds 10MB limit" };

  const mime = resolveImageMime(file);
  if (!mime) {
    const name = file.name.toLowerCase();
    if (name.endsWith(".heic") || name.endsWith(".heif")) {
      return { ok: false, error: "HEIC/HEIF is not supported — export as JPG or PNG first" };
    }
    return { ok: false, error: "Only JPEG, PNG, WebP, and GIF images are supported" };
  }

  const storedName = `${prefix}_${Date.now()}.${extForMime(mime)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedMime = detectImageMimeFromMagicBytes(buffer);
  if (!detectedMime || detectedMime !== mime) {
    return { ok: false, error: "File content does not match the selected image type" };
  }
  const fileKey = campaignAssetObjectKey(campaignId, storedName);
  let stored: Awaited<ReturnType<typeof putObject>>;
  try {
    stored = await putObject(fileKey, buffer, mime);
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error && error.message.includes("Durable object storage")
          ? "Production asset storage is not configured. Configure R2/S3 before uploading brand assets."
          : "Failed to store campaign asset"
    };
  }

  return {
    ok: true,
    url: campaignAssetPublicUrl(campaignId, storedName),
    file_name: file.name || storedName,
    file_key: stored.key,
    storage_provider: stored.backend,
    mime_type: mime,
    size_bytes: file.size
  };
}

export async function saveCampaignAssetFromPath(input: {
  campaignId: string;
  sourceFilePath: string;
  fileName: string;
  mimeType: string;
  prefix: string;
}): Promise<
  | {
      ok: true;
      url: string;
      file_name: string;
      file_key: string;
      storage_provider: string;
      mime_type: string;
      size_bytes: number;
    }
  | { ok: false; error: string }
> {
  const buffer = await fs.readFile(input.sourceFilePath);
  if (buffer.length > MAX_BYTES) return { ok: false, error: "File exceeds 10MB limit" };
  const detectedMime = detectImageMimeFromMagicBytes(buffer);
  if (!detectedMime || detectedMime !== input.mimeType) {
    return { ok: false, error: "File content does not match the selected image type" };
  }

  const storedName = `${input.prefix}_${Date.now()}.${extForMime(input.mimeType)}`;
  const stored = await putObject(campaignAssetObjectKey(input.campaignId, storedName), buffer, input.mimeType);

  return {
    ok: true,
    url: campaignAssetPublicUrl(input.campaignId, storedName),
    file_name: input.fileName,
    file_key: stored.key,
    storage_provider: stored.backend,
    mime_type: input.mimeType,
    size_bytes: buffer.length
  };
}
