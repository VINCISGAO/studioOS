import {
  buildMarketingFaqKnowledgeRows,
  MARKETING_FAQ_KNOWLEDGE_PER_LOCALE
} from "@/features/ai-copilot/marketing-faq-knowledge.mapper";
import { marketingFaqKnowledgeRepository } from "@/features/ai-copilot/marketing-faq-knowledge.repository";

export class MarketingFaqKnowledgeService {
  buildRows() {
    return buildMarketingFaqKnowledgeRows();
  }

  async syncMarketingFaqToKnowledgeBase() {
    const rows = buildMarketingFaqKnowledgeRows();
    const zhCount = rows.filter((row) => row.languageCode === "zh-CN").length;
    const enCount = rows.filter((row) => row.languageCode === "en").length;

    if (zhCount !== MARKETING_FAQ_KNOWLEDGE_PER_LOCALE || enCount !== MARKETING_FAQ_KNOWLEDGE_PER_LOCALE) {
      throw new Error(
        `Marketing FAQ knowledge expected ${MARKETING_FAQ_KNOWLEDGE_PER_LOCALE} rows per locale, got zh=${zhCount}, en=${enCount}`
      );
    }

    const count = await marketingFaqKnowledgeRepository.upsertMany(rows);

    return {
      count,
      zhCount,
      enCount,
      sourceKeys: rows.map((row) => row.sourceKey)
    };
  }
}

export const marketingFaqKnowledgeService = new MarketingFaqKnowledgeService();
