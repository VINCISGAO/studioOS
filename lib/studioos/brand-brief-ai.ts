import { aiGatewayService } from "@/features/ai/ai-gateway.service";
import { logger } from "@/lib/core/logger";
import type { Locale } from "@/lib/i18n";
import { isChineseLanguage } from "@/lib/i18n";
import type { CommercialObjective } from "@/lib/project-types";
import { objectiveLabelFor } from "@/lib/studioos/brand-brief-options";
import { hasOpenAI, resolveOpenAIModel } from "@/lib/core/config/ai";

export type BrandQuestionnaireInput = {
  productName?: string;
  productDescription: string;
  objective: CommercialObjective;
  objectiveLabel: string;
  audienceDescription: string;
  platforms: string[];
  extraNotes?: string;
  rawSummary: string;
  productUrl?: string;
};

export type ReorganizedBrandBrief = {
  campaign_goal: string;
  product_name: string;
  target_audience: string;
  title: string;
  notes: string;
  source: "openai" | "template";
};

function trimLines(parts: string[]) {
  return parts.map((part) => part.trim()).filter(Boolean);
}

function usesChinese(locale: Locale) {
  return locale === "zh" || isChineseLanguage(locale);
}

function parseJsonObject<T extends Record<string, unknown>>(raw: string): T {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced?.[1]?.trim() ?? trimmed;
  return JSON.parse(body) as T;
}

function normalizeCampaignGoalCopy(goal: string, locale: Locale) {
  const trimmed = goal.trim();
  if (!usesChinese(locale)) return trimmed;

  const normalized = trimmed
    .replace(/^本次活动旨在/, "广告创意主旨为")
    .replace(/^本次广告旨在/, "广告创意主旨为")
    .replace(/^本次\s*Campaign\s*旨在/i, "广告创意主旨为");
  if (/^广告创意主旨为/.test(normalized)) return normalized;
  return `广告创意主旨为${normalized}`;
}

export function templateReorganizeBrandBrief(
  input: BrandQuestionnaireInput,
  locale: Locale
): ReorganizedBrandBrief {
  const zh = usesChinese(locale);
  const productName =
    input.productName?.trim() ||
    (zh ? "我的产品" : "My product");
  const objective = input.objectiveLabel || objectiveLabelFor(input.objective, locale);
  const platforms = input.platforms.length
    ? input.platforms.join(zh ? "、" : ", ")
    : zh
      ? "TikTok、Meta"
      : "TikTok, Meta";
  const audience =
    input.audienceDescription.trim() ||
    (zh ? "25–40 岁移动端购物用户" : "Mobile shoppers aged 25–40");
  const description =
    input.rawSummary.trim() ||
    input.productDescription.trim() ||
    (zh ? "希望用短视频突出产品卖点并带来转化。" : "Short-form video highlighting product proof and driving conversions.");

  const campaign_goal = zh
    ? `广告创意主旨为「${productName}」制作 ${platforms} 效果广告，核心目标是${objective}。${description}`
    : `Produce performance ads for "${productName}" on ${platforms}. Primary goal: ${objective.toLowerCase()}. ${description}`;

  const notes = trimLines([
    input.productDescription,
    input.extraNotes ?? "",
    input.rawSummary && input.rawSummary !== description ? input.rawSummary : ""
  ]).join("\n\n");

  return {
    campaign_goal,
    product_name: productName,
    target_audience: audience,
    title: `${productName} Campaign`,
    notes,
    source: "template"
  };
}

export type BrandBriefAiUsage = {
  charged: boolean;
  provider: string;
  tokenInput: number;
  tokenOutput: number;
  cost: number;
};

export type BrandBriefAiResult = {
  brief: ReorganizedBrandBrief;
  usage: BrandBriefAiUsage;
};

export async function reorganizeBrandBriefWithAI(
  input: BrandQuestionnaireInput,
  locale: Locale
): Promise<BrandBriefAiResult> {
  const fallback = templateReorganizeBrandBrief(input, locale);

  if (!hasOpenAI()) {
    return {
      brief: fallback,
      usage: { charged: false, provider: "template", tokenInput: 0, tokenOutput: 0, cost: 0 }
    };
  }

  const zh = usesChinese(locale);
  const payload = {
    product_name: input.productName ?? "",
    product_url: input.productUrl ?? "",
    product_description: input.productDescription,
    objective: input.objectiveLabel,
    audience: input.audienceDescription,
    platforms: input.platforms,
    extra_notes: input.extraNotes ?? "",
    raw_summary: input.rawSummary
  };

  try {
    const result = await aiGatewayService.chatCompletion({
      system: zh
        ? "你是品牌广告 Brief 助手。用户会用口语、随意地描述需求。你必须读懂真实意图（产品是什么、想在哪投放、目标受众、卖点），改写成专业、简洁、可执行的 Campaign Brief。campaign_goal 必须以「广告创意主旨为」开头，禁止使用「本次活动旨在」「本次广告旨在」这类活动总结口吻。禁止把用户原话原样拼进 campaign_goal；要重写为完整专业句子。不要编造不存在的产品功能。返回 JSON：campaign_goal（2-4句专业描述）、product_name、target_audience（一句话）、title（Campaign 标题）、notes（给 Studio 的补充说明）。"
        : "You are a brand ad brief assistant. Users write casually. Infer the real intent (product, platforms, audience, selling points) and rewrite into a professional campaign brief. Do not paste the user's raw words into campaign_goal. Do not invent product claims. Return JSON: campaign_goal (2-4 sentences), product_name, target_audience (one line), title, notes.",
      user: JSON.stringify(payload, null, 2),
      model: resolveOpenAIModel(),
      temperature: 0.35,
      jsonMode: true,
      language: zh ? "zh-CN" : "en"
    });

    if (!result.content) {
      throw new Error("empty_openai_response");
    }

    let parsed: Partial<ReorganizedBrandBrief>;
    try {
      parsed = parseJsonObject<Partial<ReorganizedBrandBrief>>(result.content);
    } catch {
      throw new Error("invalid_openai_json");
    }

    return {
      brief: {
        campaign_goal: normalizeCampaignGoalCopy(String(parsed.campaign_goal ?? fallback.campaign_goal), locale),
        product_name: String(parsed.product_name ?? fallback.product_name).trim(),
        target_audience: String(parsed.target_audience ?? fallback.target_audience).trim(),
        title: String(parsed.title ?? fallback.title).trim(),
        notes: String(parsed.notes ?? fallback.notes).trim(),
        source: "openai"
      },
      usage: {
        charged: true,
        provider: result.provider,
        tokenInput: result.tokenInput,
        tokenOutput: result.tokenOutput,
        cost: result.cost
      }
    };
  } catch (error) {
    logger.error("Brand brief AI polish failed", {
      service: "brand-brief-ai",
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

