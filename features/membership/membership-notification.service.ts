import { notificationService } from "@/features/notification/notification.service";
import { resolveNotificationLocale } from "@/features/notification/notification-locale";

/**
 * Email / in-app hooks for membership lifecycle.
 */
export class MembershipNotificationService {
  private async notifyUser(
    creatorId: string,
    template: string,
    metadata: Record<string, string | number>,
    priority: "NORMAL" | "HIGH" = "NORMAL"
  ) {
    try {
      await notificationService.notify({
        userId: creatorId,
        title: template,
        content: template,
        template,
        metadata,
        priority,
        email: true
      });
    } catch (error) {
      console.error("[membership-notification]", error);
    }
  }

  async notifyMembershipActivated(creatorId: string, expiresAt: Date) {
    await this.notifyUser(creatorId, "membership.activated", {
      expiresAt: expiresAt.toISOString().slice(0, 10)
    });
  }

  async notifyMembershipExpired(creatorId: string) {
    await this.notifyUser(creatorId, "membership.expired", {}, "HIGH");
  }

  async notifyMembershipExpiringSoon(
    creatorId: string,
    window: "30_days" | "7_days" | "1_day",
    expiresAt: Date
  ) {
    const locale = await resolveNotificationLocale(creatorId);
    const labels = {
      "30_days": locale === "zh" ? "30 天" : "30 days",
      "7_days": locale === "zh" ? "7 天" : "7 days",
      "1_day": locale === "zh" ? "1 天" : "1 day"
    };
    await this.notifyUser(creatorId, "membership.expiring_soon", {
      window: labels[window],
      expiresAt: expiresAt.toISOString().slice(0, 10)
    });
  }

  async notifyUpgradeEligible(creatorId: string, threshold: number) {
    await this.notifyUser(creatorId, "membership.upgrade_eligible", { threshold });
  }
}

export const membershipNotificationService = new MembershipNotificationService();
