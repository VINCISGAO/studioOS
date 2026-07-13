import type { ReferenceType } from "@/lib/campaign-types";

export function detectReferenceType(url: string): ReferenceType {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.includes("instagram.com")) return "instagram";
  if (lower.includes("vimeo.com")) return "vimeo";
  if (lower.includes("pinterest.")) return "pinterest";
  if (lower.includes("behance.net")) return "behance";
  if (/\.(mp4|mov|webm)(\?|$)/i.test(lower)) return "mp4";
  if (/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(lower)) return "image";
  return "link";
}
