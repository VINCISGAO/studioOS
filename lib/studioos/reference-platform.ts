import type { ReferenceType } from "@/lib/campaign-types";
import type { Locale } from "@/lib/i18n";
import type { ReferenceAccessStatus, ReferenceInputKind } from "@/lib/studioos/reference-analysis.types";

const REGION_RESTRICTED_TYPES = new Set<ReferenceType>(["youtube", "tiktok", "instagram", "vimeo"]);

export function detectReferenceInputKind(sourceUrl: string, referenceType: ReferenceType): ReferenceInputKind {
  const lower = sourceUrl.toLowerCase();
  if (lower.includes("/api/project-assets/") && lower.includes("reference_video")) {
    return "uploaded_video";
  }
  if (
    lower.includes("/api/project-assets/") &&
    (lower.includes("reference_image") || referenceType === "image")
  ) {
    return "uploaded_image";
  }
  if (referenceType === "mp4") return "uploaded_video";
  if (referenceType === "image") return "uploaded_image";
  return "link";
}

export function referencePlatformLabel(type: ReferenceType, locale: Locale): string {
  const zh = locale === "zh";
  const labels: Record<ReferenceType, { zh: string; en: string }> = {
    youtube: { zh: "YouTube 视频", en: "YouTube video" },
    tiktok: { zh: "TikTok 视频", en: "TikTok video" },
    instagram: { zh: "Instagram Reels", en: "Instagram Reels" },
    vimeo: { zh: "Vimeo 视频", en: "Vimeo video" },
    pinterest: { zh: "Pinterest 参考", en: "Pinterest reference" },
    behance: { zh: "Behance 参考", en: "Behance reference" },
    mp4: { zh: "上传视频", en: "Uploaded video" },
    image: { zh: "上传截图 / 关键帧", en: "Uploaded screenshot / keyframe" },
    link: { zh: "网页广告链接", en: "Web ad link" }
  };
  return labels[type][zh ? "zh" : "en"];
}

export function referenceAccessStatus(
  type: ReferenceType,
  inputKind: ReferenceInputKind
): ReferenceAccessStatus {
  if (inputKind === "uploaded_video" || inputKind === "uploaded_image") {
    return "public";
  }
  if (REGION_RESTRICTED_TYPES.has(type)) {
    return "region_restricted";
  }
  if (type === "link") {
    return "unknown";
  }
  return "public";
}

export function referenceAccessStatusLabel(status: ReferenceAccessStatus, locale: Locale): string {
  const zh = locale === "zh";
  switch (status) {
    case "public":
      return zh ? "可公开访问" : "Publicly accessible";
    case "region_restricted":
      return zh ? "部分地区可能无法直接打开" : "May be unavailable in some regions";
    case "login_required":
      return zh ? "可能需要平台登录" : "May require platform login";
    case "private_or_removed":
      return zh ? "内容可能已删除或设为私密" : "Content may be private or removed";
    default:
      return zh ? "访问状态未知" : "Access status unknown";
  }
}
