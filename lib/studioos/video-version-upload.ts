import { promises as fs } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads", "campaigns");
const HLS_DIR = path.join(process.cwd(), ".data", "hls");
const MAX_BYTES = 500 * 1024 * 1024;

const ALLOWED_MIME = new Set(["video/mp4", "video/quicktime", "video/webm"]);

function resolveVideoMime(file: File): string | null {
  if (file.type && ALLOWED_MIME.has(file.type)) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".mp4")) return "video/mp4";
  if (name.endsWith(".mov")) return "video/quicktime";
  if (name.endsWith(".webm")) return "video/webm";
  return null;
}

export function videoVersionPublicUrl(campaignId: string, fileName: string) {
  return `/api/campaign-videos/${campaignId}/${encodeURIComponent(fileName)}`;
}

export function videoVersionFilePath(campaignId: string, fileName: string) {
  return path.join(UPLOAD_DIR, campaignId, fileName);
}

export function hlsManifestPublicUrl(campaignId: string, versionNumber: number) {
  return `/api/hls/${campaignId}/${versionNumber}/index.m3u8`;
}

export function hlsManifestFilePath(campaignId: string, versionNumber: number) {
  return path.join(HLS_DIR, campaignId, String(versionNumber), "index.m3u8");
}

export async function saveVideoVersionUpload(
  campaignId: string,
  versionNumber: number,
  file: File
): Promise<
  | { ok: true; url: string; file_name: string; file_key: string; mime_type: string; size_bytes: number }
  | { ok: false; error: string }
> {
  if (!file.size) return { ok: false, error: "Empty file" };
  if (file.size > MAX_BYTES) return { ok: false, error: "File exceeds 500MB limit" };

  const mime = resolveVideoMime(file);
  if (!mime) return { ok: false, error: "Only MP4, MOV, and WebM videos are supported" };

  const dir = path.join(UPLOAD_DIR, campaignId);
  await fs.mkdir(dir, { recursive: true });
  const storedName = `v${versionNumber}_${Date.now()}.mp4`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, storedName), buffer);

  return {
    ok: true,
    url: videoVersionPublicUrl(campaignId, storedName),
    file_name: file.name || storedName,
    file_key: `campaigns/${campaignId}/${storedName}`,
    mime_type: mime,
    size_bytes: file.size
  };
}

export async function saveVideoVersionFromBuffer(input: {
  campaignId: string;
  versionNumber: number;
  buffer: Buffer;
  fileName: string;
}): Promise<{ ok: true; url: string; file_key: string; storedName: string } | { ok: false; error: string }> {
  if (!input.buffer.length) return { ok: false, error: "Empty file" };
  if (input.buffer.length > MAX_BYTES) return { ok: false, error: "File exceeds 500MB limit" };

  const dir = path.join(UPLOAD_DIR, input.campaignId);
  await fs.mkdir(dir, { recursive: true });
  const storedName = `v${input.versionNumber}_${Date.now()}.mp4`;
  await fs.writeFile(path.join(dir, storedName), input.buffer);

  return {
    ok: true,
    url: videoVersionPublicUrl(input.campaignId, storedName),
    file_key: `campaigns/${input.campaignId}/${storedName}`,
    storedName
  };
}

/** Minimal VOD playlist — segments served via signed playback route (ADR-002). */
export async function writeSimulatedHlsManifest(input: {
  campaignId: string;
  versionNumber: number;
  storagePrefix?: string;
  mp4Url?: string;
}) {
  const dir = path.join(HLS_DIR, input.campaignId, String(input.versionNumber));
  await fs.mkdir(dir, { recursive: true });
  const manifest = [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    "#EXT-X-TARGETDURATION:10",
    "#EXT-X-MEDIA-SEQUENCE:0",
    "#EXT-X-PLAYLIST-TYPE:VOD",
    "#EXTINF:10.0,",
    "seg000.ts",
    "#EXT-X-ENDLIST",
    ""
  ].join("\n");
  await fs.writeFile(path.join(dir, "index.m3u8"), manifest);
  await fs.writeFile(path.join(dir, "seg000.ts"), Buffer.from("simulated-hls-segment"));
  return input.storagePrefix ?? `hls/${input.campaignId}/${input.versionNumber}`;
}
