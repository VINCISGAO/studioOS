import { hasOpenAI, openAIModel, openAIVisionModel } from "@/lib/studioos/config";
import type { HookType } from "@/lib/studioos/creative-performance-types";
import type {
  PlatformAttributionAnalysis,
  PlatformAttributionPlatform,
  ParsedPlatformMetrics
} from "@/lib/studioos/platform-attribution-types";

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function parseNumber(raw: string | undefined | null): number | null {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/[%$,]/g, "").trim();
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function pickField(row: Record<string, string>, aliases: string[]): number | null {
  for (const alias of aliases) {
    const value = row[alias];
    const parsed = parseNumber(value);
    if (parsed != null) return parsed;
  }
  return null;
}

function inferHookType(text: string): HookType {
  const value = text.toLowerCase();
  if (/product|macro|close.?up|特写/.test(value)) return "product_macro";
  if (/question|\?|提问/.test(value)) return "question";
  if (/ugc|handheld|手持/.test(value)) return "ugc_handheld";
  if (/vo|voiceover|旁白/.test(value)) return "voiceover";
  return "first_person";
}

function inferHookScore(completion: number, ctr: number, watchSec: number) {
  const base = 45 + completion * 0.45 + ctr * 4 + Math.min(watchSec, 12) * 2;
  return Math.max(40, Math.min(98, Math.round(base)));
}

function buildSummary(metrics: ParsedPlatformMetrics): { en: string; zh: string } {
  const roasText = metrics.roas != null ? ` · ROAS ${metrics.roas.toFixed(1)}` : "";
  return {
    en: `AI attributed this cut on ${metrics.platform.toUpperCase()}: CTR ${metrics.ctr.toFixed(1)}%, completion ${metrics.completion_rate.toFixed(0)}%, spend $${metrics.spend_usd.toFixed(0)}${roasText}. Hook pattern looks like ${metrics.hook_type.replace("_", " ")}.`,
    zh: `AI 已将本片归因到 ${metrics.platform.toUpperCase()}：CTR ${metrics.ctr.toFixed(1)}%、完播 ${metrics.completion_rate.toFixed(0)}%、花费 $${metrics.spend_usd.toFixed(0)}${metrics.roas != null ? `、ROAS ${metrics.roas.toFixed(1)}` : ""}。开场模式判定为 ${metrics.hook_type}。`
  };
}

function buildInsights(metrics: ParsedPlatformMetrics): { en: string[]; zh: string[] } {
  const insights = {
    en: [] as string[],
    zh: [] as string[]
  };

  if (metrics.ctr >= 2.5) {
    insights.en.push("CTR is above typical prospecting benchmarks — strong thumb-stop.");
    insights.zh.push("CTR 高于常见冷启动基准，封面/前 3 秒吸引力较强。");
  } else {
    insights.en.push("CTR is soft — test a sharper hook or tighter product reveal in the first second.");
    insights.zh.push("CTR 偏低，建议加强前 1 秒 Hook 或产品露出。");
  }

  if (metrics.completion_rate >= 45) {
    insights.en.push("Completion rate supports mid-funnel retargeting with the same creative.");
    insights.zh.push("完播率良好，可考虑用同一素材做再营销。");
  }

  if (metrics.roas != null && metrics.roas >= 2) {
    insights.en.push("ROAS supports scaling spend on this deliverable variant.");
    insights.zh.push("ROAS 达标，该版本值得加大投放。");
  }

  return insights;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const delimiter = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delimiter).map(normalizeHeader);
  const rows: Record<string, string>[] = [];

  for (const line of lines.slice(1)) {
    const cells = line.split(delimiter);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = (cells[index] ?? "").trim();
    });
    rows.push(row);
  }

  return rows;
}

function parseJson(text: string): Record<string, string>[] {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((item) =>
        Object.fromEntries(
          Object.entries(item as Record<string, unknown>).map(([key, value]) => [normalizeHeader(key), String(value ?? "")])
        )
      );
    }
    if (parsed && typeof parsed === "object") {
      return [
        Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [normalizeHeader(key), String(value ?? "")])
        )
      ];
    }
  } catch {
    // fall through
  }
  return [];
}

