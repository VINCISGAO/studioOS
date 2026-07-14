import "server-only";

import type { Prisma } from "@prisma/client";
import { asInputJson } from "@/lib/core/prisma-json";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { buildKnowledgeLucienRows } from "@/features/knowledge-center/knowledge-lucien.mapper";
import { buildKnowledgeLucienSourceKey } from "@/features/knowledge-center/knowledge-center.constants";
import type { KnowledgeTranslationDto } from "@/features/knowledge-center/knowledge-center.types";

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

    const rows = buildKnowledgeLucienRows(input);
    if (!rows.length) {
      await prisma.knowledgeLucien.updateMany({
        where: { translationId: input.translation.id },
        data: { lucienIndexed: false, lucienSyncedAt: null }
      });
      return { synced: 0 };
    }

    let synced = 0;
    for (const row of rows) {
      const metadataJson = asInputJson(row.metadataJson) as Prisma.InputJsonValue;
      await prisma.aiKnowledgeQa.upsert({
        where: { sourceKey: row.sourceKey },
        create: {
          sourceKey: row.sourceKey,
          languageCode: row.languageCode,
          module: row.module,
          question: row.question,
          answer: row.answer,
          searchText: row.searchText,
          knowledgeType: row.knowledgeType,
          visibility: row.visibility,
          sourceType: row.sourceType,
          version: row.version,
          verifiedAt: row.verifiedAt,
          metadataJson,
          status: "ACTIVE"
        },
        update: {
          languageCode: row.languageCode,
          module: row.module,
          question: row.question,
          answer: row.answer,
          searchText: row.searchText,
          knowledgeType: row.knowledgeType,
          visibility: row.visibility,
          sourceType: row.sourceType,
          version: row.version,
          verifiedAt: row.verifiedAt,
          metadataJson,
          status: "ACTIVE"
        }
      });
      synced += 1;
    }

    const sourceKey = buildKnowledgeLucienSourceKey(input.slug, input.translation.language_code);
    await prisma.knowledgeLucien.update({
      where: { translationId: input.translation.id },
      data: {
        lucienIndexed: true,
        lucienSyncedAt: new Date(),
        lucienSourceKey: sourceKey
      }
    });

    return { synced };
  }

  async removeTranslationIndex(slug: string, languageCode: string) {
    if (!this.isAvailable()) return;
    const sourceKey = buildKnowledgeLucienSourceKey(slug, languageCode);
    await prisma.aiKnowledgeQa.updateMany({
      where: { sourceKey },
      data: { status: "ARCHIVED" }
    });
  }
}

export const knowledgeLucienSyncService = new KnowledgeLucienSyncService();
