/**
 * Creator earnings → Credits conversion verification
 * Run: npm run credits:conversion:verify
 */
import { PrismaClient } from "@prisma/client";
import { creditWalletRepository } from "../features/credit-wallet/credit-wallet.repository";

const prisma = new PrismaClient();
const VERIFY_EMAIL_ENV = "VINCIS_CREDITS_VERIFY_EMAIL";

type Check = { name: string; ok: boolean; detail?: string };

function report(checks: Check[]) {
  for (const check of checks) {
    console.log(`${check.ok ? "OK" : "FAIL"} ${check.name}${check.detail ? `: ${check.detail}` : ""}`);
  }
  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    throw new Error(`${failed.length} earning conversion verification check(s) failed`);
  }
}

async function main() {
  const checks: Check[] = [];

  if (!process.env.DATABASE_URL) {
    checks.push({ name: "conversion.skip", ok: true, detail: "DATABASE_URL not configured" });
    report(checks);
    return;
  }

  const verifyEmail = process.env[VERIFY_EMAIL_ENV]?.trim().toLowerCase();
  if (!verifyEmail) {
    checks.push({
      name: "conversion.skip",
      ok: true,
      detail: `Set ${VERIFY_EMAIL_ENV} to a dedicated test creator before running conversion checks`
    });
    report(checks);
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: verifyEmail },
    select: { id: true, email: true, role: true }
  });
  if (!user) {
    throw new Error(`Conversion verify user not found: ${verifyEmail}`);
  }
  if (user.role !== "CREATOR") {
    throw new Error(`Conversion verify user must be CREATOR: ${verifyEmail}`);
  }

  await prisma.creatorEarningWallet.upsert({
    where: { userId: user.id },
    create: { userId: user.id, availableBalanceMinor: 8000 },
    update: { availableBalanceMinor: 8000 }
  });

  const creditWallet = await creditWalletRepository.getOrCreateWallet(user.id);
  const beforeCredits = creditWallet.availableCredits;
  const conversionKey = `verify-convert-${Date.now()}`;

  const conversion = await creditWalletRepository.convertEarnings({
    userId: user.id,
    earningAmountMinor: 1500,
    creditsGranted: 1500,
    exchangeRateSnapshot: { currency: "USD", creditsPerUnitMinor: 100, quotedAt: new Date().toISOString() },
    idempotencyKey: conversionKey
  });
  checks.push({
    name: "conversion.completed",
    ok:
      conversion.status === "COMPLETED" &&
      Boolean(conversion.earningTransactionId) &&
      Boolean(conversion.creditTransactionId),
    detail: conversion.id
  });

  const duplicateConversion = await creditWalletRepository.convertEarnings({
    userId: user.id,
    earningAmountMinor: 1500,
    creditsGranted: 1500,
    exchangeRateSnapshot: { currency: "USD", creditsPerUnitMinor: 100, quotedAt: new Date().toISOString() },
    idempotencyKey: conversionKey
  });
  checks.push({
    name: "conversion.idempotent",
    ok: duplicateConversion.id === conversion.id,
    detail: duplicateConversion.id
  });

  const earningWallet = await prisma.creatorEarningWallet.findUnique({ where: { userId: user.id } });
  checks.push({
    name: "conversion.earning_deducted",
    ok: Boolean(earningWallet && earningWallet.availableBalanceMinor === 6500),
    detail: earningWallet ? String(earningWallet.availableBalanceMinor) : "missing wallet"
  });

  const afterWallet = await creditWalletRepository.findWallet(user.id);
  checks.push({
    name: "conversion.credits_credited",
    ok: Boolean(afterWallet && afterWallet.availableCredits === beforeCredits + 1500),
    detail: afterWallet ? String(afterWallet.availableCredits) : "missing wallet"
  });

  const earningTx = await prisma.creatorEarningTransaction.findFirst({
    where: { referenceType: "EarningToCreditConversion", referenceId: conversion.id }
  });
  const creditTx = await prisma.creditTransaction.findFirst({
    where: { referenceType: "EarningToCreditConversion", referenceId: conversion.id }
  });
  checks.push({
    name: "conversion.linked_ledgers",
    ok: Boolean(earningTx && creditTx),
    detail: `${earningTx?.id ?? "none"}/${creditTx?.id ?? "none"}`
  });

  let insufficientRejected = false;
  try {
    await creditWalletRepository.convertEarnings({
      userId: user.id,
      earningAmountMinor: 999999,
      creditsGranted: 999999,
      exchangeRateSnapshot: { currency: "USD", creditsPerUnitMinor: 100 },
      idempotencyKey: `verify-insufficient-${Date.now()}`
    });
  } catch {
    insufficientRejected = true;
  }
  checks.push({
    name: "conversion.insufficient_earnings",
    ok: insufficientRejected,
    detail: String(insufficientRejected)
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
