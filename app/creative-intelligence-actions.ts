"use server";

import { revalidatePath } from "next/cache";
import { getCurrentClientEmail } from "@/features/auth/session-context";
import type { Locale } from "@/lib/i18n";
import { getOrder } from "@/lib/order-service";
import {
  bindDeliverablePerformance,
  orgIdFromEmail,
  refreshOrgIntelligenceStore
} from "@/lib/studioos/creative-performance-store";
import { performanceSourceService } from "@/features/attribution/performance-source.service";
import type { PerformanceSourceSourceType } from "@/features/attribution/performance-source.types";
import type { HookType } from "@/lib/studioos/creative-performance-types";
import { analyzePlatformExport, analyzePlatformScreenshot } from "@/lib/studioos/platform-data-analyzer";
import type { PlatformAttributionPlatform, PlatformAttributionAnalysis } from "@/lib/studioos/platform-attribution-types";
import type { PerformanceSourcePlatform } from "@prisma/client";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return raw === "zh" ? "zh" : "en";
}

function normalizePerformancePlatform(raw: FormDataEntryValue | null): PerformanceSourcePlatform {
  const value = String(raw ?? "TIKTOK").toUpperCase();
  if (value === "YOUTUBE") return "YOUTUBE";
  if (value === "INSTAGRAM") return "INSTAGRAM";
  if (value === "TELEGRAM") return "TELEGRAM";
  if (value === "FACEBOOK_ADS") return "FACEBOOK_ADS";
  if (value === "WHATSAPP") return "WHATSAPP";
  if (value === "XIAOHONGSHU") return "XIAOHONGSHU";
  if (value === "DOUYIN") return "DOUYIN";
  if (value === "X") return "X";
  if (value === "GOOGLE_DRIVE") return "GOOGLE_DRIVE";
  if (value === "REPORT") return "REPORT";
  if (value === "OTHER") return "OTHER";
  return "TIKTOK";
}

function analyzerPlatform(platform: PerformanceSourcePlatform): PlatformAttributionPlatform {
  if (platform === "YOUTUBE") return "youtube";
  if (platform === "TIKTOK" || platform === "DOUYIN" || platform === "XIAOHONGSHU" || platform === "TELEGRAM") {
    return "tiktok";
  }
  return "meta";
}

function resolveSourceType(input: {
  url: string;
  hasFile: boolean;
  hasText: boolean;
}): PerformanceSourceSourceType {
  if (input.url && input.hasFile) return "url_file";
  if (input.url && input.hasText) return "url_text";
  if (input.hasFile) return "file";
  if (input.hasText) return "text";
  return "url";
}

export async function bindDeliverablePerformanceAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const clientEmail = await getCurrentClientEmail();
  if (!clientEmail) {
    return { ok: false as const, error: lang === "zh" ? "请先登录" : "Sign in required" };
  }

  const orderId = String(formData.get("order_id") ?? "");
  const deliverableId = String(formData.get("deliverable_id") ?? "");
  const deliverableVersion = Number(formData.get("deliverable_version") ?? 1);
  const order = await getOrder(orderId);

  if (!order || order.client_email !== clientEmail.toLowerCase()) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }

  const platform = String(formData.get("platform") ?? "manual") as "meta" | "tiktok" | "youtube" | "manual";
  const platformAdId = String(formData.get("platform_ad_id") ?? "").trim();
  if (!platformAdId) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请输入平台广告 ID" : "Enter a platform ad ID"
    };
  }

  const hookType = String(formData.get("hook_type") ?? "first_person") as HookType;
  const record = await bindDeliverablePerformance({
    org_id: orgIdFromEmail(clientEmail),
    order_id: orderId,
    deliverable_id: deliverableId,
    deliverable_version: deliverableVersion,
    project_id: order.project_id,
    name: String(formData.get("name") ?? order.title ?? "Deliverable"),
    platform,
    platform_ad_id: platformAdId,
    platform_campaign_id: String(formData.get("platform_campaign_id") ?? ""),
    studio_id: order.creator_id,
    category: String(formData.get("category") ?? "CPG"),
    hook_type: hookType,
    length_sec: Number(formData.get("length_sec") ?? 15),
    aspect_ratio: String(formData.get("aspect_ratio") ?? "9:16"),
    style_presets: String(formData.get("style_presets") ?? "ugc,cinematic")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    spend_usd: Number(formData.get("spend_usd") ?? 0),
    impressions: Number(formData.get("impressions") ?? 0),
    metrics: {
      ctr: Number(formData.get("ctr") ?? 0),
      hook_score: Number(formData.get("hook_score") ?? 0),
      completion_rate: Number(formData.get("completion_rate") ?? 0),
      watch_time_sec: Number(formData.get("watch_time_sec") ?? 0),
      engagement_rate: Number(formData.get("engagement_rate") ?? 0),
      conversion_rate: Number(formData.get("conversion_rate") ?? 0),
      roas: Number(formData.get("roas") ?? 0) || null
    }
  });

  revalidatePath("/brand/analytics");
  revalidatePath("/brand/creative-dna");
  revalidatePath("/brand");
  revalidatePath(`/brand/projects/${order.project_id ?? orderId}/review`);
  revalidatePath(`/brand/projects/${orderId}/review`);

  return { ok: true as const, record };
}

export async function uploadPlatformAttributionAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const clientEmail = await getCurrentClientEmail();
  if (!clientEmail) {
    return { ok: false as const, error: lang === "zh" ? "请先登录" : "Sign in required" };
  }

  const orderId = String(formData.get("order_id") ?? "");
  const deliverableId = String(formData.get("deliverable_id") ?? "");
  const deliverableVersion = Number(formData.get("deliverable_version") ?? 1);
  const platform = String(formData.get("platform") ?? "tiktok") as PlatformAttributionPlatform;
  const pasted = String(formData.get("pasted_data") ?? "").trim();
  const order = await getOrder(orderId);

  if (!order || order.client_email !== clientEmail.toLowerCase()) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }

  let rawText = pasted;
  let fileName: string | undefined;
  let analysis: PlatformAttributionAnalysis | { ok: false; error: string };

  const file = formData.get("platform_file");
  if (file instanceof File && file.size > 0) {
    if (file.size > 8 * 1024 * 1024) {
      return { ok: false as const, error: lang === "zh" ? "文件不能超过 8MB" : "File must be under 8MB" };
    }
    fileName = file.name;

    if (file.type.startsWith("image/")) {
      const buffer = Buffer.from(await file.arrayBuffer());
      analysis = await analyzePlatformScreenshot({
        platform,
        imageBase64: buffer.toString("base64"),
        mimeType: file.type,
        fileName,
        locale: lang
      });
    } else {
      rawText = await file.text();
      analysis = await analyzePlatformExport({
        platform,
        rawText,
        fileName,
        locale: lang
      });
    }
  } else {
    analysis = await analyzePlatformExport({
      platform,
      rawText,
      fileName,
      locale: lang
    });
  }

  if (!("metrics" in analysis)) {
    return analysis;
  }

  const result = analysis;
  const { metrics } = result;

  const record = await bindDeliverablePerformance({
    org_id: orgIdFromEmail(clientEmail),
    order_id: orderId,
    deliverable_id: deliverableId,
    deliverable_version: deliverableVersion,
    project_id: order.project_id,
    name: String(formData.get("name") ?? order.title ?? "Deliverable"),
    platform: metrics.platform,
    platform_ad_id: metrics.platform_ad_id,
    platform_campaign_id: metrics.platform_campaign_id,
    studio_id: order.creator_id,
    category: String(formData.get("category") ?? "CPG"),
    hook_type: metrics.hook_type as HookType,
    length_sec: metrics.length_sec,
    aspect_ratio: String(formData.get("aspect_ratio") ?? "9:16"),
    style_presets: String(formData.get("style_presets") ?? "ugc,cinematic")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    spend_usd: metrics.spend_usd,
    impressions: metrics.impressions,
    metrics: {
      ctr: metrics.ctr,
      hook_score: metrics.hook_score,
      completion_rate: metrics.completion_rate,
      watch_time_sec: metrics.watch_time_sec,
      engagement_rate: metrics.engagement_rate,
      conversion_rate: metrics.conversion_rate,
      roas: metrics.roas
    },
    source_type: "platform_upload",
    upload_file_name: result.upload_file_name,
    ai_summary: result.summary,
    ai_insights: result.insights,
    campaign_recommendations: result.campaign_recommendations,
    analysis_source: result.source
  });

  revalidatePath("/brand/attribution");
  revalidatePath("/brand/analytics");
  revalidatePath("/brand/creative-dna");
  revalidatePath("/brand");
  revalidatePath(`/brand/projects/${order.project_id ?? orderId}/review`);

  return {
    ok: true as const,
    record,
    analysis: {
      summary: result.summary[lang],
      insights: result.insights[lang],
      recommendations: result.campaign_recommendations?.[lang] ?? [],
      source: result.source,
      confidence: result.confidence
    }
  };
}

