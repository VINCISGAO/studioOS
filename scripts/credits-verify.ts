/**
 * VINCIS Credits ledger verification
 * Run: npm run credits:verify
 */
import { PrismaClient } from "@prisma/client";
import { creditWalletRepository } from "../features/credit-wallet/credit-wallet.repository";
import { creditGenerationBillingService } from "../features/credit-wallet/credit-generation-billing.service";

const prisma = new PrismaClient();
const VERIFY_EMAIL_ENV = "VINCIS_CREDITS_VERIFY_EMAIL";

type Check = { name: string; ok: boolean; detail?: string };

function report(checks: Check[]) {
  for (const check of checks) {
    console.log(`${check.ok ? "OK" : "FAIL"} ${check.name}${check.detail ? `: ${check.detail}` : ""}`);
  }
  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    throw new Error(`${failed.length} credit verification check(s) failed`);
  }
}

async function main() {
  const checks: Check[] = [];

  if (!process.env.DATABASE_URL) {
    checks.push({ name: "credits.skip", ok: true, detail: "DATABASE_URL not configured" });
    report(checks);
    return;
  }

  const verifyEmail = process.env[VERIFY_EMAIL_ENV]?.trim().toLowerCase();
  if (!verifyEmail) {
    checks.push({
      name: "credits.wallet.skip",
      ok: true,
      detail: `Set ${VERIFY_EMAIL_ENV} to a dedicated test creator before running wallet mutation checks`
    });
  }

  const user = verifyEmail
    ? await prisma.user.findUnique({
        where: { email: verifyEmail },
        select: { id: true, email: true, role: true }
      })
    : null;

  if (verifyEmail && !user) {
    throw new Error(`Credits verify user not found: ${verifyEmail}`);
  }
  if (verifyEmail && user && user.role !== "CREATOR") {
    throw new Error(`Credits verify user must be CREATOR: ${verifyEmail}`);
  }

  if (user) {
  const wallet = await creditWalletRepository.getOrCreateWallet(user.id);
  const seedBalance = Math.max(wallet.availableCredits, 500);

  await prisma.creditWallet.update({
    where: { id: wallet.id },
    data: { availableCredits: seedBalance, reservedCredits: 0 }
  });

  const reserveKey = `verify-reserve-${Date.now()}`;
  const reservation = await creditWalletRepository.reserveCredits({
    userId: user.id,
    amount: 80,
    idempotencyKey: reserveKey,
    description: "verify reserve"
  });
  checks.push({
    name: "credits.reserve",
    ok: reservation.status === "ACTIVE" && reservation.estimatedCredits === 80,
    detail: reservation.status
  });

  const duplicateReserve = await creditWalletRepository.reserveCredits({
    userId: user.id,
    amount: 80,
    idempotencyKey: reserveKey,
    description: "verify reserve duplicate"
  });
  checks.push({
    name: "credits.reserve_idempotent",
    ok: duplicateReserve.id === reservation.id,
    detail: duplicateReserve.id
  });

  await creditWalletRepository.captureReservation(reservation.id, 72);
  const afterCapture = await creditWalletRepository.findWallet(user.id);
  checks.push({
    name: "credits.capture_partial_release",
    ok: Boolean(afterCapture && afterCapture.reservedCredits === 0),
    detail: afterCapture ? `available=${afterCapture.availableCredits}` : "missing wallet"
  });

  const failKey = `verify-fail-${Date.now()}`;
  const failReservation = await creditWalletRepository.reserveCredits({
    userId: user.id,
    amount: 40,
    idempotencyKey: failKey,
    description: "verify fail release"
  });
  await creditWalletRepository.releaseReservation(failReservation.id);
  const afterRelease = await creditWalletRepository.findWallet(user.id);
  checks.push({
    name: "credits.release_on_failure",
    ok: Boolean(afterRelease && afterRelease.reservedCredits === 0),
    detail: afterRelease ? `available=${afterCapture?.availableCredits}` : "missing wallet"
  });

  const pkg = await prisma.creditPackage.findFirst({ orderBy: { sortOrder: "asc" } });
  const order = await creditWalletRepository.createPurchaseOrder({
    userId: user.id,
    walletId: wallet.id,
    packageId: pkg?.id ?? null,
    credits: 100,
    bonusCredits: 10,
    currency: "USD",
    amountMinor: 900,
    idempotencyKey: `verify-order-${Date.now()}`
  });

  const firstCredit = await creditWalletRepository.creditPurchaseOrderOnce({
    orderId: order.id,
    providerPaymentId: "pi_verify_1",
    paidAt: new Date()
  });
  const secondCredit = await creditWalletRepository.creditPurchaseOrderOnce({
    orderId: order.id,
    providerPaymentId: "pi_verify_1",
    paidAt: new Date()
  });
  checks.push({
    name: "credits.webhook_idempotent",
    ok: firstCredit.duplicate === false && secondCredit.duplicate === true,
    detail: `${firstCredit.duplicate}/${secondCredit.duplicate}`
  });

  await prisma.creatorEarningWallet.upsert({
    where: { userId: user.id },
    create: { userId: user.id, availableBalanceMinor: 5000 },
    update: { availableBalanceMinor: 5000 }
  });

  const conversionKey = `verify-convert-${Date.now()}`;
  const conversion = await creditWalletRepository.convertEarnings({
    userId: user.id,
    earningAmountMinor: 1000,
    creditsGranted: 1000,
    exchangeRateSnapshot: { currency: "USD", creditsPerUnitMinor: 100 },
    idempotencyKey: conversionKey
  });
  const duplicateConversion = await creditWalletRepository.convertEarnings({
    userId: user.id,
    earningAmountMinor: 1000,
    creditsGranted: 1000,
    exchangeRateSnapshot: { currency: "USD", creditsPerUnitMinor: 100 },
    idempotencyKey: conversionKey
  });
  checks.push({
    name: "credits.earning_conversion_idempotent",
    ok:
      conversion.id === duplicateConversion.id &&
      conversion.status === "COMPLETED" &&
      Boolean(conversion.earningTransactionId) &&
      Boolean(conversion.creditTransactionId),
    detail: conversion.id
  });
  }

  const billingQuote = await creditGenerationBillingService.quoteGenerationDetailed({
    type: "IMAGE",
    model: "nano-banana-2",
    parameters: { resolution: "1024", outputs: 1, quality: "medium", width: 1024, height: 1024 }
  });
  checks.push({
    name: "credits.pricing_engine.nano_banana_2",
    ok: billingQuote.credits === 15 && Boolean(billingQuote.ruleId),
    detail: `${billingQuote.credits}/${billingQuote.ruleId}`
  });

  const gptImageQuote = await creditGenerationBillingService.quoteGenerationDetailed({
    type: "IMAGE",
    model: "gpt-image",
    parameters: { resolution: "1024", outputs: 1, quality: "medium", width: 1024, height: 1024 }
  });
  checks.push({
    name: "credits.pricing_engine.gpt_image",
    ok: gptImageQuote.credits === 15 && Boolean(gptImageQuote.ruleId),
    detail: `${gptImageQuote.credits}/${gptImageQuote.ruleId}`
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
