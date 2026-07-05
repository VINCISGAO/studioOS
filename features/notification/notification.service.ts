import { notificationRepository } from "@/features/notification/notification.repository";
import { serializeNotification } from "@/features/notification/notification.serializer";
import {
  buildSimpleNotificationEmail,
  sendNotificationEmail
} from "@/features/notification/notification-email.service";
import type { AuthUser } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { getAppBaseUrl } from "@/lib/app-url";

export class NotificationService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  async listForUser(user: AuthUser, limit = 30) {
    this.assertDb();
    const items = await notificationRepository.listForUser(user.id, limit);
    const unreadCount = await notificationRepository.countUnread(user.id);
    return {
      items: items.map(serializeNotification),
      unreadCount
    };
  }

  async markRead(notificationId: string, user: AuthUser) {
    this.assertDb();
    const updated = await notificationRepository.markRead(notificationId, user.id);
    if (!updated.count) {
      throw appError("NOT_FOUND", "Notification not found");
    }
    return { ok: true };
  }

  async markAllRead(user: AuthUser) {
    this.assertDb();
    const updated = await notificationRepository.markAllRead(user.id);
    return { updated: updated.count };
  }

  async notify(input: {
    userId: string;
    campaignId?: string;
    title: string;
    content: string;
    actionUrl?: string;
    email?: boolean;
    template?: string;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  }) {
    this.assertDb();

    const inApp = await notificationRepository.create({
      userId: input.userId,
      campaignId: input.campaignId,
      title: input.title,
      content: input.content,
      actionUrl: input.actionUrl,
      priority: input.priority
    });

    void import("@/features/communication/platform-localization.service")
      .then(({ platformLocalizationService }) =>
        platformLocalizationService.localizeNotification({
          notificationId: inApp.id,
          userId: input.userId,
          title: input.title,
          content: input.content,
          campaignId: input.campaignId
        })
      )
      .catch(() => undefined);

    if (input.email !== false) {
      const user = await prisma.user.findUnique({ where: { id: input.userId } });
      if (user?.email) {
        const emailResult = await sendNotificationEmail({
          userId: input.userId,
          toEmail: user.email,
          subject: input.title,
          template: input.template ?? "notification.generic",
          html: buildSimpleNotificationEmail({
            headline: input.title,
            body: input.content,
            actionUrl: input.actionUrl,
            actionLabel: "View in VINCIS"
          })
        });
        if (emailResult.ok && !emailResult.skipped) {
          await notificationRepository.markSent(inApp.id);
        }
      }
    }

    return serializeNotification(inApp);
  }

  async pollSince(user: AuthUser, sinceIso: string) {
    this.assertDb();
    const since = new Date(sinceIso);
    if (Number.isNaN(since.getTime())) {
      throw appError("VALIDATION_ERROR", "Invalid since timestamp");
    }
    const items = await notificationRepository.listSince(user.id, since);
    return items.map(serializeNotification);
  }

  campaignActionUrl(campaignId: string, path = "") {
    return `${getAppBaseUrl()}/brand/projects/${campaignId}${path}`;
  }
}

export const notificationService = new NotificationService();
