import type { AiPreference, MemoryFact, MemoryOwnerType, RelationshipDna } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export class MemoryRepository {
  async upsertFact(input: {
    ownerType: MemoryOwnerType;
    brandId?: string | null;
    creatorId?: string | null;
    campaignId?: string | null;
    category: string;
    factKey: string;
    factValue: string;
    confidence?: number;
    sourceType: string;
    sourceRefId?: string | null;
  }) {
    const brandId = input.brandId ?? null;
    const creatorId = input.creatorId ?? null;
    const campaignId = input.campaignId ?? null;

    const existing = await prisma.memoryFact.findFirst({
      where: {
        ownerType: input.ownerType,
        brandId,
        creatorId,
        campaignId,
        category: input.category,
        factKey: input.factKey
      }
    });

    if (existing) {
      return prisma.memoryFact.update({
        where: { id: existing.id },
        data: {
          factValue: input.factValue,
          confidence: input.confidence ?? existing.confidence,
          sourceType: input.sourceType,
          sourceRefId: input.sourceRefId ?? undefined,
          updatedAt: new Date()
        }
      });
    }

    return prisma.memoryFact.create({
      data: {
        ownerType: input.ownerType,
        brandId: brandId ?? undefined,
        creatorId: creatorId ?? undefined,
        campaignId: campaignId ?? undefined,
        category: input.category,
        factKey: input.factKey,
        factValue: input.factValue,
        confidence: input.confidence ?? 0.8,
        sourceType: input.sourceType,
        sourceRefId: input.sourceRefId ?? undefined
      }
    });
  }

  async listFacts(filter: {
    ownerType?: MemoryOwnerType;
    brandId?: string;
    creatorId?: string;
    campaignId?: string;
    limit?: number;
  }) {
    if (!hasDatabaseUrl()) return [];
    return prisma.memoryFact.findMany({
      where: {
        ...(filter.ownerType ? { ownerType: filter.ownerType } : {}),
        ...(filter.brandId ? { brandId: filter.brandId } : {}),
        ...(filter.creatorId ? { creatorId: filter.creatorId } : {}),
        ...(filter.campaignId ? { campaignId: filter.campaignId } : {})
      },
      orderBy: { updatedAt: "desc" },
      take: filter.limit ?? 100
    });
  }

  async getPreference(userId: string): Promise<AiPreference | null> {
    return prisma.aiPreference.findUnique({ where: { userId } });
  }

  async upsertPreference(userId: string, data: Partial<Omit<AiPreference, "userId" | "createdAt" | "updatedAt">>) {
    return prisma.aiPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data
    });
  }

  async getRelationship(brandId: string, creatorId: string): Promise<RelationshipDna | null> {
    return prisma.relationshipDna.findUnique({
      where: { brandId_creatorId: { brandId, creatorId } }
    });
  }

  async upsertRelationship(
    brandId: string,
    creatorId: string,
    data: Partial<Omit<RelationshipDna, "id" | "brandId" | "creatorId" | "createdAt" | "updatedAt">>
  ) {
    return prisma.relationshipDna.upsert({
      where: { brandId_creatorId: { brandId, creatorId } },
      create: { brandId, creatorId, ...data },
      update: data
    });
  }

  async listRelationshipsForBrand(brandId: string, limit = 20) {
    return prisma.relationshipDna.findMany({
      where: { brandId },
      orderBy: { priorityScore: "desc" },
      take: limit,
      include: {
        creator: { select: { id: true, fullName: true, email: true, creatorProfile: true } }
      }
    });
  }

  factsToRecord(facts: MemoryFact[]) {
    const record: Record<string, Record<string, string>> = {};
    for (const f of facts) {
      if (!record[f.category]) record[f.category] = {};
      record[f.category]![f.factKey] = f.factValue;
    }
    return record;
  }
}

export const memoryRepository = new MemoryRepository();
