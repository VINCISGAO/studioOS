import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export class AdminWithdrawalRepository {
  async listPendingRequests(limit = 100) {
    if (!hasDatabaseUrl()) return [];

    const requests = await prisma.transaction.findMany({
      where: { type: "WITHDRAW_REQUEST" },
      orderBy: { createdAt: "desc" },
      take: limit * 3,
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                paymentMethods: { orderBy: { isDefault: "desc" }, take: 3 }
              }
            }
          }
        }
      }
    });

    const pending = [];
    for (const req of requests) {
      const success = await prisma.transaction.findFirst({
        where: {
          walletId: req.walletId,
          type: { in: ["WITHDRAW_SUCCESS", "WITHDRAW_FAILED"] },
          description: { contains: req.id }
        }
      });
      if (!success) pending.push(req);
      if (pending.length >= limit) break;
    }

    return pending;
  }

  async countPendingRequests(maxScan = 500) {
    if (!hasDatabaseUrl()) return 0;

    const requests = await prisma.transaction.findMany({
      where: { type: "WITHDRAW_REQUEST" },
      orderBy: { createdAt: "desc" },
      take: maxScan,
      select: { id: true, walletId: true }
    });

    let count = 0;
    for (const req of requests) {
      const resolved = await prisma.transaction.findFirst({
        where: {
          walletId: req.walletId,
          type: { in: ["WITHDRAW_SUCCESS", "WITHDRAW_FAILED"] },
          description: { contains: req.id }
        },
        select: { id: true }
      });
      if (!resolved) count++;
    }
    return count;
  }
}

export const adminWithdrawalRepository = new AdminWithdrawalRepository();
