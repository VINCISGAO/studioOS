import { faqText, type FaqCategoryId, type FaqItem } from "@/lib/marketing/faq-copy";
import type { Locale } from "@/lib/i18n";

export type MarketingFaqKnowledgeRow = {
  sourceKey: string;
  languageCode: string;
  module: string;
  question: string;
  answer: string;
  searchText: string;
  knowledgeType: "FAQ";
  visibility: "public";
  sourceType: "marketing_faq";
  version: string;
  verifiedAt: Date;
  metadataJson: {
    source: string;
    categoryId: FaqCategoryId;
    locale: Locale;
    sourceVersion: string;
    tone: string;
  };
};

export const MARKETING_FAQ_KNOWLEDGE_SOURCE_VERSION = "marketing_faq_v1";
export const MARKETING_FAQ_KNOWLEDGE_PER_LOCALE = 18;

function flattenAnswer(item: FaqItem): string {
  if (!item.bullets?.length) {
    return item.answer.trim();
  }

  return `${item.answer.trim()}\n${item.bullets.map((bullet) => `• ${bullet}`).join("\n")}`;
}

export function buildMarketingFaqKnowledgeRows(): MarketingFaqKnowledgeRow[] {
  const locales: Locale[] = ["zh", "en"];
  const rows: MarketingFaqKnowledgeRow[] = [];

  for (const locale of locales) {
    const copy = faqText(locale);
    const languageCode = locale === "zh" ? "zh-CN" : "en";

    for (const category of copy.categories) {
      category.items.forEach((item, index) => {
        const answer = flattenAnswer(item);
        const ordinal = String(index + 1).padStart(2, "0");

        rows.push({
          sourceKey: `marketing_faq_${locale}_${category.id}_${ordinal}`,
          languageCode,
          module: category.title,
          question: item.question,
          answer,
          searchText: `${item.question}\n${category.title}\n${answer}`,
          knowledgeType: "FAQ",
          visibility: "public",
          sourceType: "marketing_faq",
          version: MARKETING_FAQ_KNOWLEDGE_SOURCE_VERSION,
          verifiedAt: new Date(),
          metadataJson: {
            source: "lib/marketing/faq-copy.ts",
            categoryId: category.id,
            locale,
            sourceVersion: MARKETING_FAQ_KNOWLEDGE_SOURCE_VERSION,
            tone: "platform_faq"
          }
        });
      });
    }
  }

  return rows;
}
