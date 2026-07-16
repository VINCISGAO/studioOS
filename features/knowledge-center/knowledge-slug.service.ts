import "server-only";

import { knowledgeCenterRepository } from "@/features/knowledge-center/knowledge-center.repository";
import { slugifyKnowledgeTitle } from "@/features/knowledge-center/knowledge-seo.heuristics";
import { KNOWLEDGE_SLUG_MAX_LENGTH } from "@/lib/knowledge/knowledge-editor.constants";
import { validateKnowledgeSlug } from "@/lib/knowledge/knowledge-editor-validation";

function normalizeSlug(value: string) {
  return value.trim().replace(/^\/+|\/+$/g, "").slice(0, KNOWLEDGE_SLUG_MAX_LENGTH);
}

export function buildKnowledgeSlugCandidate(title: string) {
  const trimmed = title.trim();
  const fromTitle = normalizeSlug(slugifyKnowledgeTitle(trimmed));

  if (fromTitle && fromTitle !== "article" && validateKnowledgeSlug(fromTitle).ok) {
    return fromTitle;
  }

  return fromTitle || "article";
}

export async function checkKnowledgeSlugAvailability(input: {
  slug: string;
  excludeArticleId?: string;
}) {
  const validation = validateKnowledgeSlug(input.slug);
  if (!validation.ok) {
    return { available: false, reason: validation.message };
  }

  const existingArticleId = await knowledgeCenterRepository.findOccupiedArticleIdBySlug(
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
  const base = buildKnowledgeSlugCandidate(input.title);
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

function isSlugUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    String((error as { code?: string }).code) === "P2002"
  );
}

/** Resolve and persist a unique slug, retrying on DB unique conflicts (P2002). */
export async function commitArticleSlug(
  articleId: string,
  input: {
    title: string;
    publishing: boolean;
    wasPublished?: boolean;
    existingSlug?: string;
    preferredSlug?: string;
  }
): Promise<string> {
  const existingSlug = input.existingSlug?.trim().replace(/^\/+|\/+$/g, "") ?? "";
  if (input.wasPublished && existingSlug) {
    return existingSlug;
  }

  const draftSlug = articleId.replace(/^\/+|\/+$/g, "");
  if (!input.publishing) {
    if (existingSlug !== draftSlug) {
      await knowledgeCenterRepository.updateArticle(articleId, { slug: draftSlug });
    }
    return draftSlug;
  }

  const preferred = input.preferredSlug?.trim().replace(/^\/+|\/+$/g, "") ?? "";
  if (preferred && validateKnowledgeSlug(preferred).ok) {
    const check = await checkKnowledgeSlugAvailability({
      slug: preferred,
      excludeArticleId: articleId
    });
    if (check.available) {
      await knowledgeCenterRepository.updateArticle(articleId, { slug: preferred });
      return preferred;
    }
  }

  let candidate = await allocateUniqueKnowledgeSlug({
    title: input.title,
    articleId,
    excludeArticleId: articleId
  });

  if (existingSlug === candidate) {
    return candidate;
  }

  for (let attempt = 0; attempt < 25; attempt++) {
    try {
      await knowledgeCenterRepository.updateArticle(articleId, { slug: candidate });
      return candidate;
    } catch (error) {
      if (!isSlugUniqueConstraintError(error)) {
        throw error;
      }
      const suffixLabel = `-${attempt + 2}`;
      const base = candidate.replace(/-\d+$/, "") || candidate;
      const maxBaseLength = Math.max(1, KNOWLEDGE_SLUG_MAX_LENGTH - suffixLabel.length);
      candidate = `${base.slice(0, maxBaseLength)}${suffixLabel}`;
    }
  }

  await knowledgeCenterRepository.updateArticle(articleId, { slug: draftSlug });
  return draftSlug;
}
