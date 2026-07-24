import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";

export type CanvasPromptKnowledgeRow = {
  sourceKey: string;
  campaignId?: string | null;
  languageCode: string;
  module: string;
  question: string;
  answer: string;
  searchText: string;
  knowledgeType: "USER_PROJECT_DATA";
  visibility: "authenticated";
  sourceType: "canvas_prompt";
  version: string;
  verifiedAt: Date;
  metadataJson: Record<string, unknown>;
};

export class CanvasPromptKnowledgeRepository {
  async upsertRow(row: CanvasPromptKnowledgeRow) {
    const metadataJson = asInputJson(row.metadataJson) as Prisma.InputJsonValue;

    return prisma.aiKnowledgeQa.upsert({
      where: { sourceKey: row.sourceKey },
      update: {
        campaignId: row.campaignId ?? null,
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
        campaignId: row.campaignId ?? null,
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

  async listVideoExamples(input: { languageCode: string; query?: string; limit?: number }) {
    const limit = Math.min(Math.max(input.limit ?? 3, 1), 8);
    const query = input.query?.trim();

    return prisma.aiKnowledgeQa.findMany({
      where: {
        languageCode: input.languageCode,
        status: "ACTIVE",
        sourceType: "canvas_prompt",
        knowledgeType: "USER_PROJECT_DATA",
        visibility: "authenticated",
        ...(query
          ? {
              OR: [
                { searchText: { contains: query, mode: "insensitive" } },
                { answer: { contains: query, mode: "insensitive" } }
              ]
            }
          : {})
      },
      orderBy: [{ helpfulCount: "desc" }, { usageCount: "desc" }, { updatedAt: "desc" }],
      take: limit,
      select: {
        id: true,
        answer: true,
        metadataJson: true
      }
    });
  }
}

export const canvasPromptKnowledgeRepository = new CanvasPromptKnowledgeRepository();
