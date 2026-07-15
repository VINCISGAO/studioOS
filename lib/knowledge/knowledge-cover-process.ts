import "server-only";

import { randomUUID } from "crypto";
import sharp from "sharp";
import { putObject } from "@/lib/studioos/object-storage";
import {
  knowledgeAssetObjectKey,
  knowledgePublicAssetUrl
} from "@/lib/knowledge/knowledge-asset-urls";

const COVER_MAX_WIDTH = 1600;
const COVER_MAX_HEIGHT = 900;
const INLINE_MAX_WIDTH = 1400;
const INLINE_MAX_HEIGHT = 1400;
const IMAGE_PROCESS_TIMEOUT_MS = 25_000;

function extForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

async function encodeAvifBuffer(resized: sharp.Sharp) {
  try {
    return await withTimeout(
      resized.clone().avif({ quality: 50 }).toBuffer(),
      IMAGE_PROCESS_TIMEOUT_MS,
      "AVIF encoding"
    );
  } catch {
    return null;
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function buildUploadPayload(input: {
  fileName: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
  fallbackFileName?: string;
  sources?: Array<{ type: string; url: string }>;
}) {
  const key = knowledgeAssetObjectKey(input.fileName);
  const publicUrl = knowledgePublicAssetUrl(input.fileName);
  const fallbackUrl = input.fallbackFileName
    ? knowledgePublicAssetUrl(input.fallbackFileName)
    : publicUrl;
  return {
    key,
    publicUrl,
    url: publicUrl,
    fallback_url: fallbackUrl,
    width: input.width ?? null,
    height: input.height ?? null,
    mimeType: input.mimeType,
    sources: input.sources ?? [{ type: input.mimeType, url: publicUrl }],
    file_name: input.fileName,
    mime_type: input.mimeType,
    original_file_name: input.fallbackFileName ?? input.fileName
  };
}

/** Fast path for inline body images — one optimized asset, no AVIF/original copies. */
export async function processKnowledgeInlineUpload(input: { buffer: Buffer; mime: string }) {
  const baseId = randomUUID();

  if (input.mime === "image/gif") {
    const gifName = `${baseId}.gif`;
    const meta = await sharp(input.buffer).metadata();
    await putObject(knowledgeAssetObjectKey(gifName), input.buffer, input.mime);
    return buildUploadPayload({
      fileName: gifName,
      mimeType: input.mime,
      width: meta.width,
      height: meta.height
    });
  }

  const webpName = `${baseId}.webp`;
  const pipeline = sharp(input.buffer)
    .rotate()
    .resize(INLINE_MAX_WIDTH, INLINE_MAX_HEIGHT, { fit: "inside", withoutEnlargement: true });

  const [webpBuffer, meta] = await Promise.all([
    withTimeout(pipeline.clone().webp({ quality: 80 }).toBuffer(), IMAGE_PROCESS_TIMEOUT_MS, "Inline image processing"),
    pipeline.metadata()
  ]);

  await putObject(knowledgeAssetObjectKey(webpName), webpBuffer, "image/webp");
  return buildUploadPayload({
    fileName: webpName,
    mimeType: "image/webp",
    width: meta.width,
    height: meta.height
  });
}

export async function processKnowledgeCoverUpload(input: { buffer: Buffer; mime: string }) {
  const baseId = randomUUID();
  const originalExt = extForMime(input.mime);
  const originalName = `${baseId}-original.${originalExt}`;
  const webpName = `${baseId}.webp`;
  const avifName = `${baseId}.avif`;

  const resized = sharp(input.buffer).rotate().resize(COVER_MAX_WIDTH, COVER_MAX_HEIGHT, {
    fit: "inside",
    withoutEnlargement: true
  });

  const [webpBuffer, avifBuffer, meta] = await Promise.all([
    withTimeout(resized.clone().webp({ quality: 82 }).toBuffer(), IMAGE_PROCESS_TIMEOUT_MS, "WebP encoding"),
    encodeAvifBuffer(resized),
    resized.metadata()
  ]);

  await Promise.all([
    putObject(knowledgeAssetObjectKey(originalName), input.buffer, input.mime),
    putObject(knowledgeAssetObjectKey(webpName), webpBuffer, "image/webp"),
    ...(avifBuffer ? [putObject(knowledgeAssetObjectKey(avifName), avifBuffer, "image/avif")] : [])
  ]);

  const sources = [
    { type: "image/webp", url: knowledgePublicAssetUrl(webpName) },
    ...(avifBuffer ? [{ type: "image/avif", url: knowledgePublicAssetUrl(avifName) }] : [])
  ];

  return buildUploadPayload({
    fileName: webpName,
    mimeType: "image/webp",
    width: meta.width,
    height: meta.height,
    fallbackFileName: originalName,
    sources
  });
}
