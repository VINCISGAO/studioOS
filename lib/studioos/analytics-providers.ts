import type { AdMetric, CreativeInsight } from "@/lib/studioos/analytics";
import { hasMetaAds, hasTikTokAds, metaAdAccountId, tikTokAdvertiserId } from "@/lib/studioos/config";

type MetaInsightRow = {
  campaign_name?: string;
  ad_name?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  spend?: string;
};

type TikTokReportRow = {
  dimensions?: { ad_name?: string; campaign_name?: string };
  metrics?: {
    impressions?: string;
    clicks?: string;
    ctr?: string;
    spend?: string;
    average_video_play?: string;
    video_views_p25?: string;
  };
};

async function fetchMetaAds(): Promise<AdMetric[]> {
  if (!hasMetaAds()) return [];

  const accountId = metaAdAccountId();
  const token = process.env.META_ACCESS_TOKEN!;
  const url = new URL(`https://graph.facebook.com/v21.0/${accountId}/insights`);
  url.searchParams.set("fields", "campaign_name,ad_name,impressions,clicks,ctr,spend");
  url.searchParams.set("level", "ad");
  url.searchParams.set("date_preset", "last_30d");
  url.searchParams.set("limit", "25");
  url.searchParams.set("access_token", token);

  const response = await fetch(url.toString(), { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) return [];

  const data = (await response.json()) as { data?: MetaInsightRow[] };
  return (data.data ?? []).map((row, index) => {
    const ctr = Number(row.ctr ?? 0);
    const impressions = Number(row.impressions ?? 0);
    const clicks = Number(row.clicks ?? 0);
    const hookScore = Math.min(99, Math.round(50 + ctr * 8 + (clicks / Math.max(impressions, 1)) * 100));

    return {
      id: `meta_${index}`,
      name: row.ad_name || row.campaign_name || `Meta ad ${index + 1}`,
      platform: "Meta",
      ctr,
      hookScore,
      retention3s: Math.min(60, Math.round(hookScore * 0.55)),
      watchTime: 6 + ctr * 0.5,
      engagement: Math.round((clicks / Math.max(impressions, 1)) * 1000) / 10,
      conversion: Math.max(0.5, ctr * 0.4),
      deliveredAt: new Date().toISOString().slice(0, 10)
    };
  });
}

async function fetchTikTokAds(): Promise<AdMetric[]> {
  if (!hasTikTokAds()) return [];

  const advertiserId = tikTokAdvertiserId();
  const token = process.env.TIKTOK_ACCESS_TOKEN!;

  const response = await fetch(
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/",
    {
      method: "POST",
      headers: {
        "Access-Token": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        advertiser_id: advertiserId,
        report_type: "BASIC",
        data_level: "AUCTION_AD",
        dimensions: ["ad_id", "stat_time_day"],
        metrics: ["impressions", "clicks", "ctr", "spend", "average_video_play", "video_views_p25"],
        start_date: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
        end_date: new Date().toISOString().slice(0, 10),
        page_size: 25
      }),
      signal: AbortSignal.timeout(20_000)
    }
  );

  if (!response.ok) return [];

  const payload = (await response.json()) as { data?: { list?: TikTokReportRow[] } };
  return (payload.data?.list ?? []).map((row, index) => {
    const ctr = Number(row.metrics?.ctr ?? 0);
    const impressions = Number(row.metrics?.impressions ?? 0);
    const clicks = Number(row.metrics?.clicks ?? 0);
    const retention3s = Number(row.metrics?.video_views_p25 ?? 0);
    const watchTime = Number(row.metrics?.average_video_play ?? 0) / 1000;

    return {
      id: `tiktok_${index}`,
      name: row.dimensions?.ad_name || row.dimensions?.campaign_name || `TikTok ad ${index + 1}`,
      platform: "TikTok",
      ctr,
      hookScore: Math.min(99, Math.round(45 + ctr * 10)),
      retention3s: impressions ? Math.round((retention3s / impressions) * 100) : 0,
      watchTime: watchTime || 8,
      engagement: Math.round((clicks / Math.max(impressions, 1)) * 1000) / 10,
      conversion: Math.max(0.5, ctr * 0.35),
      deliveredAt: new Date().toISOString().slice(0, 10)
    };
  });
}

function buildInsightsFromAds(ads: AdMetric[]): CreativeInsight[] {
  if (!ads.length) return [];

  const tiktok = ads.filter((a) => a.platform === "TikTok");
  const meta = ads.filter((a) => a.platform === "Meta");
  const insights: CreativeInsight[] = [];

  if (tiktok.length >= 2) {
    const best = [...tiktok].sort((a, b) => b.ctr - a.ctr)[0];
    const avg = tiktok.reduce((s, a) => s + a.ctr, 0) / tiktok.length;
    const lift = Math.round(((best.ctr - avg) / Math.max(avg, 0.1)) * 100);
    insights.push({
      id: "live_hook",
      title: {
        en: `"${best.name}" leads TikTok CTR`,
        zh: `"${best.name}" TikTok CTR 领先`
      },
      body: {
        en: `Live TikTok data: top ad CTR ${best.ctr.toFixed(1)}% — ${lift}% above your 30-day TikTok average.`,
        zh: `TikTok 实时数据：最佳广告 CTR ${best.ctr.toFixed(1)}%，比 30 天 TikTok 均值高 ${lift}%。`
      },
      impact: "high",
      category: "hook"
    });
  }

  if (meta.length >= 1 && tiktok.length >= 1) {
    const metaAvg = meta.reduce((s, a) => s + a.ctr, 0) / meta.length;
    const tikAvg = tiktok.reduce((s, a) => s + a.ctr, 0) / tiktok.length;
    const winner = metaAvg > tikAvg ? "Meta" : "TikTok";
    insights.push({
      id: "live_platform",
      title: {
        en: `${winner} is outperforming this month`,
        zh: `本月 ${winner} 表现更好`
      },
      body: {
        en: `Live ad accounts: ${winner} average CTR ${Math.max(metaAvg, tikAvg).toFixed(1)}% vs ${Math.min(metaAvg, tikAvg).toFixed(1)}% on the other platform.`,
        zh: `实时广告账户：${winner} 平均 CTR ${Math.max(metaAvg, tikAvg).toFixed(1)}%，另一平台 ${Math.min(metaAvg, tikAvg).toFixed(1)}%。`
      },
      impact: "high",
      category: "style"
    });
  }

  return insights;
}

export type AnalyticsFetchResult = {
  ads: AdMetric[];
  insights: CreativeInsight[];
  sources: ("meta" | "tiktok" | "demo")[];
};

export async function fetchLiveAdAnalytics(): Promise<AnalyticsFetchResult> {
  const sources: ("meta" | "tiktok" | "demo")[] = [];
  const [metaAds, tiktokAds] = await Promise.all([fetchMetaAds(), fetchTikTokAds()]);

  if (metaAds.length) sources.push("meta");
  if (tiktokAds.length) sources.push("tiktok");

  const ads = [...metaAds, ...tiktokAds];
  const insights = buildInsightsFromAds(ads);

  return { ads, insights, sources };
}
