import type { Prisma } from "@prisma/client";
import { buildKnowledgeLucienSourceKey } from "@/features/knowledge-center/knowledge-center.constants";
import { toArticleDetailDto } from "@/features/knowledge-center/knowledge-center.mappers";
import { buildKnowledgeLucienRows } from "@/features/knowledge-center/knowledge-lucien.mapper";
import type { KnowledgeTranslationDto } from "@/features/knowledge-center/knowledge-center.types";
import { asInputJson } from "@/lib/core/prisma-json";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

const lucienArticleInclude = {
  category: true,
  tags: { include: { tag: true } },
  analytics: true,
  translations: {
    include: {
      seo: true,
      faqs: { orderBy: { sortOrder: "asc" as const } },
      lucien: true,
      schema: true
    }
  }
} satisfies Prisma.KnowledgeArticleInclude;

export async function syncKnowledgeTranslationToLucien(input: {
  slug: string;
  translation: KnowledgeTranslationDto;
  categoryName?: string | null;
}) {
  if (!hasDatabaseUrl()) return { synced: 0 };

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
    try {
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
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: string }).code)
          : null;
      if (code === "P2021" || code === "P2022") {
        return { synced: 0 };
      }
      throw error;
    }
  }

  const sourceKey = buildKnowledgeLucienSourceKey(input.slug, input.translation.language_code);
  await prisma.knowledgeLucien.upsert({
    where: { translationId: input.translation.id },
    create: {
      translationId: input.translation.id,
      lucienIndexed: true,
      lucienSyncedAt: new Date(),
      lucienSourceKey: sourceKey
    },
    update: {
      lucienIndexed: true,
      lucienSyncedAt: new Date(),
      lucienSourceKey: sourceKey
    }
  });

  return { synced };
}

export async function archiveKnowledgeTranslationLucienIndex(slug: string, languageCode: string) {
  if (!hasDatabaseUrl()) return;
  const sourceKey = buildKnowledgeLucienSourceKey(slug, languageCode);
  await prisma.aiKnowledgeQa.updateMany({
    where: {
      OR: [{ sourceKey }, { sourceKey: { startsWith: `${sourceKey}_faq_` } }]
    },
    data: { status: "ARCHIVED" }
  });
}

export async function syncAllPublishedKnowledgeArticlesToLucien() {
  if (!hasDatabaseUrl()) return { synced: 0, articles: 0 };

  const rows = await prisma.knowledgeArticle.findMany({
    where: { deletedAt: null, status: "PUBLISHED" },
    include: lucienArticleInclude,
    orderBy: { updatedAt: "desc" }
  });

  let synced = 0;
  for (const row of rows) {
    const detail = toArticleDetailDto(row);
    for (const translation of detail.translations) {
      if (translation.status !== "PUBLISHED") continue;
      if (!translation.lucien?.lucien_learning) continue;
      const result = await syncKnowledgeTranslationToLucien({
        slug: detail.slug,
        translation,
        categoryName: detail.category_name
      });
      synced += result.synced;
    }
  }

  return { synced, articles: rows.length };
}
