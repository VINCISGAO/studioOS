import type { Prisma } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export class AdminWalletRepository {
  async listWallets(limit = 100, offset = 0, search?: string) {
    if (!hasDatabaseUrl()) return { rows: [], total: 0 };

    const and: Prisma.UserWhereInput[] = [
      { OR: [{ wallet: { isNot: null } }, { walletAccount: { isNot: null } }] }
    ];
    if (search?.trim()) {
      const q = search.trim();
      and.push({
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { fullName: { contains: q, mode: "insensitive" } }
        ]
      });
    }

    const where: Prisma.UserWhereInput = { AND: and };

    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          wallet: true,
          walletAccount: {
            include: { assets: true }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return { rows, total };
  }

  async findUserWallet(userId: string) {
    if (!hasDatabaseUrl()) return null;

    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        wallet: { include: { transactions: { orderBy: { createdAt: "desc" }, take: 30 } } },
        walletAccount: { include: { assets: true, entries: { orderBy: { createdAt: "desc" }, take: 30 } } }
      }
    });
  }
}

export const adminWalletRepository = new AdminWalletRepository();
