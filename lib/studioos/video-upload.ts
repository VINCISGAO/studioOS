import { promises as fs } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads", "review");
const MAX_BYTES = 50 * 1024 * 1024;

export function reviewVideoPublicUrl(orderId: string, version: number) {
  return `/api/review-video/${orderId}/${version}`;
}

export async function saveReviewVideoUpload(
  orderId: string,
  version: number,
  file: File
): Promise<{ ok: true; url: string; file_name: string } | { ok: false; error: string }> {
  if (!file.size) {
    return { ok: false, error: "Empty file" };
  }

  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File exceeds 50MB limit" };
  }

  const mime = file.type || "application/octet-stream";
  const name = file.name.toLowerCase();
  const isMp4 = mime === "video/mp4" || name.endsWith(".mp4");
  if (!isMp4) {
    return { ok: false, error: "Only MP4 videos are supported" };
  }

  const dir = path.join(UPLOAD_DIR, orderId);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `v${version}.mp4`);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return {
    ok: true,
    url: reviewVideoPublicUrl(orderId, version),
    file_name: file.name
  };
}

export function reviewVideoFilePath(orderId: string, version: number) {
  return path.join(UPLOAD_DIR, orderId, `v${version}.mp4`);
}
