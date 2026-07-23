import { notificationRepository } from "@/features/notification/notification.repository";
import { serializeNotification } from "@/features/notification/notification.serializer";
import type { AuthUser } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { getAppBaseUrl } from "@/lib/app-url";
import { resolveNotificationCopy } from "@/features/notification/notification-copy";
import {
  notificationActionLabel,
  resolveNotificationLocale
} from "@/features/notification/notification-locale";
import { normalizeInternalActionHref } from "@/lib/studioos/internal-action-href";
import type { Locale } from "@/lib/i18n";
import type { NotificationCategory, Prisma } from "@prisma/client";

type NotifyInput = {
  userId: string;
  campaignId?: string;
  type?: string;
  category?: NotificationCategory;
  eventName?: string;
  metadata?: Prisma.InputJsonValue;
  title: string;
  content: string;
  actionUrl?: string;
  email?: boolean;
  template?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  locale?: Locale;
};

const categoryRules: Array<{ category: NotificationCategory; patterns: string[] }> = [
  { category: "SETTLEMENT", patterns: ["settlement", "payout", "release"] },
  { category: "PAYMENT", patterns: ["payment", "escrow", "checkout"] },
  { category: "MATCHING", patterns: ["matching", "match"] },
  { category: "INVITATION", patterns: ["invitation", "invite"] },
  { category: "COLLABORATION", patterns: ["selection", "selected", "collaboration", "production"] },
  { category: "DELIVERY", patterns: ["delivery", "upload", "version", "video", "master"] },
  { category: "REVISION", patterns: ["revision", "changes"] },
  { category: "REVIEW", patterns: ["review", "approved", "approve"] },
  { category: "ARBITRATION", patterns: ["arbitration", "dispute"] },
  { category: "MEMBERSHIP", patterns: ["membership", "certification"] },
  { category: "ATTRIBUTION", patterns: ["attribution", "performance"] },
  { category: "AI", patterns: ["ai", "creative", "direction"] }
];

function normalizeNotificationType(input: NotifyInput) {
  return (input.type ?? input.template ?? input.eventName ?? "system").trim() || "system";
}

function resolveNotificationCategory(input: NotifyInput): NotificationCategory {
  if (input.category) return input.category;

  const haystack = [
    input.type,
    input.template,
    input.eventName,
    input.title,
    input.content
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return categoryRules.find((rule) => rule.patterns.some((pattern) => haystack.includes(pattern)))?.category ?? "SYSTEM";
}

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

  async deleteMany(notificationIds: string[], user: AuthUser) {
    this.assertDb();
    if (!notificationIds.length) {
      return { deleted: 0 };
    }
    const deleted = await notificationRepository.deleteMany(notificationIds, user.id);
    return { deleted: deleted.count };
  }

  async notify(input: NotifyInput) {
    this.assertDb();
    const type = normalizeNotificationType(input);
    const category = resolveNotificationCategory(input);
    const locale = input.locale ?? (await resolveNotificationLocale(input.userId));
    const localized = resolveNotificationCopy({
      locale,
      template: input.template,
      type,
      title: input.title,
      content: input.content,
      metadata: input.metadata
    });
    const actionPath = normalizeInternalActionHref(input.actionUrl, locale, "");
    const actionUrl = actionPath || undefined;
    const emailActionUrl = actionUrl ? `${getAppBaseUrl()}${actionUrl}` : undefined;

    let inApp = await notificationRepository.create({
      userId: input.userId,
      campaignId: input.campaignId,
      type,
      category,
      eventName: input.eventName,
      metadataJson: input.metadata,
      title: localized.title,
      content: localized.content,
      actionUrl,
      priority: input.priority
    });

    if (input.email === false) {
      inApp = await notificationRepository.markSent(inApp.id);
    } else {
      const user = await prisma.user.findUnique({ where: { id: input.userId } });
      if (user?.email) {
        const { buildSimpleNotificationEmail, sendNotificationEmail } = await import(
          "@/features/notification/notification-email.service"
        );
        const email = await buildSimpleNotificationEmail({
          headline: localized.title,
          body: localized.content,
          actionUrl: emailActionUrl,
          actionLabel: notificationActionLabel(locale),
          template: input.template,
          metadata: input.metadata
        });
        const emailResult = await sendNotificationEmail({
          userId: input.userId,
          toEmail: user.email,
          subject: email.subject,
          template: input.template ?? email.template,
          html: email.html
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
