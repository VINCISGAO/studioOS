import path from "path";
import { putObject } from "@/lib/studioos/object-storage";

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function resolveImageMime(file: File): string | null {
  if (file.type && ALLOWED_MIME.has(file.type)) {
    return file.type;
  }

  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".heic") || name.endsWith(".heif")) return null;

  return file.type && ALLOWED_MIME.has(file.type) ? file.type : null;
}

function extForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
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

  const mime = resolveImageMime(file);
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
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileKey = projectAssetObjectKey(projectId, fileName);
  let stored: Awaited<ReturnType<typeof putObject>>;
  try {
    stored = await putObject(fileKey, buffer, mime);
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error && error.message.includes("Durable object storage")
          ? "Production asset storage is not configured. Configure R2/S3 before uploading brand assets."
          : "Failed to store brand asset"
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
