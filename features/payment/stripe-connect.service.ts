import type Stripe from "stripe";
import { getAppBaseUrl } from "@/lib/app-url";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { logger } from "@/lib/core/logger";
import {
  defaultConnectCountry,
  isStripeConnectConfigured
} from "@/lib/payment/stripe-connect-ready";
import {
  getStripePlatformConnectContext,
  settlementCurrencyLabel,
  usdToSettlementMinor
} from "@/lib/payment/stripe-connect-platform";
import type {
  StripeConnectOnboardResult,
  StripeConnectStatusView,
  StripeConnectTransferResult
} from "@/features/payment/stripe-connect.types";
import { getStripe } from "@/lib/stripe";

/** US Connect accounts must request card_payments alongside transfers. */
function connectCapabilitiesForCountry(country: string): Stripe.AccountCreateParams["capabilities"] {
  const normalized = country.slice(0, 2).toUpperCase();
  if (normalized === "US") {
    return {
      card_payments: { requested: true },
      transfers: { requested: true }
    };
  }
  return { transfers: { requested: true } };
}

async function resolveConnectCountry(stripe: Stripe, preferredCountry?: string | null) {
  const platform = await getStripePlatformConnectContext(stripe);
  const candidate = (preferredCountry ?? defaultConnectCountry()).slice(0, 2).toUpperCase();
  if (candidate !== platform.country) {
    logger.warn("stripe.connect.country_mismatch", {
      service: "StripeConnectService",
      configuredCountry: candidate,
      platformCountry: platform.country
    });
    return platform.country;
  }
  return candidate;
}

function buildTestConnectAccountPayload(country: string, email: string) {
  const normalized = country.slice(0, 2).toUpperCase();
  const sharedIndividual = {
    email,
    first_name: "VINCIS",
    last_name: "Creator",
    id_number: "222222222",
    dob: { day: 1, month: 1, year: 1902 },
    verification: {
      document: {
        front: "file_identity_document_success"
      }
    }
  } satisfies Stripe.AccountCreateParams.Individual;

  if (normalized === "HK") {
    return {
      individual: {
        ...sharedIndividual,
        phone: "+85291234567",
        address: {
          line1: "address_full_match",
          city: "Hong Kong",
          country: "HK"
        }
      },
      external_account: {
        object: "bank_account" as const,
        country: "HK",
        currency: "hkd",
        routing_number: "110-000",
        account_number: "000123456"
      }
    };
  }

  return {
    individual: {
      ...sharedIndividual,
      phone: "+16505551234",
      address: {
        line1: "address_full_match",
        city: "San Francisco",
        state: "CA",
        postal_code: "94103",
        country: "US"
      }
    },
    external_account: {
      object: "bank_account" as const,
      country: "US",
      currency: "usd",
      routing_number: "110000000",
      account_number: "000123456789"
    }
  };
}

function assertDb() {
  if (!hasDatabaseUrl()) {
    throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }
}

async function loadCreatorProfile(userId: string) {
  assertDb();
  const profile = await prisma.creatorProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      country: true,
      stripeConnectAccountId: true,
      stripeConnectDetailsSubmitted: true,
      stripeConnectPayoutsEnabled: true,
      stripeConnectOnboardedAt: true,
      user: { select: { email: true, fullName: true } }
    }
  });
  if (!profile) {
    throw appError("FORBIDDEN", "Creator profile required for Stripe Connect");
  }
  return profile;
}

function mapStatus(profile: Awaited<ReturnType<typeof loadCreatorProfile>>): StripeConnectStatusView {
  const configured = isStripeConnectConfigured();
  const accountId = profile.stripeConnectAccountId;
  return {
    configured,
    accountId,
    detailsSubmitted: profile.stripeConnectDetailsSubmitted,
    payoutsEnabled: profile.stripeConnectPayoutsEnabled,
    onboardedAt: profile.stripeConnectOnboardedAt?.toISOString() ?? null,
    dashboardUrl: accountId ? `https://dashboard.stripe.com/connect/accounts/${accountId}` : null,
    requiresOnboarding: configured && (!accountId || !profile.stripeConnectPayoutsEnabled)
  };
}

