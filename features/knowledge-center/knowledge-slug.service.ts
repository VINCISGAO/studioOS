import "server-only";

import { knowledgeCenterRepository } from "@/features/knowledge-center/knowledge-center.repository";
import { slugifyKnowledgeTitle } from "@/features/knowledge-center/knowledge-seo.heuristics";
import { KNOWLEDGE_SLUG_MAX_LENGTH } from "@/lib/knowledge/knowledge-editor.constants";
import { validateKnowledgeSlug } from "@/lib/knowledge/knowledge-editor-validation";

const KNOWLEDGE_UUID_SLUG_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeSlug(value: string) {
  return value.trim().replace(/^\/+|\/+$/g, "").slice(0, KNOWLEDGE_SLUG_MAX_LENGTH);
}

/** Detect draft/id/uuid slugs that should be upgraded to a readable public slug. */
export function isLegacyKnowledgeArticleSlug(slug: string, articleId: string) {
  const normalized = normalizeSlug(slug).toLowerCase();
  const id = articleId.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === id) return true;
  if (normalized === `draft-${id}`) return true;
  return KNOWLEDGE_UUID_SLUG_RE.test(normalized);
}

export function suggestKnowledgePublicSlug(input: {
  title: string;
  categorySlug?: string;
  tags?: string[];
}) {
  const fromTitle = buildKnowledgeSlugCandidate(input.title);
  if (
    fromTitle &&
    fromTitle !== "article" &&
    !fromTitle.startsWith("article-") &&
    fromTitle.length >= 12 &&
    validateKnowledgeSlug(fromTitle).ok
  ) {
    return fromTitle;
  }

  const yearMatch = input.title.match(/\b(20\d{2})\b/);
  const year = yearMatch?.[1];
  const category = input.categorySlug?.trim();

  if (category && validateKnowledgeSlug(category).ok) {
    if (year) {
      return normalizeSlug(`${category}-guide-${year}`);
    }
    const suffix =
      fromTitle && fromTitle !== "article" && !fromTitle.startsWith("article-") ? fromTitle : "guide";
    return normalizeSlug(`${category}-${suffix}`);
  }

  const englishTag = input.tags?.find((tag) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(tag.trim()));
  if (englishTag && year) {
    return normalizeSlug(`${englishTag.toLowerCase()}-${year}`);
  }

  return fromTitle;
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
  categorySlug?: string;
  tags?: string[];
}) {
  const base = suggestKnowledgePublicSlug({
    title: input.title,
    categorySlug: input.categorySlug,
    tags: input.tags
  });
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
    categorySlug?: string;
    tags?: string[];
  }
): Promise<string> {
  const existingSlug = input.existingSlug?.trim().replace(/^\/+|\/+$/g, "") ?? "";
  const legacySlug = isLegacyKnowledgeArticleSlug(existingSlug, articleId);

  if (input.wasPublished && existingSlug && !legacySlug) {
    return existingSlug;
  }

  const draftSlug = articleId.replace(/^\/+|\/+$/g, "");
  if (!input.publishing && !(input.wasPublished && legacySlug)) {
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
    excludeArticleId: articleId,
    categorySlug: input.categorySlug,
    tags: input.tags
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

/** Upgrade a published article off draft/id/uuid slugs; no-op when already readable. */
export async function upgradeLegacyKnowledgeArticleSlug(input: {
  articleId: string;
  title: string;
  existingSlug: string;
  categorySlug?: string;
  tags?: string[];
  preferredSlug?: string;
}) {
  if (!isLegacyKnowledgeArticleSlug(input.existingSlug, input.articleId)) {
    return input.existingSlug;
  }

  return commitArticleSlug(input.articleId, {
    title: input.title,
    publishing: false,
    wasPublished: true,
    existingSlug: input.existingSlug,
    preferredSlug: input.preferredSlug,
    categorySlug: input.categorySlug,
    tags: input.tags
  });
}
