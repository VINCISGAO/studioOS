import "server-only";

import { knowledgeCenterRepository } from "@/features/knowledge-center/knowledge-center.repository";
import { slugifyKnowledgeTitle } from "@/features/knowledge-center/knowledge-seo.heuristics";
import { KNOWLEDGE_SLUG_MAX_LENGTH } from "@/lib/knowledge/knowledge-editor.constants";
import { validateKnowledgeSlug } from "@/lib/knowledge/knowledge-editor-validation";

function normalizeSlug(value: string) {
  return value.trim().replace(/^\/+|\/+$/g, "").slice(0, KNOWLEDGE_SLUG_MAX_LENGTH);
}

export function buildKnowledgeSlugCandidate(title: string, articleId?: string) {
  const trimmed = title.trim();
  if (trimmed) {
    const fromTitle = normalizeSlug(slugifyKnowledgeTitle(trimmed));
    if (fromTitle && fromTitle !== "article" && validateKnowledgeSlug(fromTitle).ok) {
      return fromTitle;
    }
  }

  if (articleId?.trim()) {
    const fromId = normalizeSlug(articleId.trim().toLowerCase());
    if (validateKnowledgeSlug(fromId).ok) {
      return fromId;
    }
  }

  return normalizeSlug(slugifyKnowledgeTitle(trimmed || "article"));
}

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

/** Allocate a unique public slug from title, falling back to article id when title is empty. */
export async function allocateUniqueKnowledgeSlug(input: {
  title: string;
  articleId: string;
  excludeArticleId?: string;
}) {
  const base = buildKnowledgeSlugCandidate(input.title, input.articleId);
  let candidate = base;
  let suffix = 2;

  while (suffix <= 999) {
    const check = await checkKnowledgeSlugAvailability({
      slug: candidate,
      excludeArticleId: input.excludeArticleId ?? input.articleId
    });
    if (check.available) {
      return candidate;
    }

    const suffixLabel = `-${suffix}`;
    const maxBaseLength = Math.max(1, KNOWLEDGE_SLUG_MAX_LENGTH - suffixLabel.length);
    candidate = `${base.slice(0, maxBaseLength)}${suffixLabel}`;
    suffix += 1;
  }

  throw new Error("Unable to allocate a unique knowledge article slug.");
}
