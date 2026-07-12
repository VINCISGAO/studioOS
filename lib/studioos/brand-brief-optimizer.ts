import "server-only";

import { aiGatewayService } from "@/features/ai/ai-gateway.service";
import { logger } from "@/lib/core/logger";
import { hasOpenAI, resolveOpenAIModel } from "@/lib/core/config/ai";
import type { Locale } from "@/lib/i18n";
import { isChineseLanguage } from "@/lib/i18n";
import { PLATFORM_OPTIONS } from "@/lib/studioos/brand-brief-options";
import type { BrandQuestionnaireInput } from "@/lib/studioos/brand-questionnaire.types";
import {
  coerceBriefDocument,
  coerceOptimizerText,
  coerceStringArray
} from "@/lib/studioos/brand-brief-optimizer-coerce";
import type {
  BrandBriefOptimizerResult,
  BriefOptimizerGap,
  BriefOptimizerSellingPoint
} from "@/lib/studioos/brand-brief-optimizer.types";

function usesChinese(locale: Locale) {
  return locale === "zh" || isChineseLanguage(locale);
}

function parseJsonObject<T extends Record<string, unknown>>(raw: string): T {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced?.[1]?.trim() ?? trimmed;
  return JSON.parse(body) as T;
}

function asStringArray(value: unknown): string[] {
  return coerceStringArray(value);
}

function asSellingPoints(value: unknown): BriefOptimizerSellingPoint[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (typeof item === "string") {
        return { priority: index + 1, label: item.trim() };
      }
      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        return {
          priority: Number(row.priority ?? index + 1) || index + 1,
          label: String(row.label ?? row.name ?? "").trim()
        };
      }
      return null;
    })
    .filter((item): item is BriefOptimizerSellingPoint => Boolean(item?.label))
    .slice(0, 8);
}

function normalizePlatforms(values: string[]) {
  const mapped = values.map((raw) => {
    const lower = raw.toLowerCase();
    if (lower.includes("tiktok")) return "TikTok";
    if (lower.includes("meta") || lower.includes("facebook")) return "Meta";
    if (lower.includes("youtube")) return "YouTube";
    if (lower.includes("instagram")) return "Instagram";
    if (lower.includes("amazon")) return "Amazon";
    return raw.trim();
  });
  return [...new Set(mapped.filter((item) => PLATFORM_OPTIONS.includes(item as (typeof PLATFORM_OPTIONS)[number])))];
}

function optimizerSystemPrompt(locale: Locale) {
  const zh = usesChinese(locale);
  if (zh) {
    return [
      "你是拥有 10 年经验的广告创意总监（Creative Director），任务是把普通想法升级为可直接交给全球创作者执行的专业 Campaign Brief。",
      "禁止只做改写或缩写。你必须：推断策略、补全缺失、排序卖点、生成消费者洞察、给出平台/时长/创作者/调性/CTA 建议。",
      "可以合理推断，但禁止编造具体未提及的产品功能或虚假数据；KPI 用行业参考区间表达。",
      "必须保留并吸收用户已写的全部关键信息（平台、Hook、Story、风格参考、镜头、时长等）。",
      "consumer_insight 要写洞察，不是功能列表（例如：用户买的不是机器人，是安心）。",
      "selling_points 按 Priority 1-4+ 排序，不是原样复制。",
      "gaps 列出用户缺失但影响匹配的信息（预算、国家/市场、品牌调性、竞品、CTA 等），并给出建议。",
      "brief_document 输出完整可执行 Brief（中英专业表达，中文为主），含 Campaign / Objective / Audience / Insight / Key Message / Selling Points / Platforms / Video / Visual Style / Creator / CTA。",
      "返回严格 JSON，字段：campaign_name, primary_objective, secondary_objectives[], recommended_kpis[], audience_primary, audience_segments[], audience_confidence (0-100), consumer_insight, key_message, selling_points[{priority,label}], recommended_platforms[], recommended_video_duration, recommended_creator_types[], recommended_tones[], recommended_cta, visual_style[], gaps[{id,message,suggestion}], brief_document。"
    ].join("\n");
  }

  return [
    "You are a Creative Director with 10 years of experience. Upgrade casual input into an executable professional campaign brief.",
    "Do not paraphrase or shorten. Infer strategy, fill gaps, rank selling points, write consumer insight, and recommend platforms, duration, creators, tone, and CTA.",
    "Preserve every explicit user detail. Insights must be emotional/strategic, not feature lists.",
    "Return strict JSON with: campaign_name, primary_objective, secondary_objectives[], recommended_kpis[], audience_primary, audience_segments[], audience_confidence, consumer_insight, key_message, selling_points[{priority,label}], recommended_platforms[], recommended_video_duration, recommended_creator_types[], recommended_tones[], recommended_cta, visual_style[], gaps[{id,message,suggestion}], brief_document."
  ].join("\n");
}

