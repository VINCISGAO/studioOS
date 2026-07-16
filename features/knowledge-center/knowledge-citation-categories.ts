import { KNOWLEDGE_EDITOR_CATEGORIES } from "@/lib/knowledge/knowledge-editor.constants";

/** Editor-facing taxonomy used for citation coverage (matches publish form categories). */
export const KNOWLEDGE_CITATION_CATEGORY_SLUGS = KNOWLEDGE_EDITOR_CATEGORIES.map((item) => item.slug);

export function knowledgeCitationTopicLabel(slug: string, fallbackName?: string | null) {
  const editor = KNOWLEDGE_EDITOR_CATEGORIES.find((item) => item.slug === slug);
  return editor?.name ?? fallbackName ?? slug;
}
