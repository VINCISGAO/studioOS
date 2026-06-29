import type { Locale } from "@/lib/i18n";

export type QualityCheckId =
  | "subtitle_safe_area"
  | "logo_position"
  | "resolution"
  | "duration"
  | "brand_color"
  | "aspect_ratio"
  | "copyright_risk";

export type QualityStatus = "pass" | "warn" | "fail";

export type QualityCheck = {
  id: QualityCheckId;
  label: { en: string; zh: string };
  status: QualityStatus;
  detail: { en: string; zh: string };
  score?: number;
};

export type VideoProbeSummary = {
  width: number;
  height: number;
  durationSec: number;
  aspectRatio: number;
  aspectLabel: string;
  codec: string;
};

export type QualityReport = {
  orderId: string;
  overallScore: number;
  checks: QualityCheck[];
  ranAt: string;
  source: "ffprobe" | "heuristic";
  probe?: VideoProbeSummary | null;
};

export function qualityStatusLabel(status: QualityStatus, locale: Locale): string {
  const map = {
    pass: { en: "Pass", zh: "通过" },
    warn: { en: "Review", zh: "需复核" },
    fail: { en: "Fail", zh: "未通过" }
  };
  return map[status][locale];
}
