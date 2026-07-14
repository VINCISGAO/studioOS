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

  const taken = await knowledgeCenterRepository.isSlugTaken(input.slug, input.excludeArticleId);
  return {
    available: !taken,
    reason: taken ? "This slug is already used by another article." : null
  };
}