export function detectBriefGapsFromQuestionnaire(
  input: {
    budgetRange?: string;
    audienceRegion?: string;
    creativeStyles?: string[];
    creativeStyleCustom?: string;
    brandWebsite?: string;
    productUrl?: string;
  },
  locale: Locale
): BriefOptimizerGap[] {
  const zh = usesChinese(locale);
  const gaps: BriefOptimizerGap[] = [];

  if (!input.budgetRange?.trim()) {
    gaps.push({
      id: "budget",
      message: zh ? "未填写预算范围" : "Budget range is missing",
      suggestion: zh ? "建议补充预算，以提高 Creator 匹配准确率。" : "Add a budget range to improve creator matching."
    });
  }
  if (!input.audienceRegion || input.audienceRegion === "global") {
    gaps.push({
      id: "market",
      message: zh ? "未明确主要投放市场" : "Primary market is unclear",
      suggestion: zh ? "是否主要投放美国、东南亚或全球？" : "Clarify whether the campaign targets the US, SEA, or global."
    });
  }
  if ((input.creativeStyles?.length ?? 0) === 0 && !input.creativeStyleCustom?.trim()) {
    gaps.push({
      id: "brand_tone",
      message: zh ? "未选择品牌调性" : "Brand tone is missing",
      suggestion: zh ? "可参考：Apple / Tesla / Nothing / Luxury / Minimal" : "Consider: Apple, Tesla, Nothing, Luxury, or Minimal."
    });
  }
  if (!input.brandWebsite?.trim() && !input.productUrl?.trim()) {
    gaps.push({
      id: "brand_link",
      message: zh ? "缺少品牌或产品链接" : "No brand or product link",
      suggestion: zh ? "补充官网或产品页，便于 AI 与创作者理解品牌。" : "Add a website or product URL for better context."
    });
  }

  return gaps;
}

function mergeGaps(aiGaps: BriefOptimizerGap[], formGaps: BriefOptimizerGap[]) {
  const seen = new Set<string>();
  return [...aiGaps, ...formGaps].filter((gap) => {
    if (seen.has(gap.id)) return false;
    seen.add(gap.id);
    return true;
  });
}

export function buildTemplateBrandBriefOptimizer(
  input: BrandQuestionnaireInput,
  locale: Locale,
  formGaps: BriefOptimizerGap[]
): BrandBriefOptimizerResult {
  return templateOptimizer(input, locale, formGaps);
}