function extractFromRows(
  rows: Record<string, string>[],
  platform: PlatformAttributionPlatform
): ParsedPlatformMetrics | null {
  if (!rows.length) return null;

  const best = rows.reduce((winner, row) => {
    const ctr = pickField(row, ["ctr", "click_through_rate", "click_rate"]) ?? 0;
    const winnerCtr = pickField(winner, ["ctr", "click_through_rate", "click_rate"]) ?? 0;
    return ctr > winnerCtr ? row : winner;
  }, rows[0]);

  const impressions =
    pickField(best, ["impressions", "impression", "views", "video_views", "total_views"]) ?? 0;
  const spend =
    pickField(best, ["spend", "cost", "amount_spent", "total_cost", "spend_usd"]) ?? 0;
  let ctr = pickField(best, ["ctr", "click_through_rate", "click_rate"]) ?? 0;
  if (ctr > 0 && ctr <= 1) ctr *= 100;

  const clicks = pickField(best, ["clicks", "link_clicks", "clicks_all"]) ?? 0;
  if (!ctr && impressions > 0 && clicks > 0) {
    ctr = (clicks / impressions) * 100;
  }

  const completion =
    pickField(best, ["completion_rate", "video_completion_rate", "avg_video_play_rate", "view_rate"]) ??
    pickField(best, ["video_views_100", "completed_views"]) ??
    45;

  let completionRate = completion;
  if (completionRate > 0 && completionRate <= 1) completionRate *= 100;

  const watchSec =
    pickField(best, ["average_watch_time", "avg_watch_time", "watch_time", "average_view_duration_seconds"]) ??
    pickField(best, ["average_view_duration"]) ??
    8;

  const conversions = pickField(best, ["conversions", "purchases", "results"]) ?? 0;
  const conversionRate =
    pickField(best, ["conversion_rate", "cvr"]) ??
    (clicks > 0 && conversions > 0 ? (conversions / clicks) * 100 : 2);

  const roasRaw = pickField(best, ["roas", "return_on_ad_spend", "purchase_roas"]);
  const revenue = pickField(best, ["revenue", "purchase_value", "total_value"]);
  const roas =
    roasRaw ?? (spend > 0 && revenue != null && revenue > 0 ? revenue / spend : null);

  const adId =
    best.ad_id ||
    best.adid ||
    best.ad_name ||
    best.creative_id ||
    best.video_id ||
    best.campaign_id ||
    `${platform}_upload_${Date.now()}`;

  const campaignId = best.campaign_id || best.campaign_name || "";
  const label = [best.ad_name, best.campaign_name, best.video_title, best.creative_name].filter(Boolean).join(" ");
  const lengthSec = pickField(best, ["video_duration", "length_sec", "duration_seconds"]) ?? 15;
  const hookType = inferHookType(label);
  const engagement =
    pickField(best, ["engagement_rate", "likes_rate", "interaction_rate"]) ??
    Math.min(12, ctr * 1.8);

  return {
    platform,
    platform_ad_id: String(adId).slice(0, 120),
    platform_campaign_id: String(campaignId).slice(0, 120),
    spend_usd: spend,
    impressions,
    ctr,
    completion_rate: completionRate,
    hook_score: inferHookScore(completionRate, ctr, watchSec),
    watch_time_sec: watchSec,
    engagement_rate: engagement,
    conversion_rate: conversionRate > 1 ? conversionRate : conversionRate * 100,
    roas,
    length_sec: lengthSec,
    hook_type: hookType
  };
}

