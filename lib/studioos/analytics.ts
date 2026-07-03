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

const demoAds: AdMetric[] = [
  {
    id: "ad_001",
    name: "TikTok Launch — v2",
    platform: "TikTok",
    ctr: 2.4,
    hookScore: 78,
    retention3s: 48,
    watchTime: 8.2,
    engagement: 5.1,
    conversion: 1.8,
    deliveredAt: "2026-06-12"
  },
  {
    id: "ad_002",
    name: "Black Friday Hero",
    platform: "Meta",
    ctr: 1.9,
    hookScore: 71,
    retention3s: 41,
    watchTime: 6.5,
    engagement: 3.8,
    conversion: 2.2,
    deliveredAt: "2026-05-28"
  },
  {
    id: "ad_003",
    name: "Holiday Campaign",
    platform: "TikTok",
    ctr: 3.1,
    hookScore: 85,
    retention3s: 52,
    watchTime: 9.1,
    engagement: 6.4,
    conversion: 2.0,
    deliveredAt: "2026-06-20"
  }
];

const demoInsights: CreativeInsight[] = [
  {
    id: "ins_1",
    title: {
      en: "First-person hooks outperform product macro",
      zh: "第一人称开场优于产品特写"
    },
    body: {
      en: "Past 30 days: first-person openers on TikTok drove 18% higher CTR vs product close-ups for your category.",
      zh: "过去 30 天：TikTok 上第一人称开场的点击率比产品特写高 18%。"
    },
    impact: "high",
    category: "hook"
  },
  {
    id: "ins_2",
    title: {
      en: "9s beats 20s in your vertical",
      zh: "9 秒优于 20 秒"
    },
    body: {
      en: "Peer brands in your space shifted to 9-second cuts — 22% better completion rate than 20s variants.",
      zh: "同行业品牌转向 9 秒短片 — 完播率比 20 秒版本高 22%。"
    },
    impact: "high",
    category: "length"
  },
  {
    id: "ins_3",
    title: {
      en: "Minimal end cards convert better",
      zh: "极简尾帧转化更高"
    },
    body: {
      en: "Single CTA end cards outperformed dual-offer layouts by 11% on conversion.",
      zh: "单一 CTA 尾帧比双优惠布局转化率高 11%。"
    },
    impact: "medium",
    category: "cta"
  },
  {
    id: "ins_4",
    title: {
      en: "UGC pacing aligns with your DNA",
      zh: "UGC 节奏与 DNA 一致"
    },
    body: {
      en: "Handheld UGC-style cuts match your Creative DNA pacing profile — recommend for next brief.",
      zh: "手持 UGC 风格切片与你的 Creative DNA 节奏一致 — 建议下次 Brief 采用。"
    },
    impact: "medium",
    category: "style"
  }
];

export type AnalyticsSummary = {
  avgCtr: number;
  avgHookScore: number;
  avgRetention: number;
  avgWatchTime: number;
  totalAds: number;
  monthSpend: number;
};

export type AnalyticsDataSource = "live" | "demo" | "mixed" | "attributed";

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

/** Sync demo-only (legacy). */
export function getCreativeAnalytics(_brandEmail?: string): {
  ads: AdMetric[];
  insights: CreativeInsight[];
  summary: AnalyticsSummary;
  dataSource: AnalyticsDataSource;
} {
  void _brandEmail;
  const ads = demoAds;
  return {
    ads,
    insights: demoInsights,
    summary: summarize(ads),
    dataSource: "demo"
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
        insights: storedInsights.length ? storedInsightsToCreative(storedInsights) : demoInsights,
        summary: { ...summarize(ads), monthSpend: monthSpend || 4900 },
        dataSource: "attributed",
        connectedPlatforms
      };
    }
  }

  if (!connectedPlatforms.length) {
    const demo = getCreativeAnalytics();
    return { ...demo, connectedPlatforms: [] };
  }

  const live = await fetchLiveAdAnalytics();
  if (!live.ads.length) {
    const demo = getCreativeAnalytics();
    return { ...demo, connectedPlatforms, dataSource: "demo" };
  }

  const insights = live.insights.length ? live.insights : demoInsights;
  const dataSource: AnalyticsDataSource = live.sources.length === connectedPlatforms.length ? "live" : "mixed";

  return {
    ads: live.ads,
    insights,
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
