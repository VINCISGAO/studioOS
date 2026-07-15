import type { Prisma } from "@prisma/client";
import { AI_ADVERTISING_CLUSTER_SLUGS } from "@/lib/knowledge/knowledge-ai-advertising-cluster";

/** Dev/demo articles — never shown on the public knowledge center. */
export const KNOWLEDGE_DEMO_ARTICLE_SLUGS: readonly string[] = AI_ADVERTISING_CLUSTER_SLUGS;

export function isKnowledgeDemoArticleSlug(slug: string): boolean {
  return (KNOWLEDGE_DEMO_ARTICLE_SLUGS as readonly string[]).includes(slug);
}

export function knowledgePublicArticleWhere(
  base: Prisma.KnowledgeArticleWhereInput = {}
): Prisma.KnowledgeArticleWhereInput {
  const explicitSlug = typeof base.slug === "string" ? base.slug : null;

  if (explicitSlug && isKnowledgeDemoArticleSlug(explicitSlug)) {
    return { id: { equals: "__knowledge_demo_blocked__" }, status: "PUBLISHED" };
  }

  const { slug: _slug, ...rest } = base;
  return {
    ...rest,
    status: "PUBLISHED",
    slug: explicitSlug ?? { notIn: [...KNOWLEDGE_DEMO_ARTICLE_SLUGS] }
  };
}
