import { membershipRepository } from "@/features/membership/membership.repository";
import { membershipService } from "@/features/membership/membership.service";
import { membershipNotificationService } from "@/features/membership/membership-notification.service";
import { appError } from "@/lib/core/errors";

export class MembershipExpirationService {
  /** Run daily — downgrade expired verified memberships. */
  async processExpirations(now = new Date()) {
    const expired = await membershipRepository.expireMembershipsBefore(now);
    const results: { membershipId: string; creatorId: string }[] = [];

    for (const membership of expired) {
      await membershipRepository.updateMembership(membership.id, { status: "EXPIRED" });
      await membershipRepository.appendHistory({
        creator: { connect: { id: membership.creatorId } },
        plan: { connect: { id: membership.planId } },
        membershipId: membership.id,
        action: "EXPIRED",
        note: "Automatic downgrade after membership expiration"
      });
      await membershipNotificationService.notifyMembershipExpired(membership.creatorId);
      results.push({ membershipId: membership.id, creatorId: membership.creatorId });
    }

    return { processed: results.length, results };
  }

  /** Send reminders at 30 / 7 / 1 days before expiration. */
  async processExpirationReminders(now = new Date()) {
    const windows = [
      { days: 30, label: "30_days" as const },
      { days: 7, label: "7_days" as const },
      { days: 1, label: "1_day" as const }
    ];

    let sent = 0;
    for (const window of windows) {
      const start = new Date(now);
      start.setDate(start.getDate() + window.days);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const memberships = await membershipRepository.findActiveVerifiedMembershipsExpiringBetween(
        start,
        end
      );
      for (const membership of memberships) {
        if (!membership.expiresAt) continue;
        await membershipNotificationService.notifyMembershipExpiringSoon(
          membership.creatorId,
          window.label,
          membership.expiresAt
        );
        sent += 1;
      }
    }

    return { sent };
  }
}

export class MembershipStripeService {
  /** Prepare Stripe checkout session metadata — full redirect UI comes later. */
  async createUpgradeCheckoutSession(creatorId: string, successUrl: string, cancelUrl: string) {
    const verifiedPlan = await membershipService.requireVerifiedPlan();
    if (verifiedPlan.annualFee <= 0) {
      throw appError("VALIDATION_ERROR", "Verified plan has no annual fee configured");
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      throw appError("SYSTEM_ERROR", "Stripe not configured");
    }
    const { getStripe } = await import("@/lib/stripe");
    const stripe = getStripe();

    const lineItems = verifiedPlan.stripePriceId
      ? [{ price: verifiedPlan.stripePriceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: "usd",
              product_data: { name: verifiedPlan.name },
              unit_amount: Math.round(verifiedPlan.annualFee * 100)
            },
            quantity: 1
          }
        ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: lineItems,
      metadata: {
        type: "creator_membership_upgrade",
        creator_id: creatorId,
        plan_id: verifiedPlan.id,
        plan_slug: verifiedPlan.slug
      }
    });

    return { sessionId: session.id, url: session.url };
  }

  async activateFromStripePayment(input: {
    creatorId: string;
    planId: string;
    paymentId: string;
    stripeSessionId: string;
    amountPaid: number;
    currency?: string;
  }) {
    const existing = await membershipRepository.findMembershipByStripeSession(input.stripeSessionId);
    if (existing) {
      return existing;
    }

    const plan = await membershipRepository.getPlanBySlug("verified-creator");
    if (!plan || plan.id !== input.planId) {
      throw appError("VALIDATION_ERROR", "Invalid verified plan");
    }

    const startedAt = new Date();
    const expiresAt = new Date(startedAt);
    expiresAt.setDate(expiresAt.getDate() + plan.membershipDurationDays);

    const membership = await membershipRepository.createMembership({
      creator: { connect: { id: input.creatorId } },
      plan: { connect: { id: plan.id } },
      status: "ACTIVE",
      paymentProvider: "STRIPE",
      startedAt,
      expiresAt,
      paymentId: input.paymentId,
      stripeSessionId: input.stripeSessionId,
      amountPaid: input.amountPaid,
      currency: input.currency ?? "USD"
    });

    await membershipRepository.appendHistory({
      creator: { connect: { id: input.creatorId } },
      plan: { connect: { id: plan.id } },
      membershipId: membership.id,
      action: "ACTIVATED",
      note: "Stripe membership payment"
    });

    await membershipNotificationService.notifyMembershipActivated(input.creatorId, expiresAt);
    return membership;
  }
}

export const membershipExpirationService = new MembershipExpirationService();
export const membershipStripeService = new MembershipStripeService();
