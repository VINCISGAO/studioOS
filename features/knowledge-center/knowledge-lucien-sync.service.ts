import "server-only";

import type { KnowledgeTranslationDto } from "@/features/knowledge-center/knowledge-center.types";
import {
  archiveKnowledgeTranslationLucienIndex,
  syncKnowledgeTranslationToLucien
} from "@/features/knowledge-center/knowledge-lucien-sync.core";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { logger } from "@/lib/core/logger";

export class KnowledgeLucienSyncService {
  isAvailable() {
    return hasDatabaseUrl();
  }

  async syncTranslation(input: {
    slug: string;
    translation: KnowledgeTranslationDto;
    categoryName?: string | null;
  }) {
    if (!this.isAvailable()) return { synced: 0 };
    return syncKnowledgeTranslationToLucien(input);
  }

  async syncPublishedArticle(input: {
    slug: string;
    translations: KnowledgeTranslationDto[];
    categoryName?: string | null;
  }) {
    if (!this.isAvailable()) return { synced: 0 };

    let synced = 0;
    for (const translation of input.translations) {
      if (translation.status !== "PUBLISHED") continue;
      if (!translation.lucien?.lucien_learning) continue;
      try {
        const result = await this.syncTranslation({
          slug: input.slug,
          translation,
          categoryName: input.categoryName
        });
        synced += result.synced;
      } catch (error) {
        logger.warn("knowledge.publish.lucien_sync_failed", {
          service: "KnowledgeLucienSyncService",
          slug: input.slug,
          languageCode: translation.language_code,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return { synced };
  }

  async removeTranslationIndex(slug: string, languageCode: string) {
    if (!this.isAvailable()) return;
    await archiveKnowledgeTranslationLucienIndex(slug, languageCode);
  }
}

export const knowledgeLucienSyncService = new KnowledgeLucienSyncService();
