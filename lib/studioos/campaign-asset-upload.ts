import { promises as fs } from "fs";
import path from "path";

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

export async function saveCampaignAssetUpload(
  campaignId: string,
  file: File,
  prefix: string
): Promise<
  | { ok: true; url: string; file_name: string; file_key: string; mime_type: string; size_bytes: number }
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

  const dir = path.join(UPLOAD_DIR, campaignId);
  await fs.mkdir(dir, { recursive: true });
  const storedName = `${prefix}_${Date.now()}.${extForMime(mime)}`;
  const filePath = path.join(dir, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return {
    ok: true,
    url: campaignAssetPublicUrl(campaignId, storedName),
    file_name: file.name || storedName,
    file_key: `campaigns/${campaignId}/${storedName}`,
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
  | { ok: true; url: string; file_name: string; file_key: string; mime_type: string; size_bytes: number }
  | { ok: false; error: string }
> {
  const buffer = await fs.readFile(input.sourceFilePath);
  if (buffer.length > MAX_BYTES) return { ok: false, error: "File exceeds 10MB limit" };

  const dir = path.join(UPLOAD_DIR, input.campaignId);
  await fs.mkdir(dir, { recursive: true });
  const storedName = `${input.prefix}_${Date.now()}.${extForMime(input.mimeType)}`;
  await fs.writeFile(path.join(dir, storedName), buffer);

  return {
    ok: true,
    url: campaignAssetPublicUrl(input.campaignId, storedName),
    file_name: input.fileName,
    file_key: `campaigns/${input.campaignId}/${storedName}`,
    mime_type: input.mimeType,
    size_bytes: buffer.length
  };
}
