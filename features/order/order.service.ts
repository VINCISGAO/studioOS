import { Prisma, type OrderStatus, type WalletAssetCode } from "@prisma/client";
import { prisma } from "@/lib/core/database/prisma";
import { orderRepository, type CreateOrderInput } from "@/features/order/order.repository";

export class OrderService {
  async createOrder(input: CreateOrderInput) {
    if (!input.serviceProject.trim()) {
      throw new Error("Service project is required");
    }
    return orderRepository.create(input);
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    if (status !== "COMPLETED") {
      return orderRepository.updateStatus(orderId, status);
    }
    return this.completeOrder(orderId);
  }

  private async completeOrder(orderId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({ where: { id: orderId } });
      if (!existing) {
        throw new Error("Order not found");
      }
      if (existing.status === "COMPLETED") {
        return existing;
      }

      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "COMPLETED",
          completedAt: new Date()
        }
      });

      const assetCode = order.currency as WalletAssetCode;
      const amount = new Prisma.Decimal(order.creatorIncome);
      if (amount.lte(0)) {
        return order;
      }

      const walletAccount = await tx.walletAccount.upsert({
        where: { userId: order.creatorId },
        update: {},
        create: { userId: order.creatorId }
      });

      const updatedAsset = await tx.walletAsset.upsert({
        where: {
          walletAccountId_assetCode: {
            walletAccountId: walletAccount.id,
            assetCode
          }
        },
        update: {
          availableBalance: { increment: amount }
        },
        create: {
          walletAccountId: walletAccount.id,
          assetCode,
          availableBalance: amount,
          pendingBalance: 0,
          frozenBalance: 0
        }
      });

      await tx.ledgerEntry.create({
        data: {
          walletAccountId: walletAccount.id,
          assetCode,
          entryType: "SETTLEMENT",
          direction: "CREDIT",
          amount,
          availableAfter: updatedAsset.availableBalance,
          pendingAfter: updatedAsset.pendingBalance,
          frozenAfter: updatedAsset.frozenBalance,
          campaignId: order.campaignId,
          orderId: order.id,
          referenceType: "Order",
          referenceId: order.id,
          description: `Order ${order.id} completed`
        }
      });

      await tx.creatorEarnings.upsert({
        where: { creatorId: order.creatorId },
        update: {
          totalSettledRevenue: { increment: order.orderAmount },
          totalCreatorPayout: { increment: amount }
        },
        create: {
          creatorId: order.creatorId,
          totalSettledRevenue: order.orderAmount,
          totalPendingRevenue: 0,
          totalWithdrawn: 0,
          totalCreatorPayout: amount
        }
      });

      return order;
    });
  }
}

export const orderService = new OrderService();
