import path from "path";
import { putObject } from "@/lib/studioos/object-storage";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads", "creators");
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export function creatorAvatarPublicUrl(creatorId: string, fileName: string) {
  return `/api/creator-assets/${creatorId}/${encodeURIComponent(fileName)}`;
}

export function creatorAvatarFilePath(creatorId: string, fileName: string) {
  return path.join(UPLOAD_DIR, creatorId, fileName);
}

export function creatorAvatarObjectKey(creatorId: string, fileName: string) {
  return `creators/${creatorId}/${fileName}`;
}

export async function saveCreatorAvatarUpload(
  creatorId: string,
  file: File
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

  const fileName = `avatar_${Date.now()}.${extForMime(mime)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileKey = creatorAvatarObjectKey(creatorId, fileName);
  let stored: Awaited<ReturnType<typeof putObject>>;
  try {
    stored = await putObject(fileKey, buffer, mime);
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error && error.message.includes("Durable object storage")
          ? "Production asset storage is not configured. Configure R2/S3 before uploading creator assets."
          : "Failed to store creator asset"
    };
  }

  return {
    ok: true,
    url: creatorAvatarPublicUrl(creatorId, fileName),
    file_name: file.name || fileName,
    file_key: stored.key,
    storage_provider: stored.backend,
    mime_type: mime,
    size_bytes: file.size
  };
}
