import type { StoredDeliverable } from "@/lib/order-types";

/** Bundled demo clip — served from /public/demo after ensure-demo-review-video.mjs */
export const DEMO_REVIEW_VIDEO_URL = "/demo/review-sample.mp4?v=destiny-transfer-2";

export const DEMO_REVIEW_VIDEO_FALLBACKS = [
  DEMO_REVIEW_VIDEO_URL,
  "/api/demo-review-video"
] as const;

const LEGACY_DEMO_HOSTS = [
  "commondatastorage.googleapis.com",
  "gtv-videos-bucket",
  "storage.googleapis.com"
];

export function isDemoReviewOrder(orderId: string) {
  return orderId.startsWith("ord_demo_");
}

export function reviewVideoUrlForVersion(orderId: string, version: number) {
  return `/api/review-video/${orderId}/${version}`;
}

export function isReviewVideoApiUrl(url: string) {
  return url.trim().startsWith("/api/review-video/");
}

export function isBundledDemoReviewVideoUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return false;
  return trimmed.includes("/demo/review-sample.mp4") || trimmed.startsWith("/api/demo-review-video");
}

export function isLegacyExternalDemoVideoUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed.startsWith("http")) return false;
  return LEGACY_DEMO_HOSTS.some((host) => trimmed.includes(host));
}

export function shouldUseDemoPlaybackUrl(fileUrl: string, orderId?: string) {
  if (orderId && !isDemoReviewOrder(orderId)) {
    return false;
  }

  const trimmed = fileUrl.trim();
  if (!trimmed) return true;
  if (isBundledDemoReviewVideoUrl(trimmed)) return true;
  if (isLegacyExternalDemoVideoUrl(trimmed)) return true;
  return false;
}

export function resolveReviewPlaybackUrl(input: {
  fileUrl: string;
  orderId: string;
  version: number;
}): string {
  const trimmed = input.fileUrl.trim();
  const demoOrder = isDemoReviewOrder(input.orderId);

  if (demoOrder && shouldUseDemoPlaybackUrl(trimmed, input.orderId)) {
    return DEMO_REVIEW_VIDEO_URL;
  }

  if (!trimmed || isBundledDemoReviewVideoUrl(trimmed) || isLegacyExternalDemoVideoUrl(trimmed)) {
    return reviewVideoUrlForVersion(input.orderId, input.version);
  }

  if (isReviewVideoApiUrl(trimmed)) {
    return trimmed;
  }

  return trimmed;
}

export function normalizeDeliverablePlaybackUrl(
  deliverable: StoredDeliverable,
  orderId: string
): StoredDeliverable {
  return {
    ...deliverable,
    file_url: resolveReviewPlaybackUrl({
      fileUrl: deliverable.file_url,
      orderId,
      version: deliverable.version
    })
  };
}
