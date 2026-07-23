import type Stripe from "stripe";
import { authService } from "@/features/auth/auth.service";
import { depositService } from "@/features/deposit/deposit.service";
import { stripeCustomerService } from "@/features/payment/stripe-customer.service";
import { getAppBaseUrl } from "@/lib/app-url";
import { CREATOR_DEPOSIT_AMOUNT_MINOR, CREATOR_DEPOSIT_CURRENCY } from "@/features/deposit/deposit.constants";
import { stripeUnitAmount } from "@/lib/credits/currency-minor-units";
import { appError } from "@/lib/core/errors";
import type { Locale } from "@/lib/i18n";
import { getStripe } from "@/lib/stripe";
import { isStripeEmbeddedReady } from "@/lib/payment/stripe-publishable";
import {
  attachDepositStripePaymentIntent,
  createDepositStripePayment
} from "@/lib/studioos/deposit-service";
import { depositAmountUsdFromMinor } from "@/features/deposit/deposit.constants";

export type EmbeddedDepositIntentResult = {
  clientSecret: string;
  paymentIntentId: string;
  paymentId: string;
  amountUsd: number;
  currency: string;
  publishableKey: string;
};

function depositReturnUrl(appUrl: string, locale: Locale) {
  return `${appUrl}/studio/deposit?checkout=success&payment_intent={PAYMENT_INTENT_ID}&lang=${locale}`;
}

function buildDepositPaymentIntentParams(input: {
  amountMinor: number;
  currency: string;
  customerId: string;
  savePaymentMethod: boolean;
  locale: Locale;
  metadata: Record<string, string>;
  returnUrl: string;
}): Stripe.PaymentIntentCreateParams {
  const paymentMethodTypes = ["card", "alipay", "wechat_pay"] as const;

  return {
    amount: stripeUnitAmount(input.currency, input.amountMinor),
    currency: input.currency.toLowerCase(),
    customer: input.customerId,
    setup_future_usage: input.savePaymentMethod ? "off_session" : undefined,
    metadata: input.metadata,
    payment_method_types: [...paymentMethodTypes],
    payment_method_options: {
      wechat_pay: { client: "web" }
    },
    automatic_payment_methods: undefined,
    return_url: input.returnUrl
  };
}

export class StripeEmbeddedPaymentService {
  isConfigured() {
    return isStripeEmbeddedReady();
  }

  async createCreatorDepositIntent(input: {
    userId: string;
    locale: Locale;
    savePaymentMethod?: boolean;
  }): Promise<EmbeddedDepositIntentResult> {
    if (!this.isConfigured()) {
      throw appError("SYSTEM_ERROR", "Stripe embedded checkout is not configured");
    }

    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
    if (!publishableKey) {
      throw appError("SYSTEM_ERROR", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing");
    }

    const user = await authService.getUserById(input.userId);
    if (!user || user.role !== "CREATOR") {
      throw appError("FORBIDDEN", "Creator account required");
    }

    const pending = await createDepositStripePayment(input.userId);
    if (!pending.ok) {
      throw appError("VALIDATION_ERROR", pending.error);
    }

    const customer = await stripeCustomerService.getOrCreateForUser({
      userId: user.id,
      email: user.email,
      fullName: user.fullName
    });

    const appUrl = getAppBaseUrl();
    const amountMinor = pending.amountMinor ?? CREATOR_DEPOSIT_AMOUNT_MINOR;
    const currency = pending.currency ?? CREATOR_DEPOSIT_CURRENCY;
    const stripe = getStripe();
    const metadata = {
      type: "creator_deposit",
      creator_id: user.id,
      payment_id: pending.payment.id,
      amount_minor: String(amountMinor),
      currency
    };

    const intent = await stripe.paymentIntents.create(
      buildDepositPaymentIntentParams({
        amountMinor,
        currency,
        customerId: customer.id,
        savePaymentMethod: input.savePaymentMethod ?? true,
        locale: input.locale,
        metadata,
        returnUrl: depositReturnUrl(appUrl, input.locale)
      })
    );

    if (!intent.client_secret) {
      throw appError("SYSTEM_ERROR", "Stripe payment intent client secret missing");
    }

    await attachDepositStripePaymentIntent({
      creatorId: user.id,
      paymentId: pending.payment.id,
      stripePaymentIntentId: intent.id
    });

    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      paymentId: pending.payment.id,
      amountUsd: depositAmountUsdFromMinor(amountMinor),
      currency,
      publishableKey
    };
  }

  async reconcileCreatorDepositIntent(paymentIntentId: string, authenticatedUserId: string) {
    if (!this.isConfigured()) {
      throw appError("SYSTEM_ERROR", "Stripe embedded checkout is not configured");
    }

    return depositService.reconcilePaymentIntentForUser(paymentIntentId, authenticatedUserId);
  }
}

export const stripeEmbeddedPaymentService = new StripeEmbeddedPaymentService();