async function persistAccountState(
  userId: string,
  account: Stripe.Account
) {
  const payoutsEnabled = Boolean(account.payouts_enabled);
  const detailsSubmitted = Boolean(account.details_submitted);
  await prisma.creatorProfile.update({
    where: { userId },
    data: {
      stripeConnectAccountId: account.id,
      stripeConnectDetailsSubmitted: detailsSubmitted,
      stripeConnectPayoutsEnabled: payoutsEnabled,
      stripeConnectOnboardedAt:
        payoutsEnabled && detailsSubmitted ? new Date() : undefined
    }
  });
}

export class StripeConnectService {
  isConfigured() {
    return isStripeConnectConfigured();
  }

  async getStatus(userId: string): Promise<StripeConnectStatusView> {
    const profile = await loadCreatorProfile(userId);
    if (!profile.stripeConnectAccountId || !this.isConfigured()) {
      return mapStatus(profile);
    }

    try {
      const account = await getStripe().accounts.retrieve(profile.stripeConnectAccountId);
      await persistAccountState(userId, account);
      const refreshed = await loadCreatorProfile(userId);
      return mapStatus(refreshed);
    } catch (error) {
      logger.warn("stripe.connect.status_refresh_failed", {
        service: "StripeConnectService",
        userId,
        accountId: profile.stripeConnectAccountId,
        error: error instanceof Error ? error.message : String(error)
      });
      return mapStatus(profile);
    }
  }

