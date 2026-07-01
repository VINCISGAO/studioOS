import { videoConfig, hlsStoragePrefix } from "@/lib/core/config/video";
import { signPayload, verifySignedPayload } from "@/lib/core/signed-url-core";
import type { PlaybackTokenPayload } from "@/features/video/playback-token.types";

export type { PlaybackTokenPayload };

export function createPlaybackToken(input: {
  versionId: string;
  userId: string;
  campaignId: string;
  ttlSec?: number;
}) {
  const payload: PlaybackTokenPayload = {
    v: input.versionId,
    u: input.userId,
    c: input.campaignId,
    exp: Math.floor(Date.now() / 1000) + (input.ttlSec ?? videoConfig.tokenTtlSec)
  };
  return signPayload(payload, videoConfig.signingSecret);
}

export function verifyPlaybackToken(token: string): PlaybackTokenPayload | null {
  const payload = verifySignedPayload<PlaybackTokenPayload>(token, videoConfig.signingSecret);
  if (!payload?.v || !payload.u || !payload.c || !payload.exp) return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function signedPlaybackManifestUrl(token: string) {
  return `/api/v1/playback/${token}/index.m3u8`;
}

export function signedPlaybackSegmentUrl(token: string, segment: string) {
  const safe = segment.replace(/[/\\]/g, "").replace(/\.\./g, "");
  return `/api/v1/playback/${token}/${safe}`;
}

export function resolveHlsStorageKey(input: {
  campaignId: string;
  versionNumber: number;
  hlsUrl: string | null;
}) {
  if (input.hlsUrl?.startsWith("hls/")) return input.hlsUrl;
  return hlsStoragePrefix(input.campaignId, input.versionNumber);
}

export function buildVersionPlayback(
  version: {
    id: string;
    campaignId: string;
    versionNumber: number;
    hlsUrl: string | null;
    thumbnailUrl: string | null;
    status: string;
    reviewStatus: string;
  },
  viewerUserId: string
) {
  const ready =
    Boolean(version.hlsUrl) ||
    version.status === "READY" ||
    ["READY", "REVIEWING", "APPROVED"].includes(version.reviewStatus);

  if (!ready) {
    return { mp4: null, hls: null, thumbnail: version.thumbnailUrl, processing: true };
  }

  const token = createPlaybackToken({
    versionId: version.id,
    userId: viewerUserId,
    campaignId: version.campaignId
  });

  return {
    mp4: null,
    hls: signedPlaybackManifestUrl(token),
    thumbnail: version.thumbnailUrl,
    processing: false
  };
}
