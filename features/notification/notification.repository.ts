import type {
  Notification,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
  Prisma
} from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export class NotificationRepository {
  async create(input: {
    userId: string;
    campaignId?: string;
    type?: string;
    category?: NotificationCategory;
    eventName?: string;
    metadataJson?: Prisma.InputJsonValue;
    channel?: NotificationChannel;
    priority?: NotificationPriority;
    title: string;
    content: string;
    actionUrl?: string;
  }): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        campaignId: input.campaignId,
        type: input.type ?? "system",
        category: input.category ?? "SYSTEM",
        eventName: input.eventName,
        metadataJson: input.metadataJson,
        channel: input.channel ?? "IN_APP",
        priority: input.priority ?? "NORMAL",
        title: input.title,
        content: input.content,
        actionUrl: input.actionUrl
      }
    });
  }

  async listForUser(userId: string, limit = 30) {
    if (!hasDatabaseUrl()) return [];
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  }

  async countUnread(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  async findById(id: string) {
    return prisma.notification.findUnique({ where: { id } });
  }

  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });
  }

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });
  }

  async markSent(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isSent: true }
    });
  }

  async listSince(userId: string, since: Date) {
    return prisma.notification.findMany({
      where: { userId, createdAt: { gt: since } },
      orderBy: { createdAt: "asc" },
      take: 20
    });
  }
}

export const notificationRepository = new NotificationRepository();
