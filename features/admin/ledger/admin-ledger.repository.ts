import type { LedgerEntryType, Prisma } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export type AdminLedgerFilters = {
  userId?: string;
  campaignId?: string;
  entryType?: string;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

export class AdminLedgerRepository {
  async list(filters: AdminLedgerFilters) {
    if (!hasDatabaseUrl()) return { rows: [], total: 0 };

    const where: Prisma.LedgerEntryWhereInput = {};

    if (filters.campaignId) where.campaignId = filters.campaignId;
    if (filters.entryType) where.entryType = filters.entryType as LedgerEntryType;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { description: { contains: q, mode: "insensitive" } },
        { referenceId: { contains: q, mode: "insensitive" } }
      ];
    }
    if (filters.userId) {
      where.walletAccount = { userId: filters.userId };
    }

    const [rows, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: filters.limit ?? 100,
        skip: filters.offset ?? 0,
        include: {
          walletAccount: { select: { userId: true, user: { select: { email: true } } } },
          campaign: { select: { id: true, title: true } }
        }
      }),
      prisma.ledgerEntry.count({ where })
    ]);

    return { rows, total };
  }
}

export const adminLedgerRepository = new AdminLedgerRepository();