function templateOptimizer(input: BrandQuestionnaireInput, locale: Locale, formGaps: BriefOptimizerGap[]): BrandBriefOptimizerResult {
  const zh = usesChinese(locale);
  const source = (input.rawSummary || input.productDescription || "").trim();
  const productName = input.productName?.trim() || (zh ? "Campaign 项目" : "Campaign project");
  const platforms = normalizePlatforms(
    input.platforms.length ? input.platforms : ["TikTok", "Meta", "Instagram"]
  );

  const selling_points: BriefOptimizerSellingPoint[] = source
    .split(/[、,，\n]/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 4 && line.length <= 80)
    .slice(0, 4)
    .map((label, index) => ({ priority: index + 1, label }));

  const brief_document = zh
    ? [
        `Campaign Brief · ${productName}`,
        "",
        `Objective：${input.objectiveLabel || "新品上市 / 转化"}`,
        `Audience：${input.audienceDescription || "25-40 岁核心目标人群"}`,
        `Insight：消费者真正购买的不是功能堆叠，而是品牌所承诺的安心与连接感。`,
        `Key Message：${source.slice(0, 120) || "用一条清晰的广告主张打动目标受众。"}`,
        `Platforms：${platforms.join("、")}`,
        `Video：30 seconds`,
        `Visual Style：Minimal · Premium · Trustworthy`,
        `Creator：UGC Creator · Lifestyle Creator`,
        `CTA：了解更多并立即行动`,
        "",
        "—— 执行 Brief ——",
        source || "请补充更详细的创意方向、镜头与参考风格。"
      ].join("\n")
    : [
        `Campaign Brief · ${productName}`,
        "",
        `Objective: ${input.objectiveLabel || "Launch / Conversion"}`,
        `Audience: ${input.audienceDescription || "Core audience aged 25-40"}`,
        `Insight: Buyers want reassurance and connection, not feature lists alone.`,
        `Key Message: ${source.slice(0, 120) || "One sharp message that moves the audience to act."}`,
        `Platforms: ${platforms.join(", ")}`,
        `Video: 30 seconds`,
        `Visual Style: Minimal · Premium · Trustworthy`,
        `Creator: UGC Creator · Lifestyle Creator`,
        `CTA: Learn more and take action`,
        "",
        "—— Execution Brief ——",
        source || "Add creative direction, hooks, shots, and references."
      ].join("\n");

  return {
    campaign_name: productName,
    primary_objective: input.objectiveLabel || (zh ? "转化" : "Conversion"),
    secondary_objectives: zh ? ["品牌认知"] : ["Brand awareness"],
    recommended_kpis: ["CTR > 2.8%", "CVR > 4%"],
    audience_primary: input.audienceDescription || (zh ? "25-40 岁目标人群" : "Audience aged 25-40"),
    audience_segments: zh ? ["都市中产", "移动端用户"] : ["Urban", "Mobile-first"],
    audience_confidence: 82,
    consumer_insight: zh
      ? "用户真正购买的不是功能本身，而是品牌承诺的安心感与情感连接。"
      : "People buy reassurance and emotional connection, not specs alone.",
    key_message: source.slice(0, 100) || productName,
    selling_points,
    recommended_platforms: platforms,
    recommended_video_duration: "30s",
    recommended_creator_types: zh ? ["UGC 创作者", "生活方式博主"] : ["UGC Creator", "Lifestyle Creator"],
    recommended_tones: zh ? ["温暖", "高端", "极简", "可信"] : ["Warm", "Premium", "Minimal", "Trustworthy"],
    recommended_cta: zh ? "立即了解并下单" : "Learn more and order today",
    visual_style: zh ? ["Apple Minimal", "柔光", "电影感镜头"] : ["Apple Minimal", "Soft lighting", "Cinema lens"],
    gaps: formGaps,
    brief_document
  };
}

