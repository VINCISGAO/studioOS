import { paymentService } from "@/features/payment/payment.service";
import type { AuthUser } from "@/features/auth/permission.service";

/** @deprecated Use paymentService — kept for API route compatibility. */
export class EscrowService {
  getEscrow(campaignId: string, user: AuthUser) {
    return paymentService.getEscrow(campaignId, user);
  }

  startCheckout(campaignId: string, user: AuthUser & { email?: string }) {
    return paymentService.startCheckout(campaignId, user);
  }

  completePayment(input: {
    campaignId: string;
    stripePaymentId?: string;
    stripeSessionId?: string;
    actor?: AuthUser;
  }) {
    return paymentService.completePayment(input);
  }

  demoPay(campaignId: string, user: AuthUser) {
    return paymentService.demoPay(campaignId, user);
  }
}

export const escrowService = new EscrowService();
