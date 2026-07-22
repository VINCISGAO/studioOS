import { getAppBaseUrl } from "@/lib/app-url";
import { isSafeInternalPostLoginPath } from "@/lib/auth/post-login-redirect";
import { authService } from "@/features/auth/auth.service";
import { stripeUnifiedCheckoutService } from "@/features/payment/stripe-unified-checkout.service";
import { paidRevisionService } from "@/features/review/paid-revision.service";
import {
  attachDepositStripeSession,
  createDepositStripePayment
} from "@/lib/studioos/deposit-service";
import { CREATOR_DEPOSIT_USD } from "@/lib/studioos/deposit-copy";
import { isPaymentStubMode } from "@/lib/payment/payment-stub";
import { appError } from "@/lib/core/errors";
import type { Locale } from "@/lib/i18n";

function stripeReturnUrl(appUrl: string, path: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${appUrl}${path}${separator}session_id={CHECKOUT_SESSION_ID}`;
}

function sanitizeBrandCheckoutPath(path: string | undefined, fallback: string) {
  const candidate = path?.trim() || fallback;
  if (!isSafeInternalPostLoginPath(candidate) || !candidate.startsWith("/brand/")) {
    return fallback;
  }
  return candidate;
}

export class PlatformPaymentService {
  async createCreatorDepositCheckout(userId: string, locale: Locale) {
    if (isPaymentStubMode()) {
      throw appError("SYSTEM_ERROR", "Stripe checkout is not available in payment stub mode");
    }

    const user = await authService.getUserById(userId);
    if (!user || user.role !== "CREATOR") {
      throw appError("FORBIDDEN", "Creator account required");
    }

    const pending = await createDepositStripePayment(userId);
    if (!pending.ok) {
      throw appError("VALIDATION_ERROR", pending.error);
    }

    const appUrl = getAppBaseUrl();
    const amountMinor = Math.round(pending.amountUsd * 100);
    const session = await stripeUnifiedCheckoutService.createSession({
      type: "creator_deposit",
      customerEmail: user.email,
      clientReferenceId: pending.payment.id,
      currency: "USD",
      amountMinor,
      productName: locale === "zh" ? "VINCIS 认证保证金" : "VINCIS certification deposit",
      productDescription:
        locale === "zh"
          ? "认证服务商一次性保证金"
          : "One-time professional deposit for certified provider status",
      metadata: {
        creator_id: userId,
        payment_id: pending.payment.id,
        amount_minor: String(amountMinor),
        currency: "USD"
      },
      successUrl: stripeReturnUrl(appUrl, "/studio/deposit?checkout=success"),
      cancelUrl: `${appUrl}/studio/deposit?checkout=cancelled`
    });

    if (!session.url) {
      throw appError("SYSTEM_ERROR", "Stripe checkout URL missing");
    }

    await attachDepositStripeSession({
      creatorId: userId,
      paymentId: pending.payment.id,
      stripeSessionId: session.id
    });

    return {
      mode: "stripe" as const,
      checkoutUrl: session.url,
      sessionId: session.id,
      amountUsd: pending.amountUsd ?? CREATOR_DEPOSIT_USD
    };
  }

  async createBrandWalletRechargeCheckout(input: {
    brandUserId: string;
    amountUsd: number;
    successPath?: string;
    cancelPath?: string;
  }) {
    if (isPaymentStubMode()) {
      throw appError("SYSTEM_ERROR", "Stripe checkout is not available in payment stub mode");
    }

    const user = await authService.getUserById(input.brandUserId);
    if (!user || user.role !== "BRAND") {
      throw appError("FORBIDDEN", "Brand account required");
    }

    const amountUsd = Math.round(input.amountUsd * 100) / 100;
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      throw appError("VALIDATION_ERROR", "Invalid recharge amount");
    }

    const appUrl = getAppBaseUrl();
    const amountMinor = Math.round(amountUsd * 100);
    const session = await stripeUnifiedCheckoutService.createSession({
      type: "brand_wallet_recharge",
      customerEmail: user.email,
      clientReferenceId: user.id,
      currency: "USD",
      amountMinor,
      productName: "VINCIS brand account top-up",
      productDescription: `Account recharge $${amountUsd.toFixed(2)}`,
      metadata: {
        user_id: user.id,
        amount_minor: String(amountMinor),
        currency: "USD"
      },
      successUrl: stripeReturnUrl(
        appUrl,
        sanitizeBrandCheckoutPath(input.successPath, "/brand/finance/account?checkout=success")
      ),
      cancelUrl: `${appUrl}${sanitizeBrandCheckoutPath(
        input.cancelPath,
        "/brand/finance/account?checkout=cancelled"
      )}`
    });

    if (!session.url) {
      throw appError("SYSTEM_ERROR", "Stripe checkout URL missing");
    }

    return {
      mode: "stripe" as const,
      checkoutUrl: session.url,
      sessionId: session.id,
      amountUsd
    };
  }

  async createPaidRevisionCheckout(input: {
    orderId: string;
    projectId: string | null;
    brandEmail: string;
    locale: Locale;
  }) {
    if (isPaymentStubMode()) {
      throw appError("SYSTEM_ERROR", "Stripe checkout is not available in payment stub mode");
    }

    const quote = await paidRevisionService.quotePaidRevisionCheckout(input);
    const appUrl = getAppBaseUrl();
    const session = await stripeUnifiedCheckoutService.createSession({
      type: "paid_revision_addon",
      customerEmail: input.brandEmail,
      clientReferenceId: input.orderId,
      currency: quote.currency,
      amountMinor: quote.amountMinor,
      productName:
        input.locale === "zh" ? "审片加购 — 解锁第 4-5 轮修订" : "Review add-on — unlock rounds 4-5",
      productDescription: quote.description,
      metadata: {
        order_id: input.orderId,
        project_id: input.projectId ?? "",
        brand_email: input.brandEmail.toLowerCase(),
        locale: input.locale,
        amount_minor: String(quote.amountMinor),
        currency: quote.currency
      },
      successUrl: stripeReturnUrl(
        appUrl,
        `/brand/projects/${input.projectId ?? input.orderId}/review?paid_revision=success`
      ),
      cancelUrl: `${appUrl}/brand/projects/${input.projectId ?? input.orderId}/review?paid_revision=cancelled`
    });

    if (!session.url) {
      throw appError("SYSTEM_ERROR", "Stripe checkout URL missing");
    }

    return {
      mode: "stripe" as const,
      checkoutUrl: session.url,
      sessionId: session.id,
      addOnAmount: quote.amountUsd,
      currency: quote.currency
    };
  }
}

export const platformPaymentService = new PlatformPaymentService();
