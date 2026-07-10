import type { Locale } from "@/lib/i18n";
import { hasOpenAI, openAIModel } from "@/lib/studioos/config";

export type BrandProfilePolishInput = {
  companyName: string;
  displayName: string;
  industry: string;
  website?: string;
  draft: string;
  existingHeadline?: string;
  existingBio?: string;
};

export type BrandProfilePolishResult = {
  headline: string;
  bio: string;
  source: "openai" | "template";
};

export function templatePolishBrandProfile(
  input: BrandProfilePolishInput,
  locale: Locale
): BrandProfilePolishResult {
  const name = input.displayName.trim() || input.companyName.trim() || (locale === "zh" ? "我的品牌" : "My brand");
  const industry = input.industry.trim();
  const draft = input.draft.trim() || input.existingBio?.trim() || input.existingHeadline?.trim() || "";

  const headline =
    locale === "zh"
      ? industry
        ? `${industry}品牌 ${name}`
        : `${name} — 效果广告与品牌短片`
      : industry
        ? `${name} — ${industry}`
        : `${name} — performance video & brand films`;

  const bioParts =
    locale === "zh"
      ? [
          draft || `${name} 专注面向移动端的效果广告与品牌短片。`,
          industry ? `行业：${industry}。` : "",
          input.website?.trim() ? `官网：${input.website.trim()}` : ""
        ]
      : [
          draft || `${name} creates performance ads and brand films for mobile-first audiences.`,
          industry ? `Industry: ${industry}.` : "",
          input.website?.trim() ? `Website: ${input.website.trim()}` : ""
        ];

  return {
    headline: input.existingHeadline?.trim() || headline,
    bio: bioParts.filter(Boolean).join("\n\n"),
    source: "template"
  };
}

export async function polishBrandProfileWithAI(
  input: BrandProfilePolishInput,
  locale: Locale
): Promise<BrandProfilePolishResult> {
  const fallback = templatePolishBrandProfile(input, locale);

  if (!hasOpenAI()) {
    return fallback;
  }

  const payload = {
    company_name: input.companyName,
    display_name: input.displayName,
    industry: input.industry,
    website: input.website ?? "",
    draft: input.draft,
    existing_headline: input.existingHeadline ?? "",
    existing_bio: input.existingBio ?? ""
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
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              locale === "zh"
                ? "你是品牌主页文案助手。用户用口语描述品牌，你要整理成公开主页可用的文案。headline 是一句话介绍（≤40字，清晰说明品牌做什么），bio 是品牌介绍（2-4句，专业但好读，适合品牌方主页）。保留用户原意，不要编造不存在的产品或数据。返回 JSON：headline, bio。"
                : "You are a brand homepage copy assistant. Users describe their brand casually; you produce public-facing copy. headline is one line (≤80 chars, what the brand does). bio is 2-4 sentences, professional and readable for an advertiser homepage. Preserve intent; do not invent claims. Return JSON: headline, bio."
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
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as { headline?: string; bio?: string };
    const headline = String(parsed.headline ?? "").trim();
    const bio = String(parsed.bio ?? "").trim();

    if (!headline || !bio) return fallback;

    return { headline, bio, source: "openai" };
  } catch {
    return fallback;
  }
}
