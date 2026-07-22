import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";
import type { PlatformCompanyCredentialsKnowledgeRow } from "@/features/ai-copilot/platform-company-credentials.mapper";

export class PlatformCompanyCredentialsRepository {
  async upsertRow(row: PlatformCompanyCredentialsKnowledgeRow) {
    const metadataJson = asInputJson(row.metadataJson) as Prisma.InputJsonValue;

    return prisma.aiKnowledgeQa.upsert({
      where: { sourceKey: row.sourceKey },
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
        status: "ACTIVE",
        metadataJson
      },
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
        status: "ACTIVE",
        metadataJson
      }
    });
  }

  async upsertMany(rows: PlatformCompanyCredentialsKnowledgeRow[]) {
    for (const row of rows) {
      await this.upsertRow(row);
    }
    return rows.length;
  }
}

export const platformCompanyCredentialsRepository = new PlatformCompanyCredentialsRepository();
