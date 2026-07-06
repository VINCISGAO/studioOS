import type { Notification } from "@prisma/client";

export function serializeNotification(notification: Notification) {
  return {
    id: notification.id,
    userId: notification.userId,
    campaignId: notification.campaignId,
    type: notification.type,
    category: notification.category,
    eventName: notification.eventName,
    metadata: notification.metadataJson,
    channel: notification.channel,
    priority: notification.priority,
    title: notification.title,
    content: notification.content,
    actionUrl: notification.actionUrl,
    isRead: notification.isRead,
    isSent: notification.isSent,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt?.toISOString() ?? null
  };
}
