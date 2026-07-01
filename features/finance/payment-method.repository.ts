import type {
  PaymentMethod,
  PaymentMethodProvider,
  PaymentMethodStatus,
  PaymentMethodType,
  Prisma,
  WalletAssetCode
} from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export class PaymentMethodRepository {
  private assertDb() {
    if (!hasDatabaseUrl()) throw new Error("DATABASE_URL not configured");
  }

  async listByUserId(userId: string): Promise<PaymentMethod[]> {
    this.assertDb();
    return prisma.paymentMethod.findMany({
      where: { userId, status: { not: "DISABLED" } },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
    });
  }

  async findByIdForUser(id: string, userId: string) {
    this.assertDb();
    return prisma.paymentMethod.findFirst({
      where: { id, userId }
    });
  }

  async create(input: {
    userId: string;
    type: PaymentMethodType;
    provider: PaymentMethodProvider;
    accountName?: string | null;
    accountNumber?: string | null;
    accountEmail?: string | null;
    walletAddress?: string | null;
    network?: string | null;
    currency?: WalletAssetCode;
    isDefault?: boolean;
    status?: PaymentMethodStatus;
    metadata?: Record<string, unknown>;
  }) {
    this.assertDb();

    return prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.paymentMethod.updateMany({
          where: { userId: input.userId },
          data: { isDefault: false }
        });
      }

      const existing = await tx.paymentMethod.count({ where: { userId: input.userId } });
      const isDefault = input.isDefault ?? existing === 0;

      return tx.paymentMethod.create({
        data: {
          userId: input.userId,
          type: input.type,
          provider: input.provider,
          accountName: input.accountName ?? null,
          accountNumber: input.accountNumber ?? null,
          accountEmail: input.accountEmail ?? null,
          walletAddress: input.walletAddress ?? null,
          network: input.network ?? null,
          currency: input.currency ?? "USD",
          isDefault,
          status: input.status ?? "PENDING",
          metadataJson: input.metadata as Prisma.InputJsonValue | undefined
        }
      });
    });
  }

  async update(
    id: string,
    userId: string,
    data: Prisma.PaymentMethodUpdateInput & { isDefault?: boolean }
  ) {
    this.assertDb();

    return prisma.$transaction(async (tx) => {
      const existing = await tx.paymentMethod.findFirst({ where: { id, userId } });
      if (!existing) return null;

      if (data.isDefault) {
        await tx.paymentMethod.updateMany({
          where: { userId },
          data: { isDefault: false }
        });
      }

      return tx.paymentMethod.update({
        where: { id },
        data
      });
    });
  }

  async setDefault(id: string, userId: string) {
    this.assertDb();

    return prisma.$transaction(async (tx) => {
      const target = await tx.paymentMethod.findFirst({ where: { id, userId } });
      if (!target) return null;

      await tx.paymentMethod.updateMany({
        where: { userId },
        data: { isDefault: false }
      });

      return tx.paymentMethod.update({
        where: { id },
        data: { isDefault: true }
      });
    });
  }

  async disable(id: string, userId: string) {
    this.assertDb();
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) return null;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.paymentMethod.update({
        where: { id },
        data: { status: "DISABLED", isDefault: false }
      });

      if (existing.isDefault) {
        const next = await tx.paymentMethod.findFirst({
          where: { userId, status: { not: "DISABLED" }, id: { not: id } },
          orderBy: { createdAt: "desc" }
        });
        if (next) {
          await tx.paymentMethod.update({
            where: { id: next.id },
            data: { isDefault: true }
          });
        }
      }

      return updated;
    });
  }
}

export const paymentMethodRepository = new PaymentMethodRepository();
