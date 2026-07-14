import type { KnowledgeLucienCategory } from "@prisma/client";
import {
  buildKnowledgeLucienFaqSourceKey,
  buildKnowledgeLucienSourceKey,
  KNOWLEDGE_CENTER_SOURCE_TYPE
} from "@/features/knowledge-center/knowledge-center.constants";
import type { KnowledgeTranslationDto } from "@/features/knowledge-center/knowledge-center.types";

export type KnowledgeLucienQaRow = {
  sourceKey: string;
  languageCode: string;
  module: string;
  question: string;
  answer: string;
  searchText: string;
  knowledgeType: "PRODUCT_HELP" | "WORKFLOW_GUIDE" | "FAQ";
  visibility: "public";
  sourceType: typeof KNOWLEDGE_CENTER_SOURCE_TYPE;
  version: string;
  verifiedAt: Date;
  metadataJson: Record<string, unknown>;
};

const LUCCHAT_SUMMARY_MAX_CHARS = 480;

function lucienModuleLabel(category: KnowledgeLucienCategory) {
  return category.replaceAll("_", " ");
}

function knowledgeTypeForCategory(category: KnowledgeLucienCategory): KnowledgeLucienQaRow["knowledgeType"] {
  if (category === "PRICING" || category === "LEGAL") return "FAQ";
  if (category === "WORKFLOW" || category === "REVIEW") return "WORKFLOW_GUIDE";
  return "PRODUCT_HELP";
}

function stripBodyPlain(translation: KnowledgeTranslationDto) {
  return (translation.body_html || translation.body_markdown || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildChatSummary(translation: KnowledgeTranslationDto, lucienSummary: string, bodyPlain: string) {
  const summary =
    lucienSummary ||
    translation.excerpt?.trim() ||
    translation.subtitle?.trim() ||
    "";
  if (summary) return summary.slice(0, LUCCHAT_SUMMARY_MAX_CHARS);
  if (!bodyPlain) return "";
  return `${bodyPlain.slice(0, LUCCHAT_SUMMARY_MAX_CHARS)}…`;
}

function sharedMetadata(input: {
  slug: string;
  translation: KnowledgeTranslationDto;
  categoryName?: string | null;
}) {
  const { slug, translation, categoryName } = input;
  const lucien = translation.lucien!;
  return {
    source: KNOWLEDGE_CENTER_SOURCE_TYPE,
    slug,
    languageCode: translation.language_code,
    aiIntent: lucien.ai_intent,
    allowCitation: lucien.allow_citation,
    allowTraining: lucien.allow_training,
    searchPriority: lucien.search_priority,
    weight: lucien.weight,
    priority: lucien.priority,
    category: lucien.category,
    module: categoryName ?? lucienModuleLabel(lucien.category),
    knowledgeType: knowledgeTypeForCategory(lucien.category),
    version: translation.updated_at
  };
}

export function buildKnowledgeLucienRows(input: {
  slug: string;
  translation: KnowledgeTranslationDto;
  categoryName?: string | null;
}): KnowledgeLucienQaRow[] {
  const { slug, translation, categoryName } = input;
  const lucien = translation.lucien;
  if (!lucien?.lucien_learning) return [];

  const sourceKey = buildKnowledgeLucienSourceKey(slug, translation.language_code);
  const bodyPlain = stripBodyPlain(translation);
  const summary = lucien.ai_summary?.trim() || "";
  const chatAnswer = buildChatSummary(translation, summary, bodyPlain);

  const keywords = [
    ...lucien.ai_keywords,
    ...lucien.ai_topics,
    categoryName ?? "",
    translation.title
  ]
    .map((item) => item.trim())
    .filter(Boolean);

  const articleSearchText = [
    translation.title,
    translation.subtitle,
    summary,
    translation.excerpt,
    keywords.join(" "),
    bodyPlain.slice(0, 2000),
    ...translation.faqs.flatMap((item) => [item.question, item.answer])
  ]
    .filter(Boolean)
    .join("\n");

  const shared = sharedMetadata(input);
  const rows: KnowledgeLucienQaRow[] = [];

  if (chatAnswer || articleSearchText) {
    rows.push({
      sourceKey,
      languageCode: translation.language_code,
      module: shared.module,
      question: translation.title,
      answer: chatAnswer,
      searchText: articleSearchText,
      knowledgeType: shared.knowledgeType,
      visibility: "public",
      sourceType: KNOWLEDGE_CENTER_SOURCE_TYPE,
      version: shared.version,
      verifiedAt: new Date(),
      metadataJson: {
        ...shared,
        rowKind: "article_summary"
      }
    });
  }

  translation.faqs.forEach((faq, index) => {
    const question = faq.question.trim();
    const answer = faq.answer.trim();
    if (!question || !answer) return;

    rows.push({
      sourceKey: buildKnowledgeLucienFaqSourceKey(slug, translation.language_code, index),
      languageCode: translation.language_code,
      module: shared.module,
      question,
      answer: answer.slice(0, LUCCHAT_SUMMARY_MAX_CHARS),
      searchText: [question, answer, translation.title, summary, keywords.join(" ")].filter(Boolean).join("\n"),
      knowledgeType: "FAQ",
      visibility: "public",
      sourceType: KNOWLEDGE_CENTER_SOURCE_TYPE,
      version: shared.version,
      verifiedAt: new Date(),
      metadataJson: {
        ...shared,
        rowKind: "faq",
        faqIndex: index
      }
    });
  });

  return rows;
}