function parsePlainText(text: string, platform: PlatformAttributionPlatform): ParsedPlatformMetrics | null {
  const impressions = parseNumber(text.match(/impressions?[:\s]+([\d,.\s]+)/i)?.[1]) ?? 0;
  const spend = parseNumber(text.match(/(?:spend|cost)[:\s$]+([\d,.\s]+)/i)?.[1]) ?? 0;
  let ctr = parseNumber(text.match(/ctr[:\s]+([\d,.]+)/i)?.[1]) ?? 0;
  if (ctr > 0 && ctr <= 1) ctr *= 100;
  const completion =
    parseNumber(text.match(/(?:completion|view rate)[:\s]+([\d,.]+)/i)?.[1]) ?? 45;
  const roas = parseNumber(text.match(/roas[:\s]+([\d,.]+)/i)?.[1]);
  const adId = text.match(/(?:ad id|campaign id|creative id)[:\s]+([\w-]+)/i)?.[1] ?? `${platform}_paste_${Date.now()}`;

  if (!impressions && !spend && !ctr) return null;

  return {
    platform,
    platform_ad_id: adId,
    platform_campaign_id: "",
    spend_usd: spend,
    impressions,
    ctr,
    completion_rate: completion > 1 ? completion : completion * 100,
    hook_score: inferHookScore(completion, ctr, 8),
    watch_time_sec: 8,
    engagement_rate: Math.min(12, ctr * 1.8),
    conversion_rate: 2,
    roas,
    length_sec: 15,
    hook_type: inferHookType(text)
  };
}

function buildCampaignRecommendations(metrics: ParsedPlatformMetrics): { en: string[]; zh: string[] } {
  const recs = { en: [] as string[], zh: [] as string[] };

  if (metrics.hook_type === "first_person" && metrics.ctr >= 2) {
    recs.en.push("Keep first-person hook in the next brief — it drove strong CTR on this cut.");
    recs.zh.push("下次 Brief 继续用第一人称 Hook — 本片 CTR 表现突出。");
  } else if (metrics.ctr < 2) {
    recs.en.push("Test product-macro or question hook in the next campaign — CTR was below benchmark.");
    recs.zh.push("下次 Campaign 试产品特写或提问式 Hook — 本片 CTR 低于基准。");
  }

  if (metrics.length_sec <= 15 && metrics.completion_rate >= 40) {
    recs.en.push(`Stay at ${metrics.length_sec}s or shorter — completion supports prospecting scale.`);
    recs.zh.push(`保持 ${metrics.length_sec} 秒或更短 — 完播率支持放量。`);
  } else if (metrics.length_sec > 15) {
    recs.en.push("Try a 15s variant in the wizard — short-form may lift completion.");
    recs.zh.push("向导里试 15 秒版本 — 短视频可能提升完播。");
  }

  if (metrics.roas != null && metrics.roas >= 2) {
    recs.en.push("Reuse this studio and style preset for the next similar product launch.");
    recs.zh.push("下次同类产品发布复用本 Studio 与风格预设。");
  }

  return recs;
}

