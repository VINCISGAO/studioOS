import { notificationService } from "@/features/notification/notification.service";

/**
 * Email / in-app hooks for membership lifecycle.
 * Uses existing notification service — templates can be customized later.
 */
export class MembershipNotificationService {
  private async notifyUser(creatorId: string, title: string, body: string, priority: "NORMAL" | "HIGH" = "NORMAL") {
    try {
      await notificationService.notify({
        userId: creatorId,
        title,
        content: body,
        priority,
        email: true
      });
    } catch (error) {
      console.error("[membership-notification]", error);
    }
  }

  async notifyMembershipActivated(creatorId: string, expiresAt: Date) {
    await this.notifyUser(
      creatorId,
      "Verified Creator activated",
      `Your Verified Creator membership is active until ${expiresAt.toISOString().slice(0, 10)}.`
    );
  }

  async notifyMembershipExpired(creatorId: string) {
    await this.notifyUser(
      creatorId,
      "Verified Creator expired",
      "Your Verified Creator membership has expired. You are now on the Default Creator plan.",
      "HIGH"
    );
  }

  async notifyMembershipExpiringSoon(
    creatorId: string,
    window: "30_days" | "7_days" | "1_day",
    expiresAt: Date
  ) {
    const labels = {
      "30_days": "30 days",
      "7_days": "7 days",
      "1_day": "1 day"
    };
    await this.notifyUser(
      creatorId,
      "Verified Creator renewal reminder",
      `Your Verified Creator membership expires in ${labels[window]} (${expiresAt.toISOString().slice(0, 10)}). Renew to keep lower commission and verified benefits.`
    );
  }

  async notifyUpgradeEligible(creatorId: string, threshold: number) {
    await this.notifyUser(
      creatorId,
      "Upgrade to Verified Creator",
      `You've reached $${threshold} in settled revenue. Upgrade to Verified Creator for a lower commission rate and priority benefits.`
    );
  }
}

export const membershipNotificationService = new MembershipNotificationService();
