import "server-only";

import { cache } from "react";
import { after } from "next/server";
import { knowledgeCenterRepository } from "@/features/knowledge-center/knowledge-center.repository";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import type { PublicKnowledgeArticleDto } from "@/features/knowledge-center/knowledge-center.types";

/** Dedupes metadata + page fetches within the same request. */
export const getPublicKnowledgeArticleCached = cache(
  async (slug: string, languageCode: string): Promise<PublicKnowledgeArticleDto | null> =>
    knowledgeCenterService.getPublicArticle(slug, languageCode, { recordView: false })
);

export function scheduleKnowledgeArticleViewIncrement(articleId: string) {
  after(() => {
    void knowledgeCenterRepository.incrementView(articleId);
  });
}
