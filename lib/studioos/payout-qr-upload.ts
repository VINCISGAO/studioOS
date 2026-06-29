import { promises as fs } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads", "payout-qr");
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function extForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export function payoutQrPublicUrl(creatorId: string, fileName: string) {
  return `/api/payout-qr/${creatorId}/${encodeURIComponent(fileName)}`;
}

export function payoutQrFilePath(creatorId: string, fileName: string) {
  return path.join(UPLOAD_DIR, creatorId, fileName);
}

export async function savePayoutQrUpload(
  creatorId: string,
  file: File
): Promise<
  | { ok: true; url: string; file_name: string; mime_type: string; size_bytes: number }
  | { ok: false; error: string }
> {
  if (!file.size) {
    return { ok: false, error: "Empty file" };
  }

  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File exceeds 5MB limit" };
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mime)) {
    return { ok: false, error: "Only JPEG, PNG, and WebP images are supported" };
  }

  const dir = path.join(UPLOAD_DIR, creatorId);
  await fs.mkdir(dir, { recursive: true });
  const fileName = `qr_${Date.now()}.${extForMime(mime)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, fileName), buffer);

  return {
    ok: true,
    url: payoutQrPublicUrl(creatorId, fileName),
    file_name: file.name || fileName,
    mime_type: mime,
    size_bytes: file.size
  };
}
