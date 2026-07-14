import "server-only";

import { randomUUID } from "crypto";
import sharp from "sharp";
import { putObject } from "@/lib/studioos/object-storage";
import {
  knowledgeCoverAssetUrl,
  knowledgeCoverObjectKey
} from "@/lib/knowledge/knowledge-cover-process.shared";

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

/** Fast path for inline body images — one optimized asset, no AVIF/original copies. */
export async function processKnowledgeInlineUpload(input: { buffer: Buffer; mime: string }) {
  const baseId = randomUUID();

  if (input.mime === "image/gif") {
    const gifName = `${baseId}.gif`;
    await putObject(knowledgeCoverObjectKey(gifName), input.buffer, input.mime);
    const url = knowledgeCoverAssetUrl(gifName);
    return {
      url,
      fallback_url: url,
      sources: [{ type: "image/gif", url }],
      file_name: gifName,
      mime_type: input.mime,
      original_file_name: gifName
    };
  }

  const webpName = `${baseId}.webp`;
  const webpBuffer = await withTimeout(
    sharp(input.buffer)
      .rotate()
      .resize(INLINE_MAX_WIDTH, INLINE_MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer(),
    IMAGE_PROCESS_TIMEOUT_MS,
    "Inline image processing"
  );

  await putObject(knowledgeCoverObjectKey(webpName), webpBuffer, "image/webp");
  const url = knowledgeCoverAssetUrl(webpName);

  return {
    url,
    fallback_url: url,
    sources: [{ type: "image/webp", url }],
    file_name: webpName,
    mime_type: "image/webp",
    original_file_name: webpName
  };
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

  const [webpBuffer, avifBuffer] = await Promise.all([
    withTimeout(resized.clone().webp({ quality: 82 }).toBuffer(), IMAGE_PROCESS_TIMEOUT_MS, "WebP encoding"),
    encodeAvifBuffer(resized)
  ]);

  await Promise.all([
    putObject(knowledgeCoverObjectKey(originalName), input.buffer, input.mime),
    putObject(knowledgeCoverObjectKey(webpName), webpBuffer, "image/webp"),
    ...(avifBuffer ? [putObject(knowledgeCoverObjectKey(avifName), avifBuffer, "image/avif")] : [])
  ]);

  const sources = [
    { type: "image/webp", url: knowledgeCoverAssetUrl(webpName) },
    ...(avifBuffer ? [{ type: "image/avif", url: knowledgeCoverAssetUrl(avifName) }] : [])
  ];

  return {
    url: knowledgeCoverAssetUrl(webpName),
    fallback_url: knowledgeCoverAssetUrl(originalName),
    sources,
    file_name: webpName,
    mime_type: "image/webp",
    original_file_name: originalName
  };
}
