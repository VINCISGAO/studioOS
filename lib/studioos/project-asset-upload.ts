import path from "path";
import { putObject } from "@/lib/studioos/object-storage";
import { resolveTrustedImageMime, looksLikeSupportedVideo } from "@/lib/studioos/upload-magic-bytes";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_REFERENCE_VIDEO_BYTES = 200 * 1024 * 1024;

const ALLOWED_VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm"] as const);

function resolveImageMime(file: File, buffer: Buffer): string | null {
  return resolveTrustedImageMime(file, buffer);
}

function extForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

function resolveReferenceVideo(file: File): { extension: "mp4" | "mov" | "webm"; mime: string } | null {
  const name = file.name.toLowerCase();
  const extension = name.endsWith(".webm") ? "webm" : name.endsWith(".mov") ? "mov" : name.endsWith(".mp4") ? "mp4" : null;
  if (!extension || !ALLOWED_VIDEO_EXTENSIONS.has(extension)) return null;

  const mime = file.type || (extension === "webm" ? "video/webm" : extension === "mov" ? "video/quicktime" : "video/mp4");
  if (!["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"].includes(mime) && extension !== "mov") {
    return null;
  }

  return { extension, mime: extension === "mov" ? "video/quicktime" : extension === "webm" ? "video/webm" : "video/mp4" };
}

export function projectAssetPublicUrl(projectId: string, fileName: string) {
  return `/api/project-assets/${projectId}/${encodeURIComponent(fileName)}`;
}

export function projectAssetFilePath(projectId: string, fileName: string) {
  return path.join(process.cwd(), ".data", "uploads", "projects", projectId, fileName);
}

export function projectAssetObjectKey(projectId: string, fileName: string) {
  return `projects/${projectId}/${fileName}`;
}

export async function saveProjectAssetUpload(
  projectId: string,
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
  if (!file.size) {
    return { ok: false, error: "Empty file" };
  }

  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File exceeds 10MB limit" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = resolveImageMime(file, buffer);
  if (!mime) {
    const name = file.name.toLowerCase();
    if (name.endsWith(".heic") || name.endsWith(".heif")) {
      return {
        ok: false,
        error: "HEIC/HEIF is not supported — export as JPG or PNG first"
      };
    }
    return { ok: false, error: "Only JPEG, PNG, WebP, and GIF images are supported" };
  }

  const fileName = `${prefix}_${Date.now()}.${extForMime(mime)}`;
  const fileKey = projectAssetObjectKey(projectId, fileName);
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
    url: projectAssetPublicUrl(projectId, fileName),
    file_name: file.name || fileName,
    file_key: stored.key,
    storage_provider: stored.backend,
    mime_type: mime,
    size_bytes: file.size
  };
}

export async function saveProjectReferenceImageUpload(
  projectId: string,
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
  return saveProjectAssetUpload(projectId, file, `reference_image_${Date.now()}`);
}

export async function saveProjectReferenceVideoUpload(
  projectId: string,
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

  if (file.size > MAX_REFERENCE_VIDEO_BYTES) {
    return { ok: false, error: "File exceeds 200MB limit" };
  }

  const video = resolveReferenceVideo(file);
  if (!video) {
    return { ok: false, error: "Only MP4, MOV, and WebM videos are supported" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!looksLikeSupportedVideo(buffer, video.extension)) {
    return { ok: false, error: "File content does not match the selected video type" };
  }

  const fileName = `reference_video_${Date.now()}.${video.extension}`;
  const fileKey = projectAssetObjectKey(projectId, fileName);
  let stored: Awaited<ReturnType<typeof putObject>>;
  try {
    stored = await putObject(fileKey, buffer, video.mime);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown storage error";
    return {
      ok: false,
      error:
        message.includes("Durable object storage")
          ? "Production asset storage is not configured. Configure R2/S3 before uploading reference videos."
          : `Failed to store reference video: ${message}`
    };
  }

  return {
    ok: true,
    url: projectAssetPublicUrl(projectId, fileName),
    file_name: file.name || fileName,
    file_key: stored.key,
    storage_provider: stored.backend,
    mime_type: video.mime,
    size_bytes: file.size
  };
}

export async function saveProjectAssetBuffer(
  projectId: string,
  buffer: Buffer,
  prefix: string,
  mime = "image/jpeg"
): Promise<{
  ok: true;
  url: string;
  file_name: string;
  file_key: string;
  storage_provider: string;
  mime_type: string;
  size_bytes: number;
}> {
  const fileName = `${prefix}_${Date.now()}.${extForMime(mime)}`;
  const stored = await putObject(projectAssetObjectKey(projectId, fileName), buffer, mime);
  return {
    ok: true,
    url: projectAssetPublicUrl(projectId, fileName),
    file_name: fileName,
    file_key: stored.key,
    storage_provider: stored.backend,
    mime_type: mime,
    size_bytes: buffer.length
  };
}

export function fileNameFromAssetUrl(fileUrl: string) {
  try {
    const segment = fileUrl.split("/").pop() ?? "";
    return decodeURIComponent(segment);
  } catch {
    return fileUrl.split("/").pop() ?? "";
  }
}
