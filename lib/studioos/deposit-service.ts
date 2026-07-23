import { depositService, type AdminDepositRow } from "@/features/deposit/deposit.service";
import type {
  CreatorDepositOverlay,
  CreatorDepositSnapshot,
  DepositPayment
} from "@/lib/studioos/deposit-types";
import type { PayoutMethodType } from "@/lib/studioos/withdrawal-types";
import { CREATOR_DEPOSIT_USD } from "@/lib/studioos/deposit-copy";
import { assertProductionDepositDatabase } from "@/lib/deposit/deposit-env";

export type { AdminDepositRow };

function emptySnapshot(): CreatorDepositSnapshot {
  return {
    amount_usd: CREATOR_DEPOSIT_USD,
    deposit_status: "unpaid",
    paid_at: null,
    can_accept_orders: false,
    pending_payment: null,
    payments: []
  };
}

export async function getCreatorDepositOverlay(creatorId: string): Promise<CreatorDepositOverlay | null> {
  assertProductionDepositDatabase();
  return depositService.getCreatorDepositOverlay(creatorId);
}

export async function listAdminDepositRows(): Promise<AdminDepositRow[]> {
  assertProductionDepositDatabase();
  return depositService.listAdminDepositRows();
}

export async function getCreatorDepositSnapshot(creatorId: string): Promise<CreatorDepositSnapshot> {
  assertProductionDepositDatabase();
  return (await depositService.getCreatorDepositSnapshot(creatorId)) ?? emptySnapshot();
}

export async function submitDepositPayment(
  creatorId: string,
  input: {
    payment_method: PayoutMethodType;
    payment_reference?: string;
    locale: "en" | "zh";
  }
): Promise<{ ok: true; payment: DepositPayment } | { ok: false; error: string }> {
  assertProductionDepositDatabase();
  return depositService.submitDepositPayment(creatorId, input);
}

export async function createDepositStripePayment(creatorId: string): Promise<
  | { ok: true; payment: DepositPayment; amountUsd: number; amountMinor?: number; currency?: string }
  | { ok: false; error: string }
> {
  assertProductionDepositDatabase();
  return depositService.createDepositStripePayment(creatorId);
}

export async function attachDepositStripeSession(input: {
  creatorId: string;
  paymentId: string;
  stripeSessionId: string;
}) {
  assertProductionDepositDatabase();
  return depositService.attachDepositStripeSession(input);
}

export async function attachDepositStripePaymentIntent(input: {
  creatorId: string;
  paymentId: string;
  stripePaymentIntentId: string;
}) {
  assertProductionDepositDatabase();
  return depositService.attachDepositStripePaymentIntent(input);
}

export async function confirmCreatorDepositFromStripe(input: {
  creatorId: string;
  paymentId: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  amountUsd: number;
  amountMinor?: number;
  currency?: string;
}) {
  assertProductionDepositDatabase();
  const amountMinor = input.amountMinor ?? Math.round(input.amountUsd * 100);
  return depositService.confirmCreatorDepositFromStripe({
    creatorId: input.creatorId,
    paymentId: input.paymentId,
    stripeSessionId: input.stripeSessionId,
    stripePaymentIntentId: input.stripePaymentIntentId,
    amountMinor,
    currency: input.currency ?? "USD"
  });
}
