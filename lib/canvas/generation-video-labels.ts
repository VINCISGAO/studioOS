import type { VideoQuality } from "@/lib/canvas/generation-ui";

export function formatVideoQualityLabel(quality: VideoQuality) {
  if (quality === "720p") return "HD 720p";
  if (quality === "1080p") return "HD 1080p";
  if (quality === "480p") return "SD 480p";
  if (quality === "4k") return "4K";
  return quality;
}
