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
  const { slug: explicitSlug, OR, ...rest } = base;

  if (OR) {
    return {
      ...rest,
      OR,
      status: "PUBLISHED"
    };
  }

  if (typeof explicitSlug === "string" && isKnowledgeDemoArticleSlug(explicitSlug)) {
    return { id: { equals: "__knowledge_demo_blocked__" }, status: "PUBLISHED" };
  }

  return {
    ...rest,
    status: "PUBLISHED",
    ...(typeof explicitSlug === "string"
      ? { slug: explicitSlug }
      : { slug: { notIn: [...KNOWLEDGE_DEMO_ARTICLE_SLUGS] } })
  };
}
