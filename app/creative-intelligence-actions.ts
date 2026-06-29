"use server";

import { revalidatePath } from "next/cache";
import { getCurrentClientEmail } from "@/lib/client-session";
import type { Locale } from "@/lib/i18n";
import { getOrder } from "@/lib/order-service";
import {
  bindDeliverablePerformance,
  orgIdFromEmail,
  refreshOrgIntelligenceStore
} from "@/lib/studioos/creative-performance-store";
import type { HookType } from "@/lib/studioos/creative-performance-types";
import { analyzePlatformExport, analyzePlatformScreenshot } from "@/lib/studioos/platform-data-analyzer";
import type { PlatformAttributionPlatform, PlatformAttributionAnalysis } from "@/lib/studioos/platform-attribution-types";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return raw === "zh" ? "zh" : "en";
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
