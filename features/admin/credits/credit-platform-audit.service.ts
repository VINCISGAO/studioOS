import type { CreditPlatformAuditEntity, Prisma } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";

export const creditPlatformAuditService = {
  async write(input: {
    actorUserId?: string | null;
    action: string;
    entityType: CreditPlatformAuditEntity;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    if (!hasDatabaseUrl()) return null;
    return prisma.creditPlatformAuditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: asInputJson(input.metadata)
      }
    });
  },

  async list(input?: {
    entityType?: CreditPlatformAuditEntity;
    entityId?: string;
    limit?: number;
  }) {
    if (!hasDatabaseUrl()) return [];
    const where: Prisma.CreditPlatformAuditLogWhereInput = {};
    if (input?.entityType) where.entityType = input.entityType;
    if (input?.entityId) where.entityId = input.entityId;
    return prisma.creditPlatformAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: input?.limit ?? 50
    });
  }
};
