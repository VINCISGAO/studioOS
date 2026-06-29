import { promises as fs } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads", "projects");
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
  return path.join(UPLOAD_DIR, projectId, fileName);
}

export async function saveProjectAssetUpload(
  projectId: string,
  file: File,
  prefix: string
): Promise<
  | { ok: true; url: string; file_name: string; mime_type: string; size_bytes: number }
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

  const dir = path.join(UPLOAD_DIR, projectId);
  await fs.mkdir(dir, { recursive: true });
  const fileName = `${prefix}_${Date.now()}.${extForMime(mime)}`;
  const filePath = path.join(dir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return {
    ok: true,
    url: projectAssetPublicUrl(projectId, fileName),
    file_name: file.name || fileName,
    mime_type: mime,
    size_bytes: file.size
  };
}

export async function saveProjectAssetBuffer(
  projectId: string,
  buffer: Buffer,
  prefix: string,
  mime = "image/jpeg"
): Promise<{ ok: true; url: string; file_name: string; mime_type: string; size_bytes: number }> {
  const dir = path.join(UPLOAD_DIR, projectId);
  await fs.mkdir(dir, { recursive: true });
  const fileName = `${prefix}_${Date.now()}.${extForMime(mime)}`;
  await fs.writeFile(path.join(dir, fileName), buffer);
  return {
    ok: true,
    url: projectAssetPublicUrl(projectId, fileName),
    file_name: fileName,
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
