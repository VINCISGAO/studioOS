import "server-only";

import { knowledgeCenterRepository } from "@/features/knowledge-center/knowledge-center.repository";
import { validateKnowledgeSlug } from "@/lib/knowledge/knowledge-editor-validation";

export async function checkKnowledgeSlugAvailability(input: {
  slug: string;
  excludeArticleId?: string;
}) {
  const validation = validateKnowledgeSlug(input.slug);
  if (!validation.ok) {
    return { available: false, reason: validation.message };
  }

  const existingArticleId = await knowledgeCenterRepository.findActiveArticleIdBySlug(
    input.slug,
    input.excludeArticleId
  );
  return {
    available: !existingArticleId,
    reason: existingArticleId ? "This slug is already used by another article." : null,
    existing_article_id: existingArticleId
  };
}
