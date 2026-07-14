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

function extForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

async function encodeAvifBuffer(resized: sharp.Sharp) {
  try {
    return await resized.clone().avif({ quality: 50 }).toBuffer();
  } catch {
    return null;
  }
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
    resized.clone().webp({ quality: 82 }).toBuffer(),
    encodeAvifBuffer(resized)
  ]);

  await putObject(knowledgeCoverObjectKey(originalName), input.buffer, input.mime);
  await putObject(knowledgeCoverObjectKey(webpName), webpBuffer, "image/webp");
  if (avifBuffer) {
    await putObject(knowledgeCoverObjectKey(avifName), avifBuffer, "image/avif");
  }

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
