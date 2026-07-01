/** Video Engine config — Vol 06 + ADR-002 */
export const videoConfig = {
  /** simulate = demo/local manifest; ffmpeg = real transcode pipeline */
  workerMode: (process.env.VIDEO_WORKER_MODE ?? "simulate") as "simulate" | "ffmpeg",
  enforceHlsOnly: process.env.VIDEO_ENFORCE_HLS !== "0",
  signingSecret:
    process.env.PLAYBACK_SIGNING_SECRET ??
    process.env.SESSION_SECRET ??
    "studioos-dev-playback-signing-secret",
  tokenTtlSec: Number(process.env.PLAYBACK_TOKEN_TTL_SEC ?? 3600),
  hlsSegmentSeconds: 6,
  targetHeight: 720,
  watermarkText: process.env.VIDEO_WATERMARK_TEXT ?? "StudioOS Preview",
  maxUploadBytes: 300 * 1024 * 1024,
  redisUrl: process.env.REDIS_URL?.trim() || null,
  queueName: "video.transcode",
  r2: {
    endpoint: process.env.R2_ENDPOINT?.trim() || null,
    accessKey: process.env.R2_ACCESS_KEY?.trim() || null,
    secretKey: process.env.R2_SECRET_KEY?.trim() || null,
    bucket: process.env.R2_BUCKET?.trim() || "studioos",
    region: process.env.R2_REGION?.trim() || "auto"
  },
  demoHlsUrl:
    "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8"
} as const;

export function isFfmpegWorkerMode() {
  return videoConfig.workerMode === "ffmpeg";
}

export function isObjectStorageConfigured() {
  const { endpoint, accessKey, secretKey, bucket } = videoConfig.r2;
  return Boolean(endpoint && accessKey && secretKey && bucket);
}

export function isRedisConfigured() {
  return Boolean(videoConfig.redisUrl);
}

export function hlsStoragePrefix(campaignId: string, versionNumber: number) {
  return `hls/${campaignId}/${versionNumber}`;
}
