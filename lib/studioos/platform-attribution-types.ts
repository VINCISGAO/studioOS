import type { HookType } from "@/lib/studioos/creative-performance-types";

export type PlatformAttributionPlatform = "tiktok" | "youtube" | "meta";

export type ParsedPlatformMetrics = {
  platform: PlatformAttributionPlatform;
  platform_ad_id: string;
  platform_campaign_id: string;
  spend_usd: number;
  impressions: number;
  ctr: number;
  completion_rate: number;
  hook_score: number;
  watch_time_sec: number;
  engagement_rate: number;
  conversion_rate: number;
  roas: number | null;
  length_sec: number;
  hook_type: HookType;
};

export type PlatformAttributionAnalysis = {
  metrics: ParsedPlatformMetrics;
  summary: { en: string; zh: string };
  insights: { en: string[]; zh: string[] };
  /** Actionable suggestions for the next campaign wizard. */
  campaign_recommendations?: { en: string[]; zh: string[] };
  source: "heuristic" | "openai" | "vision";
  confidence: number;
  upload_file_name?: string;
};
