import type { Locale } from "@/lib/i18n";
import type { CommercialObjective } from "@/lib/project-types";
import { hasOpenAI, openAIModel } from "@/lib/studioos/config";

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

const OBJECTIVE_LABELS: Record<CommercialObjective, { en: string; zh: string }> = {
  launch: { en: "Product launch", zh: "新品上市" },
  scale: { en: "Scale / conversion", zh: "放量转化" },
  test: { en: "Creative testing", zh: "创意测试" },
  seasonal: { en: "Seasonal campaign", zh: "季节营销" },
  other: { en: "Brand awareness", zh: "品牌曝光" },
  "": { en: "General campaign", zh: "常规推广" }
};

function trimLines(parts: string[]) {
  return parts.map((part) => part.trim()).filter(Boolean);
}

export function templateReorganizeBrandBrief(
  input: BrandQuestionnaireInput,
  locale: Locale
): ReorganizedBrandBrief {
  const productName =
    input.productName?.trim() ||
    (locale === "zh" ? "我的产品" : "My product");
  const objective =
    input.objectiveLabel ||
    OBJECTIVE_LABELS[input.objective || "other"][locale];
  const platforms = input.platforms.length
    ? input.platforms.join(locale === "zh" ? "、" : ", ")
    : locale === "zh"
      ? "TikTok、Meta"
      : "TikTok, Meta";
  const audience =
    input.audienceDescription.trim() ||
    (locale === "zh" ? "25–40 岁移动端购物用户" : "Mobile shoppers aged 25–40");
  const description =
    input.rawSummary.trim() ||
    input.productDescription.trim() ||
    (locale === "zh" ? "希望用短视频突出产品卖点并带来转化。" : "Short-form video highlighting product proof and driving conversions.");

  const campaign_goal =
    locale === "zh"
      ? `为「${productName}」制作 ${platforms} 效果广告，核心目标是${objective}。${description}`
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

export async function reorganizeBrandBriefWithAI(
  input: BrandQuestionnaireInput,
  locale: Locale
): Promise<ReorganizedBrandBrief> {
  const fallback = templateReorganizeBrandBrief(input, locale);

  if (!hasOpenAI()) {
    return fallback;
  }

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
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: openAIModel(),
        temperature: 0.35,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              locale === "zh"
                ? "你是品牌广告 Brief 助手。用户用口语描述需求，你要整理成专业、简洁、可执行的 Campaign Brief。保留用户原意，不要编造不存在的产品功能。返回 JSON：campaign_goal（2-4句专业描述）、product_name、target_audience（一句话）、title（Campaign 标题）、notes（给 Studio 的补充说明，可含用户原话要点）。"
                : "You are a brand ad brief assistant. Users write casually; you reorganize into a professional, concise campaign brief. Preserve intent; do not invent product claims. Return JSON: campaign_goal (2-4 sentences), product_name, target_audience (one line), title (campaign title), notes (studio notes, may include user highlights)."
          },
          {
            role: "user",
            content: JSON.stringify(payload, null, 2)
          }
        ]
      }),
      signal: AbortSignal.timeout(30_000)
    });

    if (!response.ok) {
      return fallback;
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return fallback;
    }

    const parsed = JSON.parse(content) as Partial<ReorganizedBrandBrief>;
    return {
      campaign_goal: String(parsed.campaign_goal ?? fallback.campaign_goal).trim(),
      product_name: String(parsed.product_name ?? fallback.product_name).trim(),
      target_audience: String(parsed.target_audience ?? fallback.target_audience).trim(),
      title: String(parsed.title ?? fallback.title).trim(),
      notes: String(parsed.notes ?? fallback.notes).trim(),
      source: "openai"
    };
  } catch {
    return fallback;
  }
}

export function objectiveOptions(locale: Locale): { id: CommercialObjective; label: string }[] {
  return [
    { id: "launch", label: OBJECTIVE_LABELS.launch[locale] },
    { id: "scale", label: OBJECTIVE_LABELS.scale[locale] },
    { id: "test", label: OBJECTIVE_LABELS.test[locale] },
    { id: "seasonal", label: OBJECTIVE_LABELS.seasonal[locale] },
    { id: "other", label: OBJECTIVE_LABELS.other[locale] }
  ];
}

export const PLATFORM_OPTIONS = ["TikTok", "Meta", "YouTube", "Instagram", "Amazon"] as const;
