#!/usr/bin/env tsx
/**
 * Creator deposit reconcile integration checks (DB required — no skips).
 * Run: npm run deposit:reconcile:verify
 */
import type Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import {
  CREATOR_DEPOSIT_AMOUNT_MINOR,
  CREATOR_DEPOSIT_CURRENCY
} from "../features/deposit/deposit.constants";
import { depositReconcileService } from "../features/deposit/deposit-reconcile.service";
import { depositRepository } from "../features/deposit/deposit.repository";
import { assertDemoDepositPaymentsAllowed } from "../lib/deposit/deposit-env";
import { isAppError } from "../lib/core/errors";
import { hasDatabaseUrl } from "../lib/core/database/prisma";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string; skipped?: boolean };

function maskDatabaseUrl(url: string | undefined) {
  if (!url) return "(unset)";
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const db = parsed.pathname.replace(/^\//, "") || "postgres";
    return `${parsed.protocol}//***@${host}/${db}`;
  } catch {
    return "(invalid DATABASE_URL)";
  }
}

function buildIntent(input: {
  id: string;
  creatorId: string;
  paymentId: string;
  amountMinor?: number;
  currency?: string;
  status?: Stripe.PaymentIntent.Status;
}): Stripe.PaymentIntent {
  const amountMinor = input.amountMinor ?? CREATOR_DEPOSIT_AMOUNT_MINOR;
  const currency = (input.currency ?? CREATOR_DEPOSIT_CURRENCY).toLowerCase();
  return {
    id: input.id,
    object: "payment_intent",
    amount: amountMinor,
    amount_received: amountMinor,
    currency,
    status: input.status ?? "succeeded",
    metadata: {
      type: "creator_deposit",
      creator_id: input.creatorId,
      payment_id: input.paymentId,
      amount_minor: String(amountMinor),
      currency: currency.toUpperCase()
    }
  } as unknown as Stripe.PaymentIntent;
}

function withNodeEnv<T>(value: string | undefined, run: () => T): T {
  const env = process.env as Record<string, string | undefined>;
  const previous = env.NODE_ENV;
  if (value === undefined) {
    delete env.NODE_ENV;
  } else {
    env.NODE_ENV = value;
  }
  try {
    return run();
  } finally {
    if (previous === undefined) {
      delete env.NODE_ENV;
    } else {
      env.NODE_ENV = previous;
    }
  }
}

function report(checks: Check[]) {
  const passed = checks.filter((item) => item.ok).length;
  const failed = checks.filter((item) => !item.ok).length;
  const skipped = checks.filter((item) => item.skipped).length;

  for (const item of checks) {
    console.log(item.ok ? "PASS" : "FAIL", item.name, item.detail ?? "");
  }

  console.log(
    JSON.stringify(
      {
        database: maskDatabaseUrl(process.env.DATABASE_URL),
        total: checks.length,
        passed,
        failed,
        skipped
      },
      null,
      2
    )
  );

  if (failed > 0 || skipped > 0) {
    process.exit(1);
  }

  console.log("deposit-reconcile-verify: all checks passed");
}

async function createPendingPayment(accountId: string, userId: string, paymentIntentId: string) {
  const payment = await depositRepository.createPayment({
    accountId,
    userId,
    paymentMethod: "bank_wire",
    paymentReference: "verify"
  });
  await depositRepository.attachStripePaymentIntent(payment.id, accountId, paymentIntentId);
  return payment;
}

async function ensureCreatorPair() {
  const existing = await prisma.creatorProfile.findMany({
    take: 2,
    orderBy: { createdAt: "asc" },
    select: { id: true, userId: true, legacyCreatorId: true }
  });
  if (existing.length >= 2) {
    return existing;
  }

  const fixtureEmail = "deposit-verify-creator-b@studioos.test";
  let fixtureUser = await prisma.user.findUnique({ where: { email: fixtureEmail } });
  if (!fixtureUser) {
    fixtureUser = await prisma.user.create({
      data: {
        email: fixtureEmail,
        role: "CREATOR",
        fullName: "Deposit Verify Creator B",
        languageCode: "en"
      }
    });
    await prisma.creatorProfile.create({
      data: {
        userId: fixtureUser.id,
        displayName: "Deposit Verify Creator B",
        legacyCreatorId: "deposit_verify_creator_b"
      }
    });
  } else if (!(await prisma.creatorProfile.findUnique({ where: { userId: fixtureUser.id } }))) {
    await prisma.creatorProfile.create({
      data: {
        userId: fixtureUser.id,
        displayName: "Deposit Verify Creator B",
        legacyCreatorId: "deposit_verify_creator_b"
      }
    });
  }

  const refreshed = await prisma.creatorProfile.findMany({
    take: 2,
    orderBy: { createdAt: "asc" },
    select: { id: true, userId: true, legacyCreatorId: true }
  });
  if (refreshed.length < 2) {
    throw new Error("Unable to provision two creator profiles for deposit reconcile verification");
  }
  return refreshed;
}