  async createOnboardingLink(userId: string, locale: "en" | "zh"): Promise<StripeConnectOnboardResult> {
    if (!this.isConfigured()) {
      throw appError("SYSTEM_ERROR", "Stripe Connect is not configured");
    }

    const profile = await loadCreatorProfile(userId);
    const stripe = getStripe();
    const country = await resolveConnectCountry(stripe, profile.country);
    let accountId = profile.stripeConnectAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country,
        email: profile.user.email,
        business_type: "individual",
        capabilities: connectCapabilitiesForCountry(country),
        metadata: {
          vincis_user_id: userId,
          vincis_creator_profile_id: profile.id
        }
      });
      accountId = account.id;
      await prisma.creatorProfile.update({
        where: { userId },
        data: { stripeConnectAccountId: accountId }
      });
    }

    const appUrl = getAppBaseUrl();
    const localePath = locale === "zh" ? "/zh/studio/income" : "/studio/income";
    const returnPath = `${localePath}?connect=return`;
    const refreshPath = `${localePath}?connect=refresh`;

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      return_url: `${appUrl}${returnPath}`,
      refresh_url: `${appUrl}${refreshPath}`
    });

    if (!accountLink.url) {
      throw appError("SYSTEM_ERROR", "Stripe Connect onboarding URL missing");
    }

    return { accountId, onboardingUrl: accountLink.url };
  }

  async createDashboardLink(userId: string) {
    if (!this.isConfigured()) {
      throw appError("SYSTEM_ERROR", "Stripe Connect is not configured");
    }
    const profile = await loadCreatorProfile(userId);
    if (!profile.stripeConnectAccountId) {
      throw appError("VALIDATION_ERROR", "Stripe Connect account not found");
    }
    const link = await getStripe().accounts.createLoginLink(profile.stripeConnectAccountId);
    return { url: link.url };
  }

  async syncAccountFromWebhook(account: Stripe.Account) {
    const userId = account.metadata?.vincis_user_id;
    if (!userId) {
      return { handled: false as const, reason: "missing_user_metadata" };
    }
    await persistAccountState(userId, account);
    logger.info("stripe.connect.account_synced", {
      service: "StripeConnectService",
      userId,
      accountId: account.id,
      payoutsEnabled: account.payouts_enabled
    });
    return { handled: true as const, userId, accountId: account.id };
  }

  async createTransfer(input: {
    userId: string;
    withdrawId: string;
    amountUsd: number;
    idempotencyKey?: string;
  }): Promise<StripeConnectTransferResult> {
    if (!this.isConfigured()) {
      throw appError("SYSTEM_ERROR", "Stripe Connect is not configured");
    }

    const status = await this.getStatus(input.userId);
    if (!status.accountId || !status.payoutsEnabled) {
      throw appError("VALIDATION_ERROR", "Stripe Connect payouts are not enabled");
    }

    const amountUsd = Math.round(input.amountUsd * 100) / 100;
    const platform = await getStripePlatformConnectContext();
    const amountMinor = usdToSettlementMinor(amountUsd, platform.currency);
    if (amountMinor < 100) {
      throw appError("VALIDATION_ERROR", "Transfer amount below Stripe minimum");
    }

    const transfer = await getStripe().transfers.create(
      {
        amount: amountMinor,
        currency: platform.currency,
        destination: status.accountId,
        metadata: {
          vincis_user_id: input.userId,
          vincis_withdraw_id: input.withdrawId
        }
      },
      { idempotencyKey: input.idempotencyKey ?? input.withdrawId }
    );

    return {
      transferId: transfer.id,
      amountUsd,
      currency: settlementCurrencyLabel(platform.currency),
      destinationAccountId: status.accountId
    };
  }

  /** Test-mode helper: create a payout-ready Custom account without hosted onboarding UI. */
  async activateTestAccount(userId: string) {
    if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")) {
      throw appError("FORBIDDEN", "Test account activation is disabled in live mode");
    }

    const profile = await loadCreatorProfile(userId);
    const stripe = getStripe();
    const platform = await getStripePlatformConnectContext(stripe);
    const country = platform.country;
    const testAccount = buildTestConnectAccountPayload(country, profile.user.email);
    let accountId = profile.stripeConnectAccountId;

    if (accountId) {
      const existing = await stripe.accounts.retrieve(accountId);
      const countryMismatch = (existing.country ?? "").toUpperCase() !== country;
      if (existing.type !== "custom" || !existing.payouts_enabled || countryMismatch) {
        try {
          await stripe.accounts.del(accountId);
        } catch (error) {
          logger.warn("stripe.connect.test_account_delete_failed", {
            service: "StripeConnectService",
            userId,
            accountId,
            error: error instanceof Error ? error.message : String(error)
          });
        }
        accountId = null;
        await prisma.creatorProfile.update({
          where: { userId },
          data: {
            stripeConnectAccountId: null,
            stripeConnectDetailsSubmitted: false,
            stripeConnectPayoutsEnabled: false,
            stripeConnectOnboardedAt: null
          }
        });
      }
    }

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "custom",
        country,
        email: profile.user.email,
        business_type: "individual",
        capabilities: connectCapabilitiesForCountry(country),
        business_profile: {
          mcc: "5045",
          url: "https://vincis.app"
        },
        external_account: testAccount.external_account,
        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip: "127.0.0.1"
        },
        individual: testAccount.individual,
        metadata: {
          vincis_user_id: userId,
          vincis_creator_profile_id: profile.id,
          vincis_test_account: "true"
        }
      });
      accountId = account.id;
      await prisma.creatorProfile.update({
        where: { userId },
        data: { stripeConnectAccountId: accountId }
      });
    }

    let account = await stripe.accounts.retrieve(accountId);
    for (let attempt = 0; attempt < 30 && !account.payouts_enabled; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      account = await stripe.accounts.retrieve(accountId);
    }
    await persistAccountState(userId, account);
    return mapStatus(await loadCreatorProfile(userId));
  }
}

export const stripeConnectService = new StripeConnectService();
