import path from "path";
import { promises as fs } from "fs";
import {
  MAX_DELIVERABLE_VIDEO_BYTES,
  maxDeliverableVideoLabel
} from "@/lib/studioos/deliverable-video-policy-shared";
import { isObjectStorageConfigured } from "@/lib/core/config/video";
import type { Locale } from "@/lib/i18n";
import { deleteObject, getObjectMetadata, getObjectRange, putObject } from "@/lib/studioos/object-storage";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads", "review");

export function reviewVideoPublicUrl(orderId: string, version: number) {
  return `/api/review-video/${orderId}/${version}`;
}

export function reviewVideoObjectKey(orderId: string, version: number, extension: "mp4" | "mov") {
  return `review/${orderId}/v${version}.${extension}`;
}

export async function saveReviewVideoUpload(
  orderId: string,
  version: number,
  file: File,
  locale: Locale = "en"
): Promise<{ ok: true; url: string; file_name: string } | { ok: false; error: string }> {
  if (!file.size) {
    return { ok: false, error: "Empty file" };
  }

  if (file.size > MAX_DELIVERABLE_VIDEO_BYTES) {
    return {
      ok: false,
      error:
        locale === "zh"
          ? `文件超过 ${maxDeliverableVideoLabel("zh")} 限制`
          : `File exceeds ${maxDeliverableVideoLabel("en")} limit`
    };
  }

  const mime = file.type || "application/octet-stream";
  const name = file.name.toLowerCase();
  const isMp4 = mime === "video/mp4" || name.endsWith(".mp4");
  const isMov = mime === "video/quicktime" || name.endsWith(".mov");
  if (!isMp4 && !isMov) {
    return {
      ok: false,
      error: locale === "zh" ? "仅支持 MP4 / MOV 视频" : "Only MP4 / MOV videos are supported"
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = isMov ? "mov" : "mp4";
  if (isObjectStorageConfigured()) {
    try {
      await putObject(reviewVideoObjectKey(orderId, version, extension), buffer, mime);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown storage error";
      return {
        ok: false,
        error:
          locale === "zh"
            ? `视频上传到云存储失败：${message}`
            : `Failed to store review video: ${message}`
      };
    }
  } else {
    const dir = path.join(UPLOAD_DIR, orderId);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `v${version}.${extension}`);
    await fs.writeFile(filePath, buffer);
  }

  return {
    ok: true,
    url: reviewVideoPublicUrl(orderId, version),
    file_name: file.name
  };
}

export function reviewVideoFilePath(orderId: string, version: number) {
  return path.join(UPLOAD_DIR, orderId, `v${version}.mp4`);
}

type ReviewVideoFile = {
  path: string;
  contentType: string;
  extension: string;
};

export type ReviewVideoObject = {
  key: string;
  contentType: string;
  extension: "mp4" | "mov";
  contentLength: number | null;
};

function reviewVideoCandidate(orderId: string, version: number, extension: "mp4" | "mov"): ReviewVideoFile {
  return {
    path: path.join(UPLOAD_DIR, orderId, `v${version}.${extension}`),
    contentType: extension === "mov" ? "video/quicktime" : "video/mp4",
    extension
  };
}

async function listReviewVideoFilesOnDisk(orderId: string): Promise<Array<ReviewVideoFile & { version: number }>> {
  const dir = path.join(UPLOAD_DIR, orderId);
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }

  return entries
    .map((name) => {
      const match = /^v(\d+)\.(mp4|mov)$/.exec(name);
      if (!match) return null;
      const entryVersion = Number(match[1]);
      if (!Number.isFinite(entryVersion) || entryVersion < 1) return null;
      const extension = match[2] as "mp4" | "mov";
      return { version: entryVersion, ...reviewVideoCandidate(orderId, entryVersion, extension) };
    })
    .filter((item): item is ReviewVideoFile & { version: number } => item !== null)
    .sort((a, b) => b.version - a.version);
}

export async function findReviewVideoFile(orderId: string, version: number) {
  for (const extension of ["mp4", "mov"] as const) {
    const candidate = reviewVideoCandidate(orderId, version, extension);
    try {
      await fs.access(candidate.path);
      return candidate;
    } catch {
      // Try the next supported review video format.
    }
  }

  const onDisk = await listReviewVideoFilesOnDisk(orderId);
  if (onDisk.length === 0) {
    return null;
  }

  // Recover from DB/on-disk slot mismatches (e.g. file saved as v1 while Prisma pointed at v2).
  if (onDisk.length === 1) {
    const [onlyFile] = onDisk;
    return onlyFile;
  }

  const nearestLower = onDisk.find((item) => item.version <= version);
  return nearestLower ?? null;
}

export async function findReviewVideoObject(
  orderId: string,
  version: number
): Promise<ReviewVideoObject | null> {
  for (const extension of ["mp4", "mov"] as const) {
    const key = reviewVideoObjectKey(orderId, version, extension);
    const metadata = await getObjectMetadata(key);
    if (metadata) {
      return {
        key,
        contentType: metadata.contentType ?? (extension === "mov" ? "video/quicktime" : "video/mp4"),
        extension,
        contentLength: metadata.contentLength
      };
    }
  }
  return null;
}

export async function readReviewVideoObjectRange(
  key: string,
  range?: { start: number; end: number }
) {
  return getObjectRange(key, range);
}

export async function deleteReviewVideoSlotFiles(orderId: string, version: number) {
  for (const extension of ["mp4", "mov"] as const) {
    if (isObjectStorageConfigured()) {
      await deleteObject(reviewVideoObjectKey(orderId, version, extension));
    }
    try {
      await fs.unlink(reviewVideoCandidate(orderId, version, extension).path);
    } catch {
      // Slot may already be empty.
    }
  }
}

export async function hasReviewVideoFileOnDisk(orderId: string, version: number) {
  if (await findReviewVideoObject(orderId, version)) {
    return true;
  }
  for (const extension of ["mp4", "mov"] as const) {
    try {
      await fs.access(reviewVideoCandidate(orderId, version, extension).path);
      return true;
    } catch {
      // Exact slot missing — do not count fallback files from other versions.
    }
  }
  return false;
}

export async function hasPlayableReviewVideo(orderId: string, version: number) {
  if (await findReviewVideoObject(orderId, version)) {
    return true;
  }
  return (await findReviewVideoFile(orderId, version)) !== null;
}

export function readReviewVideoSlotVersion(filePath: string): number | null {
  const match = /[/\\]v(\d+)\.(mp4|mov)$/.exec(filePath);
  if (!match) return null;
  const version = Number(match[1]);
  return Number.isFinite(version) && version >= 1 ? version : null;
}
