import path from "path";
import { putObject } from "@/lib/studioos/object-storage";
import { resolveTrustedImageMime, looksLikeSupportedVideo } from "@/lib/studioos/upload-magic-bytes";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads", "creators");
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PROFILE_VIDEO_BYTES = 300 * 1024 * 1024;

const ALLOWED_VIDEO_MIME = new Set(["video/mp4", "video/quicktime", "video/webm"]);

function extForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

function videoExtForFile(file: File) {
  const mime = file.type || "application/octet-stream";
  const name = file.name.toLowerCase();
  if (mime === "video/webm" || name.endsWith(".webm")) return "webm";
  if (mime === "video/quicktime" || name.endsWith(".mov")) return "mov";
  return "mp4";
}

function videoMimeForFile(file: File) {
  const extension = videoExtForFile(file);
  if (extension === "webm") return "video/webm";
  if (extension === "mov") return "video/quicktime";
  return "video/mp4";
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

async function saveCreatorImageUpload(
  creatorId: string,
  file: File,
  fileNamePrefix: "avatar" | "cover"
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

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = resolveTrustedImageMime(file, buffer);
  if (!mime) {
    const name = file.name.toLowerCase();
    if (name.endsWith(".heic") || name.endsWith(".heif")) {
      return { ok: false, error: "HEIC/HEIF is not supported — export as JPG or PNG first" };
    }
    return { ok: false, error: "Only JPEG, PNG, WebP, and GIF images are supported" };
  }

  const fileName = `${fileNamePrefix}_${Date.now()}.${extForMime(mime)}`;
  const fileKey = creatorAvatarObjectKey(creatorId, fileName);
  let stored: Awaited<ReturnType<typeof putObject>>;
  try {
    stored = await putObject(fileKey, buffer, mime);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown storage error";
    return {
      ok: false,
      error:
        message.includes("Durable object storage")
          ? "Production asset storage is not configured. Configure R2/S3 before uploading creator assets."
          : `Failed to store creator asset: ${message}`
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

export async function saveCreatorAvatarUpload(creatorId: string, file: File) {
  return saveCreatorImageUpload(creatorId, file, "avatar");
}

export async function saveCreatorCoverUpload(creatorId: string, file: File) {
  return saveCreatorImageUpload(creatorId, file, "cover");
}

export async function saveCreatorWorkVideoUpload(creatorId: string, file: File): Promise<
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

  if (file.size > MAX_PROFILE_VIDEO_BYTES) {
    return { ok: false, error: "File exceeds 300MB limit" };
  }

  const mime = videoMimeForFile(file);
  const name = file.name.toLowerCase();
  const allowedByName = /\.(mp4|mov|webm)$/i.test(name);
  if (!ALLOWED_VIDEO_MIME.has(file.type || mime) && !allowedByName) {
    return { ok: false, error: "Only MP4, MOV, and WebM videos are supported" };
  }

  const extension = videoExtForFile(file);
  const fileName = `work_${Date.now()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!looksLikeSupportedVideo(buffer, extension)) {
    return { ok: false, error: "File content does not match the selected video type" };
  }
  const fileKey = creatorAvatarObjectKey(creatorId, fileName);

  let stored: Awaited<ReturnType<typeof putObject>>;
  try {
    stored = await putObject(fileKey, buffer, mime);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown storage error";
    return {
      ok: false,
      error:
        message.includes("Durable object storage")
          ? "Production asset storage is not configured. Configure R2/S3 before uploading creator videos."
          : `Failed to store creator video: ${message}`
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
