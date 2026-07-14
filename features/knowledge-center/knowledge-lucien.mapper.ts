import type { KnowledgeLucienCategory } from "@prisma/client";
import {
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

function lucienModuleLabel(category: KnowledgeLucienCategory) {
  return category.replaceAll("_", " ");
}

function knowledgeTypeForCategory(category: KnowledgeLucienCategory): KnowledgeLucienQaRow["knowledgeType"] {
  if (category === "PRICING" || category === "LEGAL") return "FAQ";
  if (category === "WORKFLOW" || category === "REVIEW") return "WORKFLOW_GUIDE";
  return "PRODUCT_HELP";
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
  const summary = lucien.ai_summary?.trim() || translation.excerpt?.trim() || translation.subtitle?.trim() || "";
  const answerParts = [
    summary,
    translation.body_markdown.slice(0, 4000),
    ...translation.faqs.map((item) => `Q: ${item.question}\nA: ${item.answer}`)
  ].filter(Boolean);

  const keywords = [
    ...lucien.ai_keywords,
    ...lucien.ai_topics,
    categoryName ?? "",
    translation.title
  ]
    .map((item) => item.trim())
    .filter(Boolean);

  const searchText = [
    translation.title,
    translation.subtitle,
    summary,
    keywords.join(" "),
    translation.body_markdown.slice(0, 2000)
  ]
    .filter(Boolean)
    .join("\n");

  return [
    {
      sourceKey,
      languageCode: translation.language_code,
      module: categoryName ?? lucienModuleLabel(lucien.category),
      question: translation.title,
      answer: answerParts.join("\n\n"),
      searchText,
      knowledgeType: knowledgeTypeForCategory(lucien.category),
      visibility: "public",
      sourceType: KNOWLEDGE_CENTER_SOURCE_TYPE,
      version: translation.updated_at,
      verifiedAt: new Date(),
      metadataJson: {
        source: KNOWLEDGE_CENTER_SOURCE_TYPE,
        slug,
        languageCode: translation.language_code,
        aiIntent: lucien.ai_intent,
        allowCitation: lucien.allow_citation,
        allowTraining: lucien.allow_training,
        searchPriority: lucien.search_priority,
        weight: lucien.weight,
        priority: lucien.priority,
        category: lucien.category
      }
    }
  ];
}
