#!/usr/bin/env tsx
/**
 * One-time migration from legacy deposit-store.json into PostgreSQL.
 * Usage:
 *   npx tsx scripts/migrate-deposit-json.ts --dry-run
 *   npx tsx scripts/migrate-deposit-json.ts
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  CREATOR_DEPOSIT_AMOUNT_MINOR,
  CREATOR_DEPOSIT_CURRENCY,
  depositAmountUsdFromMinor
} from "../features/deposit/deposit.constants";
import { depositRepository } from "../features/deposit/deposit.repository";
import { hasDatabaseUrl, prisma } from "../lib/core/database/prisma";

type LegacyStore = {
  creator_overlays?: Record<
    string,
    { deposit_status?: string; deposit_amount?: number; paid_at?: string | null }
  >;
  payments?: Array<{
    id: string;
    creator_id: string;
    amount_usd: number;
    payment_method: string;
    payment_reference?: string;
    status: string;
    stripe_session_id?: string | null;
    stripe_payment_intent_id?: string | null;
    created_at: string;
    confirmed_at?: string | null;
  }>;
};

const dryRun = process.argv.includes("--dry-run");

function mapLegacyStatus(status: string) {
  if (status === "confirmed") return "SUCCEEDED" as const;
  if (status === "under_review") return "PROCESSING" as const;
  if (status === "failed") return "FAILED" as const;
  return "PENDING" as const;
}

async function main() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is required");
  }

  const filePath = path.join(process.cwd(), ".data", "deposit-store.json");
  const raw = await readFile(filePath, "utf8").catch(() => null);
  if (!raw) {
    console.log("No deposit-store.json found — nothing to migrate.");
    return;
  }

  const store = JSON.parse(raw) as LegacyStore;
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const payment of store.payments ?? []) {
    try {
      const identity = await depositRepository.resolveIdentity(payment.creator_id);
      if (!identity) {
        skipped += 1;
        continue;
      }

      const existing =
        (payment.stripe_payment_intent_id
          ? await prisma.creatorDepositPayment.findUnique({
              where: { stripePaymentIntentId: payment.stripe_payment_intent_id }
            })
          : null) ??
        (await prisma.creatorDepositPayment.findUnique({ where: { id: payment.id } }));

      if (existing) {
        skipped += 1;
        continue;
      }

      const amountMinor = Math.round(payment.amount_usd * 100) || CREATOR_DEPOSIT_AMOUNT_MINOR;
      if (dryRun) {
        migrated += 1;
        continue;
      }

      const account = await depositRepository.getOrCreateAccount(identity);
      await prisma.creatorDepositPayment.create({
        data: {
          id: payment.id,
          accountId: account.id,
          userId: identity.userId,
          amountMinor,
          currency: CREATOR_DEPOSIT_CURRENCY,
          amountUsd: depositAmountUsdFromMinor(amountMinor),
          paymentMethod: payment.payment_method,
          paymentReference: payment.payment_reference,
          provider: payment.stripe_session_id || payment.stripe_payment_intent_id ? "stripe" : "manual",
          status: mapLegacyStatus(payment.status),
          stripeSessionId: payment.stripe_session_id,
          stripePaymentIntentId: payment.stripe_payment_intent_id,
          createdAt: new Date(payment.created_at),
          confirmedAt: payment.confirmed_at ? new Date(payment.confirmed_at) : null
        }
      });

      if (payment.status === "confirmed") {
        await prisma.creatorDepositAccount.update({
          where: { id: account.id },
          data: {
            depositStatus: "PAID",
            depositAmountUsd: depositAmountUsdFromMinor(amountMinor),
            paidAt: payment.confirmed_at ? new Date(payment.confirmed_at) : new Date(payment.created_at)
          }
        });

        const externalReferenceId =
          payment.stripe_payment_intent_id ?? payment.stripe_session_id ?? payment.id;
        const provider =
          payment.stripe_session_id || payment.stripe_payment_intent_id ? "stripe" : "manual";

        await prisma.creatorDepositLedgerEntry.create({
          data: {
            accountId: account.id,
            paymentId: payment.id,
            provider,
            externalReferenceId,
            entryType: "DEPOSIT_CREDIT",
            direction: "CREDIT",
            amountMinor,
            currency: CREATOR_DEPOSIT_CURRENCY,
            balanceAfterMinor: amountMinor,
            description: "Migrated creator deposit credit",
            createdAt: payment.confirmed_at ? new Date(payment.confirmed_at) : new Date(payment.created_at)
          }
        }).catch(() => undefined);
      }

      migrated += 1;
    } catch (error) {
      errors += 1;
      console.error("Failed to migrate payment", payment.id, error);
    }
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        migrated,
        skipped,
        errors
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
