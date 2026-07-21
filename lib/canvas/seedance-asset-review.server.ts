import "server-only";

import sharp from "sharp";
import type { SeedanceReview, SeedanceReviewStatus } from "@/lib/canvas/canvas-asset-metadata";

type ReviewInput = {
  buffer: Buffer;
  mimeType: string;
  assetType: "REFERENCE_IMAGE" | "REFERENCE_VIDEO" | "MUSIC";
  locale?: "zh" | "en";
};

function reviewResult(
  status: SeedanceReviewStatus,
  reasons: string[],
  locale: "zh" | "en"
): SeedanceReview {
  return {
    status,
    reasons,
    reviewedAt: new Date().toISOString(),
    reviewer: "seedance_auto"
  };
}

async function reviewImage(buffer: Buffer, mimeType: string, locale: "zh" | "en") {
  const reasons: string[] = [];
  const zh = locale === "zh";

  if (mimeType === "image/gif") {
    reasons.push(zh ? "Seedance 角色素材不支持 GIF" : "Seedance character assets do not support GIF");
  }

  try {
    const image = sharp(buffer, { failOn: "none" });
    const meta = await image.metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;

    if (width < 512 || height < 512) {
      reasons.push(
        zh
          ? "图片短边需至少 512px（Seedance 素材要求）"
          : "Shortest side must be at least 512px (Seedance requirement)"
      );
    }
    if (width > 4096 || height > 4096) {
      reasons.push(
        zh ? "图片长边不能超过 4096px" : "Longest side must not exceed 4096px"
      );
    }
    if (width > 0 && height > 0) {
      const ratio = width / height;
      if (ratio < 0.4 || ratio > 2.5) {
        reasons.push(
          zh
            ? "宽高比需在 2:5 到 5:2 之间"
            : "Aspect ratio must be between 2:5 and 5:2"
        );
      }
    }
  } catch {
    reasons.push(zh ? "无法读取图片尺寸，请重新上传" : "Unable to read image dimensions");
  }

  return reviewResult(reasons.length ? "REJECTED" : "APPROVED", reasons, locale);
}

function reviewVideo(buffer: Buffer, locale: "zh" | "en") {
  const reasons: string[] = [];
  const zh = locale === "zh";

  if (buffer.length > 200 * 1024 * 1024) {
    reasons.push(zh ? "视频不能超过 200MB" : "Video must be 200MB or smaller");
  }

  const header = buffer.subarray(0, 12).toString("ascii");
  const looksValid =
    header.includes("ftyp") || buffer.subarray(0, 4).toString("ascii") === "RIFF";
  if (!looksValid) {
    reasons.push(zh ? "视频文件头校验失败" : "Video header validation failed");
  }

  return reviewResult(reasons.length ? "REJECTED" : "APPROVED", reasons, locale);
}

function reviewAudio(locale: "zh" | "en") {
  return reviewResult("APPROVED", [], locale);
}

export async function reviewSeedanceLibraryAsset(input: ReviewInput): Promise<SeedanceReview> {
  const locale = input.locale ?? "zh";
  if (input.assetType === "REFERENCE_IMAGE") {
    return reviewImage(input.buffer, input.mimeType, locale);
  }
  if (input.assetType === "REFERENCE_VIDEO") {
    return reviewVideo(input.buffer, locale);
  }
  return reviewAudio(locale);
}
