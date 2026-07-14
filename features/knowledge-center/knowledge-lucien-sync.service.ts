import "server-only";

import type { KnowledgeTranslationDto } from "@/features/knowledge-center/knowledge-center.types";
import {
  archiveKnowledgeTranslationLucienIndex,
  syncKnowledgeTranslationToLucien
} from "@/features/knowledge-center/knowledge-lucien-sync.core";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

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

  async removeTranslationIndex(slug: string, languageCode: string) {
    if (!this.isAvailable()) return;
    await archiveKnowledgeTranslationLucienIndex(slug, languageCode);
  }
}

export const knowledgeLucienSyncService = new KnowledgeLucienSyncService();