function normalizeOptimizerPayload(raw: Record<string, unknown>, fallback: BrandBriefOptimizerResult): BrandBriefOptimizerResult {
  return {
    campaign_name: coerceOptimizerText(raw.campaign_name, fallback.campaign_name),
    primary_objective: coerceOptimizerText(raw.primary_objective, fallback.primary_objective),
    secondary_objectives: asStringArray(raw.secondary_objectives).length
      ? asStringArray(raw.secondary_objectives)
      : fallback.secondary_objectives,
    recommended_kpis: asStringArray(raw.recommended_kpis).length
      ? asStringArray(raw.recommended_kpis)
      : fallback.recommended_kpis,
    audience_primary: coerceOptimizerText(raw.audience_primary, fallback.audience_primary),
    audience_segments: asStringArray(raw.audience_segments).length
      ? asStringArray(raw.audience_segments)
      : fallback.audience_segments,
    audience_confidence: Math.min(
      100,
      Math.max(0, Number(raw.audience_confidence ?? fallback.audience_confidence) || fallback.audience_confidence)
    ),
    consumer_insight: coerceOptimizerText(raw.consumer_insight, fallback.consumer_insight),
    key_message: coerceOptimizerText(raw.key_message, fallback.key_message),
    selling_points: asSellingPoints(raw.selling_points).length
      ? asSellingPoints(raw.selling_points)
      : fallback.selling_points,
    recommended_platforms: normalizePlatforms(asStringArray(raw.recommended_platforms)).length
      ? normalizePlatforms(asStringArray(raw.recommended_platforms))
      : fallback.recommended_platforms,
    recommended_video_duration: coerceOptimizerText(
      raw.recommended_video_duration,
      fallback.recommended_video_duration
    ),
    recommended_creator_types: asStringArray(raw.recommended_creator_types).length
      ? asStringArray(raw.recommended_creator_types)
      : fallback.recommended_creator_types,
    recommended_tones: asStringArray(raw.recommended_tones).length
      ? asStringArray(raw.recommended_tones)
      : fallback.recommended_tones,
    recommended_cta: coerceOptimizerText(raw.recommended_cta, fallback.recommended_cta),
    visual_style: asStringArray(raw.visual_style).length ? asStringArray(raw.visual_style) : fallback.visual_style,
    gaps: Array.isArray(raw.gaps)
      ? raw.gaps
          .map((item, index) => {
            if (!item || typeof item !== "object") return null;
            const row = item as Record<string, unknown>;
            return {
              id: coerceOptimizerText(row.id, `gap_${index}`),
              message: coerceOptimizerText(row.message),
              suggestion: coerceOptimizerText(row.suggestion)
            };
          })
          .filter((gap): gap is BriefOptimizerGap => Boolean(gap?.message))
      : fallback.gaps,
    brief_document: coerceBriefDocument(raw.brief_document, fallback.brief_document)
  };
}

export async function optimizeBrandBriefWithAI(input: {
  questionnaire: BrandQuestionnaireInput;
  locale: Locale;
  formGaps: BriefOptimizerGap[];
}): Promise<{ optimizer: BrandBriefOptimizerResult; source: "openai" | "template"; usage: { charged: boolean; provider: string; tokenInput: number; tokenOutput: number; cost: number } }> {
  const fallback = templateOptimizer(input.questionnaire, input.locale, input.formGaps);

  if (!hasOpenAI()) {
    return {
      optimizer: fallback,
      source: "template",
      usage: { charged: false, provider: "template", tokenInput: 0, tokenOutput: 0, cost: 0 }
    };
  }

  try {
    const result = await aiGatewayService.chatCompletion({
      system: optimizerSystemPrompt(input.locale),
      user: JSON.stringify(input.questionnaire, null, 2),
      model: resolveOpenAIModel(),
      temperature: 0.35,
      jsonMode: true,
      language: usesChinese(input.locale) ? "zh-CN" : "en"
    });

    if (!result.content) throw new Error("empty_openai_response");

    const parsed = parseJsonObject<Record<string, unknown>>(result.content);
    const optimizer = normalizeOptimizerPayload(parsed, fallback);
    optimizer.gaps = mergeGaps(optimizer.gaps, input.formGaps);

    return {
      optimizer,
      source: "openai",
      usage: {
        charged: true,
        provider: result.provider,
        tokenInput: result.tokenInput,
        tokenOutput: result.tokenOutput,
        cost: result.cost
      }
    };
  } catch (error) {
    logger.error("Brand brief optimizer failed", {
      service: "brand-brief-optimizer",
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
