import { faqText, type FaqCategoryId, type FaqItem } from "@/lib/marketing/faq-copy";
import type { MarketingLocale } from "@/lib/i18n";
import { MARKETING_LANGUAGE_CODES } from "@/lib/marketing/i18n/resolve-marketing-copy";

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
    locale: MarketingLocale;
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
  const rows: MarketingFaqKnowledgeRow[] = [];

  for (const locale of MARKETING_LANGUAGE_CODES) {
    const copy = faqText(locale);
    const languageCode = locale;

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
