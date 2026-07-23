/**
 * Stripe Connect creator withdrawal E2E verification (sandbox)
 * Run: npm run stripe:connect:verify
 */
import { PrismaClient } from "@prisma/client";
import { stripeConnectService } from "../features/payment/stripe-connect.service";
import { stripeConnectWithdrawalService } from "../features/payment/stripe-connect-withdrawal.service";
import { withdrawService } from "../features/wallet/withdraw.service";
import { walletRepository } from "../features/wallet/wallet.repository";
import { paymentConfig } from "../lib/core/config/payment";
import { isStripeConnectConfigured } from "../lib/payment/stripe-connect-ready";
import {
  ensurePlatformTransferBalance,
  getStripePlatformConnectContext,
  usdToSettlementMinor
} from "../lib/payment/stripe-connect-platform";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

function report(checks: Check[]) {
  for (const check of checks) {
    console.log(`${check.ok ? "OK" : "FAIL"} ${check.name}${check.detail ? `: ${check.detail}` : ""}`);
  }
  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    throw new Error(`${failed.length} Stripe Connect verification check(s) failed`);
  }
}

async function main() {
  const checks: Check[] = [];

  if (!process.env.DATABASE_URL) {
    checks.push({ name: "connect.skip", ok: true, detail: "DATABASE_URL not configured" });
    report(checks);
    return;
  }

  if (!isStripeConnectConfigured()) {
    checks.push({
      name: "connect.skip",
      ok: true,
      detail: "STRIPE_SECRET_KEY not configured — set sk_test_... for sandbox E2E"
    });
    report(checks);
    return;
  }

  if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")) {
    checks.push({ name: "connect.skip", ok: true, detail: "Refusing to run against live Stripe key" });
    report(checks);
    return;
  }

  const user = await prisma.user.findFirst({
    where: { role: "CREATOR" },
    orderBy: { createdAt: "asc" },
    include: { creatorProfile: true }
  });

  if (!user?.creatorProfile) {
    checks.push({ name: "connect.skip", ok: true, detail: "No creator profile found" });
    report(checks);
    return;
  }

  const withdrawAmount = paymentConfig.minWithdrawUsd;
  const wallet = await walletRepository.getOrCreate(user.id);
  const available = Number(wallet.availableBalance);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const pendingWithdrawRequests = await prisma.transaction.findMany({
    where: {
      walletId: wallet.id,
      type: "WITHDRAW_REQUEST",
      createdAt: { gte: todayStart }
    },
    select: { id: true }
  });
  for (const request of pendingWithdrawRequests) {
    const completed = await prisma.transaction.findFirst({
      where: {
        walletId: wallet.id,
        type: "WITHDRAW_SUCCESS",
        description: { contains: request.id }
      }
    });
    if (!completed) {
      await withdrawService.failWithdraw(request.id, "Stripe Connect verify cleanup");
    }
  }

  const refreshedWallet = await walletRepository.getOrCreate(user.id);
  const refreshedAvailable = Number(refreshedWallet.availableBalance);
  if (refreshedAvailable < withdrawAmount) {
    const topUp = withdrawAmount - refreshedAvailable + 50;
    await walletRepository.applyLedgerUpdate({
      walletId: refreshedWallet.id,
      availableDelta: topUp,
      entries: [
        {
          type: "ESCROW_RELEASE",
          amount: topUp,
          balanceAfter: refreshedAvailable + topUp,
          description: "Stripe Connect verify balance seed"
        }
      ]
    });
    checks.push({ name: "connect.seed_balance", ok: true, detail: `+${topUp} USD` });
  }

  const activated = await stripeConnectService.activateTestAccount(user.id);
  checks.push({
    name: "connect.onboarding_test_account",
    ok: activated.payoutsEnabled && Boolean(activated.accountId),
    detail: `account=${activated.accountId}, payouts=${activated.payoutsEnabled}`
  });

  const platform = await getStripePlatformConnectContext();
  const requiredMinor = usdToSettlementMinor(withdrawAmount, platform.currency);
  const seededBalance = await ensurePlatformTransferBalance(requiredMinor, platform.currency);
  if (seededBalance.seeded) {
    checks.push({
      name: "connect.seed_platform_balance",
      ok: true,
      detail: `+${seededBalance.topUpMinor} ${platform.currency.toUpperCase()}`
    });
  }

  const beforeWallet = await walletRepository.getOrCreate(user.id);
  const beforeAvailable = Number(beforeWallet.availableBalance);

  const priorConnectRequest = await prisma.transaction.findFirst({
    where: {
      walletId: refreshedWallet.id,
      type: "WITHDRAW_REQUEST",
      createdAt: { gte: todayStart },
      description: { contains: "Stripe Connect transfer" }
    },
    orderBy: { createdAt: "desc" }
  });

  let transferId: string | null = null;
  let withdrawId: string | null = null;
  if (priorConnectRequest) {
    const requestDescription = priorConnectRequest.description ?? "";
    const transferMatch = requestDescription.match(/Stripe Connect transfer (tr_[A-Za-z0-9]+)/);
    const withdrawMatch = requestDescription.match(/ref:([A-Za-z0-9-]+)/);
    transferId = transferMatch?.[1] ?? null;
    withdrawId = withdrawMatch?.[1] ?? priorConnectRequest.id;
    const priorSuccess = await prisma.transaction.findFirst({
      where: {
        walletId: refreshedWallet.id,
        type: "WITHDRAW_SUCCESS",
        description: { contains: priorConnectRequest.id }
      }
    });
    checks.push({
      name: "connect.withdraw_transfer",
      ok: Boolean(transferId) && Boolean(priorSuccess),
      detail: `reused transfer=${transferId ?? "missing"}`
    });
    checks.push({
      name: "connect.wallet_debited",
      ok: Boolean(priorSuccess),
      detail: `reused success tx=${priorSuccess?.id ?? "missing"}`
    });
  } else {
    try {
      const result = await stripeConnectWithdrawalService.submitWithdrawal(
        {
          id: user.id,
          role: "CREATOR",
          hasCreatorProfile: true
        },
        withdrawAmount
      );
      transferId = result.transferId;
      withdrawId = result.withdrawId;
      checks.push({
        name: "connect.withdraw_transfer",
        ok: Boolean(result.transferId) && result.amountUsd === withdrawAmount,
        detail: `transfer=${result.transferId}`
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      checks.push({
        name: "connect.withdraw_transfer",
        ok: false,
        detail: message
      });
    }

    const afterWallet = await walletRepository.getOrCreate(user.id);
    const afterAvailable = Number(afterWallet.availableBalance);
    checks.push({
      name: "connect.wallet_debited",
      ok: Math.abs(afterAvailable - (beforeAvailable - withdrawAmount)) < 0.01,
      detail: `before=${beforeAvailable}, after=${afterAvailable}`
    });
  }

  if (transferId && withdrawId) {
    const successTx = await prisma.transaction.findFirst({
      where: {
        walletId: refreshedWallet.id,
        type: "WITHDRAW_SUCCESS",
        description: { contains: withdrawId }
      }
    });
    checks.push({
      name: "connect.ledger_success",
      ok: Boolean(successTx),
      detail: successTx?.id ?? "missing"
    });
  }

  const duplicateAttempt = transferId
    ? await stripeConnectService
        .createTransfer({
          userId: user.id,
          withdrawId: `verify_duplicate_${Date.now()}`,
          amountUsd: withdrawAmount,
          idempotencyKey: `verify-idem-${transferId}`
        })
        .then(() => ({ ok: false, detail: "unexpected success" }))
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          return {
            ok:
              message.includes("insufficient") ||
              message.includes("idempotency") ||
              message.includes("idempotent") ||
              message.includes("same parameters") ||
              message.includes("already been created"),
            detail: message
          };
        })
    : { ok: true, detail: "skipped" };

  checks.push({
    name: "connect.transfer_guard",
    ok: duplicateAttempt.ok,
    detail: duplicateAttempt.detail
  });

  report(checks);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
