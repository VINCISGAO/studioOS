import type { Locale } from "@/lib/i18n";
import { fetchLiveAdAnalytics } from "@/lib/studioos/analytics-providers";
import { hasMetaAds, hasTikTokAds } from "@/lib/studioos/config";

export type AdMetric = {
  id: string;
  name: string;
  platform: string;
  ctr: number;
  hookScore: number;
  retention3s: number;
  watchTime: number;
  engagement: number;
  conversion: number;
  deliveredAt: string;
};

export type CreativeInsight = {
  id: string;
  title: { en: string; zh: string };
  body: { en: string; zh: string };
  impact: "high" | "medium";
  category: "hook" | "length" | "style" | "cta";
};

export type AnalyticsSummary = {
  avgCtr: number;
  avgHookScore: number;
  avgRetention: number;
  avgWatchTime: number;
  totalAds: number;
  monthSpend: number;
};

export type AnalyticsDataSource = "live" | "mixed" | "attributed" | "empty";

function summarize(ads: AdMetric[]): AnalyticsSummary {
  if (!ads.length) {
    return { avgCtr: 0, avgHookScore: 0, avgRetention: 0, avgWatchTime: 0, totalAds: 0, monthSpend: 0 };
  }
  return {
    avgCtr: ads.reduce((s, a) => s + a.ctr, 0) / ads.length,
    avgHookScore: ads.reduce((s, a) => s + a.hookScore, 0) / ads.length,
    avgRetention: ads.reduce((s, a) => s + a.retention3s, 0) / ads.length,
    avgWatchTime: ads.reduce((s, a) => s + a.watchTime, 0) / ads.length,
    totalAds: ads.length,
    monthSpend: 4900
  };
}

/** Sync empty fallback for callers that cannot await provider data. */
export function getCreativeAnalytics(_brandEmail?: string): {
  ads: AdMetric[];
  insights: CreativeInsight[];
  summary: AnalyticsSummary;
  dataSource: AnalyticsDataSource;
} {
  void _brandEmail;
  return {
    ads: [],
    insights: [],
    summary: summarize([]),
    dataSource: "empty"
  };
}

function recordsToAds(
  records: Awaited<ReturnType<typeof import("@/lib/studioos/creative-performance-store").listPerformanceForOrg>>
): AdMetric[] {
  return records.map((record) => ({
    id: record.id,
    name: record.name,
    platform: record.platform === "manual" ? "Manual" : record.platform.charAt(0).toUpperCase() + record.platform.slice(1),
    ctr: record.metrics.ctr,
    hookScore: record.metrics.hook_score,
    retention3s: record.metrics.completion_rate,
    watchTime: record.metrics.watch_time_sec,
    engagement: record.metrics.engagement_rate,
    conversion: record.metrics.conversion_rate,
    deliveredAt: record.synced_at.split("T")[0] ?? record.synced_at
  }));
}

function storedInsightsToCreative(
  items: Awaited<ReturnType<typeof import("@/lib/studioos/creative-performance-store").getInsightsForOrg>>
): CreativeInsight[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    impact: item.lift_pct >= 15 ? "high" : "medium",
    category: item.category === "studio" ? "style" : item.category
  }));
}

/** Step 3: attributed store → live APIs → demo fallback. */
export async function getCreativeAnalyticsAsync(brandEmail?: string): Promise<{
  ads: AdMetric[];
  insights: CreativeInsight[];
  summary: AnalyticsSummary;
  dataSource: AnalyticsDataSource;
  connectedPlatforms: string[];
}> {
  const orgId = brandEmail?.trim().toLowerCase() ?? "";
  const connectedPlatforms: string[] = [];
  if (hasMetaAds()) connectedPlatforms.push("Meta");
  if (hasTikTokAds()) connectedPlatforms.push("TikTok");

  if (orgId) {
    const { listPerformanceForOrg, getInsightsForOrg } = await import("@/lib/studioos/creative-performance-store");
    const [records, storedInsights] = await Promise.all([
      listPerformanceForOrg(orgId),
      getInsightsForOrg(orgId)
    ]);

    if (records.length) {
      const ads = recordsToAds(records);
      const monthSpend = records.reduce((sum, item) => sum + item.spend_usd, 0);
      return {
        ads,
        insights: storedInsights.length ? storedInsightsToCreative(storedInsights) : [],
        summary: { ...summarize(ads), monthSpend },
        dataSource: "attributed",
        connectedPlatforms
      };
    }
  }

  if (!connectedPlatforms.length) {
    const empty = getCreativeAnalytics();
    return { ...empty, connectedPlatforms: [] };
  }

  const live = await fetchLiveAdAnalytics();
  if (!live.ads.length) {
    const empty = getCreativeAnalytics();
    return { ...empty, connectedPlatforms };
  }

  const dataSource: AnalyticsDataSource = live.sources.length === connectedPlatforms.length ? "live" : "mixed";

  return {
    ads: live.ads,
    insights: live.insights,
    summary: summarize(live.ads),
    dataSource,
    connectedPlatforms
  };
}

export function formatMetric(value: number, unit: string, locale: Locale): string {
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "s") return `${value.toFixed(1)}${locale === "zh" ? "秒" : "s"}`;
  return value.toFixed(1);
}