async function main() {
  const checks: Check[] = [];

  if (!hasDatabaseUrl()) {
    checks.push({
      name: "database.configured",
      ok: false,
      detail: "DATABASE_URL is required for deposit reconcile verification"
    });
    report(checks);
    return;
  }

  checks.push({
    name: "database.configured",
    ok: true,
    detail: maskDatabaseUrl(process.env.DATABASE_URL)
  });

  let demoBlockedInProduction = false;
  withNodeEnv("production", () => {
    try {
      assertDemoDepositPaymentsAllowed("deposit-reconcile-verify");
    } catch {
      demoBlockedInProduction = true;
    }
  });
  checks.push({
    name: "demo.blocked-in-production",
    ok: demoBlockedInProduction
  });

  const creators = await ensureCreatorPair();

  checks.push({
    name: "database.creator-fixtures",
    ok: creators.length >= 2,
    detail: `creators=${creators.length}`
  });

  if (creators.length < 2) {
    report(checks);
    return;
  }

  const [creatorA, creatorB] = creators;
  const identityA = await depositRepository.resolveIdentity(creatorA.userId);
  const identityB = await depositRepository.resolveIdentity(creatorB.userId);
  if (!identityA || !identityB) {
    throw new Error("Unable to resolve creator identities");
  }

  const accountA = await depositRepository.getOrCreateAccount(identityA);
  const suffix = Date.now();
  const paymentIntentId = `pi_deposit_verify_${suffix}`;
  const payment = await createPendingPayment(accountA.id, identityA.userId, paymentIntentId);

  const intent = buildIntent({
    id: paymentIntentId,
    creatorId: identityA.userId,
    paymentId: payment.id
  });

  let idorBlocked = false;
  try {
    await depositReconcileService.reconcilePaymentIntent({
      intent,
      authenticatedUserId: identityB.userId
    });
  } catch (error) {
    idorBlocked = isAppError(error) && error.code === "NOT_FOUND";
  }
  checks.push({
    name: "reconcile.idor-returns-not-found",
    ok: idorBlocked
  });

  let amountMismatchBlocked = false;
  try {
    await depositReconcileService.reconcilePaymentIntent({
      intent: buildIntent({
        id: paymentIntentId,
        creatorId: identityA.userId,
        paymentId: payment.id,
        amountMinor: CREATOR_DEPOSIT_AMOUNT_MINOR + 100
      }),
      authenticatedUserId: identityA.userId
    });
  } catch (error) {
    amountMismatchBlocked = isAppError(error) && error.code === "VALIDATION_ERROR";
  }
  checks.push({
    name: "reconcile.amount-mismatch-rejected",
    ok: amountMismatchBlocked
  });

  const first = await depositReconcileService.reconcilePaymentIntent({
    intent,
    authenticatedUserId: identityA.userId
  });
  checks.push({
    name: "reconcile.owner-succeeds",
    ok: first.paid === true && first.duplicate === false
  });

  const ledgerAfterFirst = await prisma.creatorDepositLedgerEntry.count({
    where: {
      accountId: accountA.id,
      entryType: "DEPOSIT_CREDIT",
      externalReferenceId: paymentIntentId
    }
  });
  checks.push({
    name: "reconcile.creates-ledger-entry",
    ok: ledgerAfterFirst === 1,
    detail: String(ledgerAfterFirst)
  });

  const accountAfterFirst = await depositRepository.findAccountById(accountA.id);
  checks.push({
    name: "reconcile.account-marked-paid",
    ok: accountAfterFirst?.depositStatus === "PAID"
  });

  const second = await depositReconcileService.reconcilePaymentIntent({
    intent,
    authenticatedUserId: identityA.userId
  });
  checks.push({
    name: "reconcile.duplicate-is-idempotent",
    ok: second.paid === true && second.duplicate === true
  });

  const ledgerAfterSecond = await prisma.creatorDepositLedgerEntry.count({
    where: {
      accountId: accountA.id,
      entryType: "DEPOSIT_CREDIT",
      externalReferenceId: paymentIntentId
    }
  });
  checks.push({
    name: "reconcile.no-double-ledger",
    ok: ledgerAfterSecond === 1,
    detail: String(ledgerAfterSecond)
  });

  const concurrentIntentId = `pi_deposit_verify_concurrent_${suffix}`;
  const concurrentPayment = await createPendingPayment(
    accountA.id,
    identityA.userId,
    concurrentIntentId
  );
  const concurrentIntent = buildIntent({
    id: concurrentIntentId,
    creatorId: identityA.userId,
    paymentId: concurrentPayment.id
  });

  const [concurrentA, concurrentB] = await Promise.all([
    depositReconcileService.reconcilePaymentIntent({
      intent: concurrentIntent,
      authenticatedUserId: identityA.userId
    }),
    depositReconcileService.reconcilePaymentIntent({
      intent: concurrentIntent
    })
  ]);

  const concurrentLedgerCount = await prisma.creatorDepositLedgerEntry.count({
    where: {
      externalReferenceId: concurrentIntentId,
      entryType: "DEPOSIT_CREDIT"
    }
  });
  checks.push({
    name: "reconcile.concurrent-single-ledger",
    ok:
      concurrentLedgerCount === 1 &&
      concurrentA.paid === true &&
      concurrentB.paid === true &&
      concurrentA.duplicate !== concurrentB.duplicate,
    detail: `ledger=${concurrentLedgerCount}, dupA=${concurrentA.duplicate}, dupB=${concurrentB.duplicate}`
  });

  report(checks);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