async function analyzeScreenshotWithOpenAI(
  imageBase64: string,
  mimeType: string,
  platform: PlatformAttributionPlatform,
  locale: "en" | "zh"
): Promise<PlatformAttributionAnalysis | null> {
  if (!hasOpenAI()) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: openAIVisionModel(),
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You read screenshots from TikTok Ads Manager, YouTube Studio, or Google Ads dashboards. Extract ad performance metrics visible in the image. Return JSON only with keys: platform_ad_id, platform_campaign_id, spend_usd, impressions, ctr, completion_rate, watch_time_sec, engagement_rate, conversion_rate, roas, length_sec, hook_type (first_person|product_macro|question|ugc_handheld|voiceover), summary_en, summary_zh, insights_en (string array of why performance is good/bad), insights_zh (string array), recommendations_en (string array — specific next-campaign suggestions for hook, length, style), recommendations_zh (string array), confidence (0-1). Use 0 for missing numbers. If unreadable, set confidence below 0.5."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Platform: ${platform}. Locale: ${locale}. Read metrics from this ad backend screenshot.`
              },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${imageBase64}` }
              }
            ]
          }
        ]
      }),
      signal: AbortSignal.timeout(60_000)
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as Record<string, unknown>;
    const hook = String(parsed.hook_type ?? "first_person") as HookType;
    const metrics: ParsedPlatformMetrics = {
      platform,
      platform_ad_id: String(parsed.platform_ad_id ?? `${platform}_screenshot_${Date.now()}`),
      platform_campaign_id: String(parsed.platform_campaign_id ?? ""),
      spend_usd: Number(parsed.spend_usd ?? 0),
      impressions: Number(parsed.impressions ?? 0),
      ctr: Number(parsed.ctr ?? 0),
      completion_rate: Number(parsed.completion_rate ?? 45),
      hook_score: inferHookScore(
        Number(parsed.completion_rate ?? 45),
        Number(parsed.ctr ?? 0),
        Number(parsed.watch_time_sec ?? 8)
      ),
      watch_time_sec: Number(parsed.watch_time_sec ?? 8),
      engagement_rate: Number(parsed.engagement_rate ?? 5),
      conversion_rate: Number(parsed.conversion_rate ?? 2),
      roas: parsed.roas == null || Number(parsed.roas) === 0 ? null : Number(parsed.roas),
      length_sec: Number(parsed.length_sec ?? 15),
      hook_type: hook
    };

    const fallbackRecs = buildCampaignRecommendations(metrics);

    return {
      metrics,
      summary: {
        en: String(parsed.summary_en ?? buildSummary(metrics).en),
        zh: String(parsed.summary_zh ?? buildSummary(metrics).zh)
      },
      insights: {
        en: Array.isArray(parsed.insights_en) ? parsed.insights_en.map(String) : buildInsights(metrics).en,
        zh: Array.isArray(parsed.insights_zh) ? parsed.insights_zh.map(String) : buildInsights(metrics).zh
      },
      campaign_recommendations: {
        en: Array.isArray(parsed.recommendations_en)
          ? parsed.recommendations_en.map(String)
          : fallbackRecs.en,
        zh: Array.isArray(parsed.recommendations_zh)
          ? parsed.recommendations_zh.map(String)
          : fallbackRecs.zh
      },
      source: "vision",
      confidence: Math.min(1, Math.max(0.35, Number(parsed.confidence ?? 0.7)))
    };
  } catch {
    return null;
  }
}

function demoScreenshotAnalysis(
  platform: PlatformAttributionPlatform,
  locale: "en" | "zh"
): PlatformAttributionAnalysis {
  const metrics: ParsedPlatformMetrics = {
    platform,
    platform_ad_id: `${platform}_demo_screenshot`,
    platform_campaign_id: "demo_campaign",
    spend_usd: 520,
    impressions: 94000,
    ctr: platform === "tiktok" ? 2.9 : 2.1,
    completion_rate: platform === "tiktok" ? 48 : 36,
    hook_score: 79,
    watch_time_sec: 8.6,
    engagement_rate: 5.2,
    conversion_rate: 2.3,
    roas: 2.2,
    length_sec: 15,
    hook_type: platform === "tiktok" ? "first_person" : "product_macro"
  };

  return {
    metrics,
    summary: {
      en: `Demo analysis from ${platform.toUpperCase()} screenshot — CTR ${metrics.ctr}%, completion ${metrics.completion_rate}%. Configure OPENAI_API_KEY for live OCR.`,
      zh: `${platform.toUpperCase()} 截图演示分析 — CTR ${metrics.ctr}%、完播 ${metrics.completion_rate}%。配置 OPENAI_API_KEY 后可读取真实截图。`
    },
    insights: buildInsights(metrics),
    campaign_recommendations: buildCampaignRecommendations(metrics),
    source: "heuristic",
    confidence: 0.55
  };
}

export async function analyzePlatformScreenshot(input: {
  platform: PlatformAttributionPlatform;
  imageBase64: string;
  mimeType: string;
  fileName?: string;
  locale?: "en" | "zh";
}): Promise<PlatformAttributionAnalysis | { ok: false; error: string }> {
  const vision = await analyzeScreenshotWithOpenAI(
    input.imageBase64,
    input.mimeType,
    input.platform,
    input.locale ?? "en"
  );

  if (vision) {
    return { ...vision, upload_file_name: input.fileName };
  }

  if (!hasOpenAI()) {
    return { ...demoScreenshotAnalysis(input.platform, input.locale ?? "en"), upload_file_name: input.fileName };
  }

  return {
    ok: false,
    error:
      input.locale === "zh"
        ? "无法从截图识别数据。请上传更清晰的 TikTok / YouTube 后台截图，或粘贴报表文本。"
        : "Could not read this screenshot. Upload a clearer TikTok/YouTube dashboard capture, or paste report text."
  };
}

async function analyzeWithOpenAI(
  raw: string,
  platform: PlatformAttributionPlatform,
  locale: "en" | "zh"
): Promise<PlatformAttributionAnalysis | null> {
  if (!hasOpenAI()) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: openAIModel(),
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You extract ad performance metrics from TikTok Ads, YouTube/Google Ads, or Meta ad manager exports. Return JSON only with keys: platform_ad_id, platform_campaign_id, spend_usd, impressions, ctr, completion_rate, watch_time_sec, engagement_rate, conversion_rate, roas, length_sec, hook_type (first_person|product_macro|question|ugc_handheld|voiceover), summary_en, summary_zh, insights_en (string array), insights_zh (string array), confidence (0-1)."
          },
          {
            role: "user",
            content: `Platform: ${platform}\n\nExport data:\n${raw.slice(0, 12000)}`
          }
        ]
      }),
      signal: AbortSignal.timeout(45_000)
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as Record<string, unknown>;
    const hook = String(parsed.hook_type ?? "first_person") as HookType;
    const metrics: ParsedPlatformMetrics = {
      platform,
      platform_ad_id: String(parsed.platform_ad_id ?? `${platform}_ai_${Date.now()}`),
      platform_campaign_id: String(parsed.platform_campaign_id ?? ""),
      spend_usd: Number(parsed.spend_usd ?? 0),
      impressions: Number(parsed.impressions ?? 0),
      ctr: Number(parsed.ctr ?? 0),
      completion_rate: Number(parsed.completion_rate ?? 45),
      hook_score: inferHookScore(Number(parsed.completion_rate ?? 45), Number(parsed.ctr ?? 0), Number(parsed.watch_time_sec ?? 8)),
      watch_time_sec: Number(parsed.watch_time_sec ?? 8),
      engagement_rate: Number(parsed.engagement_rate ?? 5),
      conversion_rate: Number(parsed.conversion_rate ?? 2),
      roas: parsed.roas == null ? null : Number(parsed.roas),
      length_sec: Number(parsed.length_sec ?? 15),
      hook_type: hook
    };

    return {
      metrics,
      summary: {
        en: String(parsed.summary_en ?? buildSummary(metrics).en),
        zh: String(parsed.summary_zh ?? buildSummary(metrics).zh)
      },
      insights: {
        en: Array.isArray(parsed.insights_en) ? parsed.insights_en.map(String) : buildInsights(metrics).en,
        zh: Array.isArray(parsed.insights_zh) ? parsed.insights_zh.map(String) : buildInsights(metrics).zh
      },
      campaign_recommendations: buildCampaignRecommendations(metrics),
      source: "openai",
      confidence: Math.min(1, Math.max(0.4, Number(parsed.confidence ?? 0.75)))
    };
  } catch {
    return null;
  }
}

export async function analyzePlatformExport(input: {
  platform: PlatformAttributionPlatform;
  rawText: string;
  fileName?: string;
  locale?: "en" | "zh";
}): Promise<PlatformAttributionAnalysis | { ok: false; error: string }> {
  const raw = input.rawText.trim();
  if (!raw) {
    return {
      ok: false,
      error: input.locale === "zh" ? "请上传或粘贴平台后台数据" : "Upload or paste platform export data"
    };
  }

  const aiFirst = await analyzeWithOpenAI(raw, input.platform, input.locale ?? "en");
  if (aiFirst) {
    return { ...aiFirst, upload_file_name: input.fileName };
  }

  const rows = parseCsv(raw);
  const jsonRows = rows.length ? [] : parseJson(raw);
  const metrics =
    extractFromRows(rows, input.platform) ??
    extractFromRows(jsonRows, input.platform) ??
    parsePlainText(raw, input.platform);

  if (!metrics) {
    return {
      ok: false,
      error:
        input.locale === "zh"
          ? "无法识别数据格式。请上传 TikTok / YouTube 后台导出的 CSV，或粘贴报表文本。"
          : "Could not parse export. Upload a TikTok/YouTube CSV or paste report text."
    };
  }

  return {
    metrics,
    summary: buildSummary(metrics),
    insights: buildInsights(metrics),
    campaign_recommendations: buildCampaignRecommendations(metrics),
    source: "heuristic",
    confidence: 0.62,
    upload_file_name: input.fileName
  };
}