export async function createPerformanceSourceAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const clientEmail = await getCurrentClientEmail();
  if (!clientEmail) {
    return { ok: false as const, error: lang === "zh" ? "请先登录" : "Sign in required" };
  }

  const campaignRef = String(formData.get("campaign_ref") ?? "").trim();
  const sourceUrl = String(formData.get("source_url") ?? "").trim();
  const evidenceText = String(formData.get("evidence_text") ?? "").trim();
  const platform = normalizePerformancePlatform(formData.get("platform"));
  const file = formData.get("evidence_file");
  const hasFile = file instanceof File && file.size > 0;

  if (!campaignRef) {
    return { ok: false as const, error: lang === "zh" ? "请选择 Campaign" : "Choose a campaign" };
  }
  if (!sourceUrl && !hasFile && !evidenceText) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请添加链接、CSV 或截图证据" : "Add a link, CSV, or screenshot evidence"
    };
  }

  let created: Awaited<ReturnType<typeof performanceSourceService.createSource>>;
  try {
    created = await performanceSourceService.createSource({
      campaignRef,
      clientEmail,
      platform,
      sourceType: resolveSourceType({
        url: sourceUrl,
        hasFile,
        hasText: Boolean(evidenceText)
      }),
      url: sourceUrl || null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create source";
    return {
      ok: false as const,
      error: lang === "zh" ? `无法创建归因来源：${message}` : `Unable to create source: ${message}`
    };
  }

  let rawText = evidenceText;
  let fileName: string | undefined;
  let analysis: PlatformAttributionAnalysis | { ok: false; error: string } | null = null;

  try {
    if (hasFile && file instanceof File) {
      const source = await performanceSourceService.attachEvidence({
        sourceId: created.source.id,
        campaignId: created.campaign.id,
        brandUserId: created.campaign.brandId,
        clientEmail,
        platform,
        file
      });
      fileName = source.fileName ?? file.name;

      if (file.type.startsWith("image/")) {
        const buffer = Buffer.from(await file.arrayBuffer());
        analysis = await analyzePlatformScreenshot({
          platform: analyzerPlatform(platform),
          imageBase64: buffer.toString("base64"),
          mimeType: file.type,
          fileName,
          locale: lang
        });
      } else {
        rawText = await file.text();
      }
    }

    if (!analysis && rawText) {
      analysis = await analyzePlatformExport({
        platform: analyzerPlatform(platform),
        rawText,
        fileName,
        locale: lang
      });
    }

    if (analysis && !("metrics" in analysis)) {
      await performanceSourceService.markFailed({
        sourceId: created.source.id,
        campaignId: created.campaign.id,
        brandUserId: created.campaign.brandId,
        clientEmail,
        platform,
        error: analysis.error
      });
      revalidatePath("/brand/attribution");
      return { ok: false as const, error: analysis.error };
    }

    if (!analysis) {
      revalidatePath("/brand/attribution");
      return {
        ok: true as const,
        status: "PENDING" as const
      };
    }

    const result = analysis;
    const metrics = result.metrics;
    const orderId = String(formData.get("order_id") ?? "").trim();
    const deliverableId = String(formData.get("deliverable_id") ?? "").trim();
    const deliverableVersion = Number(formData.get("deliverable_version") ?? 1);
    const order = orderId ? await getOrder(orderId) : null;

    if (order && order.client_email === clientEmail.toLowerCase() && deliverableId) {
      await bindDeliverablePerformance({
        org_id: orgIdFromEmail(clientEmail),
        order_id: order.id,
        deliverable_id: deliverableId,
        deliverable_version: deliverableVersion,
        project_id: order.project_id,
        name: String(formData.get("name") ?? order.title ?? "Performance source"),
        platform: metrics.platform,
        platform_ad_id: metrics.platform_ad_id,
        platform_campaign_id: metrics.platform_campaign_id,
        studio_id: order.creator_id,
        category: String(formData.get("category") ?? "CPG"),
        hook_type: metrics.hook_type as HookType,
        length_sec: metrics.length_sec,
        aspect_ratio: String(formData.get("aspect_ratio") ?? "9:16"),
        style_presets: String(formData.get("style_presets") ?? "ugc,cinematic")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        spend_usd: metrics.spend_usd,
        impressions: metrics.impressions,
        metrics: {
          ctr: metrics.ctr,
          hook_score: metrics.hook_score,
          completion_rate: metrics.completion_rate,
          watch_time_sec: metrics.watch_time_sec,
          engagement_rate: metrics.engagement_rate,
          conversion_rate: metrics.conversion_rate,
          roas: metrics.roas
        },
        source_type: "platform_upload",
        upload_file_name: result.upload_file_name ?? fileName,
        ai_summary: result.summary,
        ai_insights: result.insights,
        campaign_recommendations: result.campaign_recommendations,
        analysis_source: result.source
      });
    }

    const source = await performanceSourceService.markAnalyzed({
      sourceId: created.source.id,
      campaignId: created.campaign.id,
      brandUserId: created.campaign.brandId,
      clientEmail,
      platform,
      metrics: result.metrics as unknown as Record<string, unknown>,
      analysis: {
        summary: result.summary,
        insights: result.insights,
        recommendations: result.campaign_recommendations ?? { en: [], zh: [] },
        source: result.source,
        confidence: result.confidence
      },
      confidence: result.confidence
    });

    revalidatePath("/brand/attribution");
    revalidatePath("/brand/analytics");
    revalidatePath("/brand/creative-dna");
    revalidatePath("/brand");

    return {
      ok: true as const,
      source,
      analysis: {
        summary: result.summary[lang],
        insights: result.insights[lang],
        recommendations: result.campaign_recommendations?.[lang] ?? [],
        source: result.source,
        confidence: result.confidence
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Source import failed";
    await performanceSourceService.markFailed({
      sourceId: created.source.id,
      campaignId: created.campaign.id,
      brandUserId: created.campaign.brandId,
      clientEmail,
      platform,
      error: message
    });
    revalidatePath("/brand/attribution");
    return {
      ok: false as const,
      error: lang === "zh" ? `归因来源导入失败：${message}` : `Performance source failed: ${message}`
    };
  }
}

export async function refreshCreativeIntelligenceAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const clientEmail = await getCurrentClientEmail();
  if (!clientEmail) {
    return { ok: false as const, error: lang === "zh" ? "请先登录" : "Sign in required" };
  }

  const result = await refreshOrgIntelligenceStore(orgIdFromEmail(clientEmail));
  revalidatePath("/brand/analytics");
  revalidatePath("/brand/creative-dna");
  revalidatePath("/brand");

  return { ok: true as const, ...result };
}
